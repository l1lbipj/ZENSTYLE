<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    public function index(Request $request)
    {
        $abilities = $this->abilities($request);
        $query = Feedback::query()
            ->with([
                'appointment:appointment_id,client_id,appointment_date',
                'appointment.client:client_id,client_name,email',
            ])
            ->orderByDesc('created_at');

        if (in_array('client', $abilities, true)) {
            $query->whereHas('appointment', function ($q) use ($request) {
                $q->where('client_id', $request->user()->getKey());
            });
        } elseif (in_array('staff', $abilities, true)) {
            $staffId = $request->user()->getKey();
            $query->whereHas('appointment.appointmentDetails', function ($q) use ($staffId) {
                $q->where('staff_id', $staffId);
                $q->where('item_type', 'service');
            });
        } elseif (! in_array('admin', $abilities, true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        return ApiResponse::success(
            $query->paginate((int) $request->query('per_page', 10)),
            'Feedback list retrieved.'
        );
    }

    public function store(Request $request)
    {
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'appointment_id' => ['required', 'integer', 'exists:appointments,appointment_id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment = Appointment::find($validated['appointment_id']);
        if (! $appointment || (int) $appointment->client_id !== (int) $request->user()->getKey()) {
            return ApiResponse::error('You can only feedback your own appointment.', 403, 'FORBIDDEN');
        }

        $feedback = Feedback::updateOrCreate(
            ['appointment_id' => $appointment->appointment_id],
            ['rating' => $validated['rating'], 'notes' => $validated['notes'] ?? null]
        );

        return ApiResponse::success($feedback->fresh(), 'Feedback submitted.');
    }

    public function reply(Request $request, string $id)
    {
        if (! in_array('admin', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'manager_reply' => ['required', 'string', 'max:2000'],
        ]);

        $feedback = Feedback::find($id);
        if (! $feedback) {
            return ApiResponse::error('Feedback not found.', 404, 'NOT_FOUND');
        }

        $feedback->manager_reply = $validated['manager_reply'];
        $feedback->replied_at = now();
        $feedback->save();

        return ApiResponse::success($feedback->fresh(), 'Feedback reply saved.');
    }
}
