<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\Feedback;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function isAdmin(Request $request): bool
    {
        return in_array('admin', $this->abilities($request), true);
    }

    private function isStaff(Request $request): bool
    {
        return in_array('staff', $this->abilities($request), true);
    }

    private function isClient(Request $request): bool
    {
        return in_array('client', $this->abilities($request), true);
    }

    private function baseQuery(): Builder
    {
        return Feedback::query()
            ->with([
                'customer:client_id,client_name,email',
                'staff:staff_id,staff_name',
                'appointment:appointment_id,appointment_date,client_id',
                'appointment.appointmentDetails:detail_id,appointment_id,service_id,staff_id,start_time,end_time,status,price',
                'appointment.appointmentDetails.service:service_id,service_name,duration',
            ])
            ->orderByDesc('created_at');
    }

    private function applyDateRange(Builder $query, ?string $from, ?string $to): void
    {
        if (! $from || ! $to) {
            return;
        }

        $start = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
        $end = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();

        $query->whereBetween('created_at', [$start, $end]);
    }

    private function mapServices($appointment): array
    {
        $serviceRows = [];

        foreach ($appointment?->appointmentDetails ?? [] as $detail) {
            if (empty($detail->service_id)) {
                continue;
            }

            $serviceModel = $detail->service;
            $serviceId = (int) ($serviceModel?->service_id ?? $detail->service_id ?? 0);
            if ($serviceId <= 0) {
                continue;
            }

            $serviceRows[$serviceId] = [
                'id' => $serviceId,
                'name' => (string) ($serviceModel?->service_name ?? 'Service'),
                'duration' => $serviceModel?->duration,
            ];
        }

        return array_values($serviceRows);
    }

    private function transform(Feedback $feedback): array
    {
        $comment = $feedback->comment;
        $reply = $feedback->reply;
        $appointment = $feedback->appointment;

        return [
            'id' => (int) $feedback->feedback_id,
            'appointment_id' => (int) $feedback->appointment_id,
            'customer_id' => $feedback->customer_id ? (int) $feedback->customer_id : null,
            'staff_id' => $feedback->staff_id ? (int) $feedback->staff_id : null,
            'rating' => (int) $feedback->rating,
            'comment' => $comment,
            'notes' => $comment,
            'reply' => $reply,
            'manager_reply' => $reply,
            'created_at' => optional($feedback->created_at)?->toISOString(),
            'replied_at' => optional($feedback->replied_at)?->toISOString(),
            'customer' => $feedback->customer ? [
                'id' => (int) $feedback->customer->client_id,
                'name' => $feedback->customer->client_name,
                'email' => $feedback->customer->email,
            ] : null,
            'staff' => $feedback->staff ? [
                'id' => (int) $feedback->staff->staff_id,
                'name' => $feedback->staff->staff_name,
            ] : null,
            'appointment' => $appointment ? [
                'id' => (int) $appointment->appointment_id,
                'datetime' => optional($appointment->appointment_date)?->toISOString(),
                'services' => $this->mapServices($appointment),
            ] : null,
        ];
    }

    private function resolveFeedbackStaffId(Appointment $appointment): ?int
    {
        $detail = $appointment->appointmentDetails()
            ->whereNotNull('staff_id')
            ->whereNotNull('service_id')
            ->orderBy('detail_id')
            ->first(['staff_id']);

        return $detail?->staff_id ? (int) $detail->staff_id : null;
    }

    public function index(Request $request)
    {
        $query = $this->baseQuery();

        $validated = $request->validate([
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = $validated['from_date'] ?? $validated['from'] ?? null;
        $to = $validated['to_date'] ?? $validated['to'] ?? null;
        $this->applyDateRange($query, $from, $to);

        if ($this->isClient($request)) {
            $query->where(function (Builder $builder) use ($request) {
                $builder->where('customer_id', $request->user()->getKey())
                    ->orWhereHas('appointment', function ($appointmentQuery) use ($request) {
                        $appointmentQuery->where('client_id', $request->user()->getKey());
                    });
            });
        } elseif ($this->isStaff($request)) {
            $query->where('staff_id', $request->user()->getKey());
        } elseif (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $paginated = $query->paginate((int) $request->query('per_page', 10));
        $paginated->setCollection($paginated->getCollection()->map(fn (Feedback $feedback) => $this->transform($feedback)));

        return ApiResponse::success($paginated, 'Feedback list retrieved.');
    }

    public function adminIndex(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            // Support both `from_date/to_date` (spec) and older/alternate `from/to`.
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = $validated['from_date'] ?? $validated['from'] ?? null;
        $to = $validated['to_date'] ?? $validated['to'] ?? null;

        $query = $this->baseQuery();
        if ($from && $to) {
            $start = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
            $end = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();
            $query->whereBetween('created_at', [$start, $end]);
        }

        $rows = $query->get()->map(fn (Feedback $feedback) => $this->transform($feedback))->values();

        return ApiResponse::success($rows, 'Admin feedback list retrieved.');
    }

    public function staffIndex(Request $request)
    {
        if (! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = $validated['from_date'] ?? $validated['from'] ?? null;
        $to = $validated['to_date'] ?? $validated['to'] ?? null;

        $query = $this->baseQuery()
            ->where('staff_id', $request->user()->getKey())
            ;

        $this->applyDateRange($query, $from, $to);

        $rows = $query
            ->get()
            ->map(fn (Feedback $feedback) => $this->transform($feedback))
            ->values();

        return ApiResponse::success($rows, 'Staff feedback list retrieved.');
    }

    public function store(Request $request)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'appointment_id' => ['required', 'integer', 'exists:appointments,appointment_id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment = Appointment::find($validated['appointment_id']);
        if (! $appointment || (int) $appointment->client_id !== (int) $request->user()->getKey()) {
            return ApiResponse::error('You can only feedback your own appointment.', 403, 'FORBIDDEN');
        }

        if ((string) $appointment->status !== 'inactive') {
            return ApiResponse::error('You can only submit feedback after the appointment is completed.', 422, 'APPOINTMENT_NOT_COMPLETED');
        }

        $comment = $validated['comment'] ?? $validated['notes'] ?? null;
        $staffId = $this->resolveFeedbackStaffId($appointment);

        $feedback = Feedback::updateOrCreate(
            ['appointment_id' => $appointment->appointment_id],
            [
                'customer_id' => (int) $request->user()->getKey(),
                'staff_id' => $staffId,
                'rating' => (int) $validated['rating'],
                'comment' => $comment,
                'notes' => $comment,
            ]
        );

        return ApiResponse::success(
            $this->transform($feedback->fresh(['customer', 'staff', 'appointment.appointmentDetails.service'])),
            'Feedback submitted.'
        );
    }

    public function reply(Request $request, string $id)
    {
        if (! $this->isAdmin($request) && ! $this->isStaff($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'reply' => ['required', 'string', 'max:2000'],
            'manager_reply' => ['nullable', 'string', 'max:2000'],
        ]);

        $feedback = Feedback::with([
            'customer:client_id,client_name,email',
            'staff:staff_id,staff_name',
            'appointment:appointment_id,appointment_date,client_id',
            'appointment.appointmentDetails:detail_id,appointment_id,service_id,staff_id,start_time,end_time,status,price',
            'appointment.appointmentDetails.service:service_id,service_name,duration',
        ])->find($id);

        if (! $feedback) {
            return ApiResponse::error('Feedback not found.', 404, 'NOT_FOUND');
        }

        if ($this->isStaff($request) && (int) $feedback->staff_id !== (int) $request->user()->getKey()) {
            return ApiResponse::error('You can only reply to your own feedback.', 403, 'FORBIDDEN');
        }

        $reply = $validated['reply'] ?? $validated['manager_reply'] ?? null;
        $feedback->reply = $reply;
        $feedback->manager_reply = $reply;
        $feedback->replied_at = now();
        $feedback->save();

        $freshFeedback = $feedback->fresh([
            'customer:client_id,client_name,email',
            'staff:staff_id,staff_name',
            'appointment:appointment_id,appointment_date,client_id',
            'appointment.appointmentDetails:detail_id,appointment_id,service_id,staff_id,start_time,end_time,status,price',
            'appointment.appointmentDetails.service:service_id,service_name,duration',
        ]);

        return ApiResponse::success($this->transform($freshFeedback), 'Feedback reply saved.');
    }
}
