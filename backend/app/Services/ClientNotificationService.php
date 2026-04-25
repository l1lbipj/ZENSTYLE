<?php

namespace App\Services;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class ClientNotificationService
{
    private const REMINDER_MINUTES_BEFORE = 120;
    private const REMINDER_WINDOW_MINUTES = 10;

    private function readCacheKey(int $clientId): string
    {
        return "client_notifications_read:{$clientId}";
    }

    private function readIds(int $clientId): array
    {
        $ids = Cache::get($this->readCacheKey($clientId), []);
        if (! is_array($ids)) {
            return [];
        }

        return array_values(array_unique(array_map('intval', $ids)));
    }

    private function storeReadIds(int $clientId, array $ids): void
    {
        Cache::put($this->readCacheKey($clientId), array_values(array_unique(array_map('intval', $ids))), now()->addMonths(6));
    }

    public function forgetReadState(int $clientId, int $appointmentId): void
    {
        $ids = array_values(array_filter(
            $this->readIds($clientId),
            fn (int $id) => $id !== $appointmentId
        ));

        $this->storeReadIds($clientId, $ids);
    }

    public function listForClient(int $clientId): array
    {
        $this->syncDueRemindersForClient($clientId);
        $readIds = $this->readIds($clientId);

        $appointments = Appointment::query()
            ->with([
                'appointmentDetails.service:service_id,service_name',
            ])
            ->where('client_id', $clientId)
            ->where('status', 'active')
            ->whereNotNull('reminder_sent_at')
            ->orderByDesc('reminder_sent_at')
            ->limit(20)
            ->get();

        $notifications = $appointments
            ->map(fn (Appointment $appointment) => $this->present($appointment, $readIds))
            ->filter()
            ->values();

        return [
            'notifications' => $notifications,
            'unread_count' => $notifications->where('is_read', false)->count(),
        ];
    }

    public function markAsRead(int $clientId, int $appointmentId): ?array
    {
        $this->syncDueRemindersForClient($clientId);
        $appointment = Appointment::query()
            ->with([
                'appointmentDetails.service:service_id,service_name',
            ])
            ->where('client_id', $clientId)
            ->where('status', 'active')
            ->whereNotNull('reminder_sent_at')
            ->find($appointmentId);

        if (! $appointment) {
            return null;
        }

        $readIds = $this->readIds($clientId);
        if (! in_array($appointmentId, $readIds, true)) {
            $readIds[] = $appointmentId;
            $this->storeReadIds($clientId, $readIds);
        }

        return $this->present($appointment, $this->readIds($clientId));
    }

    private function present(Appointment $appointment, array $readIds): ?array
    {
        if ((string) $appointment->reminder_sent_at === '') {
            return null;
        }

        $serviceName = $this->resolveServiceName($appointment);
        if ($serviceName === '') {
            $serviceName = 'Appointment';
        }

        $time = $appointment->appointment_date instanceof Carbon
            ? $appointment->appointment_date
            : Carbon::parse($appointment->appointment_date);

        return [
            'id' => (int) $appointment->getKey(),
            'user_id' => (int) $appointment->client_id,
            'title' => 'Appointment Reminder',
            'message' => "Your appointment is in 2 hours.\n\nService: {$serviceName}\nTime: ".$time->format('M d, Y h:i A'),
            'short_message' => "Your appointment is in 2 hours.",
            'service_name' => $serviceName,
            'time' => $time->toISOString(),
            'is_read' => in_array((int) $appointment->getKey(), $readIds, true),
            'created_at' => optional($appointment->reminder_sent_at)->toISOString() ?? $time->toISOString(),
        ];
    }

    private function resolveServiceName(Appointment $appointment): string
    {
        foreach ($appointment->appointmentDetails as $detail) {
            if (! empty($detail->service_id)) {
                return (string) ($detail->service?->service_name ?? '');
            }
        }

        return '';
    }

    private function syncDueRemindersForClient(int $clientId, ?Carbon $now = null): void
    {
        $now ??= now();
        $windowMinutes = max(1, (int) config('appointments.reminder_window_minutes', self::REMINDER_WINDOW_MINUTES));
        $halfWindow = (int) ceil($windowMinutes / 2);

        $windowStart = $now->copy()->addMinutes(self::REMINDER_MINUTES_BEFORE - $halfWindow);
        $windowEnd = $now->copy()->addMinutes(self::REMINDER_MINUTES_BEFORE + $halfWindow);

        $appointments = Appointment::query()
            ->with([
                'appointmentDetails.service:service_id,service_name',
            ])
            ->where('client_id', $clientId)
            ->where('status', 'active')
            ->whereBetween('appointment_date', [$windowStart, $windowEnd])
            ->where(function ($query): void {
                $query->whereNull('reminder_sent_at');

                if (Schema::hasColumn('appointments', 'reminder_sent')) {
                    $query->orWhere('reminder_sent', false);
                }
            })
            ->get();

        foreach ($appointments as $appointment) {
            if ($appointment->attendance_status !== 'Pending') {
                continue;
            }

            if (! $appointment->appointmentDetails->contains(function ($detail) {
                return ! empty($detail->service_id);
            })) {
                continue;
            }

            DB::transaction(function () use ($appointment, $now): void {
                $locked = Appointment::query()
                    ->with([
                        'appointmentDetails.service:service_id,service_name',
                    ])
                    ->whereKey($appointment->getKey())
                    ->lockForUpdate()
                    ->first();

                if (! $locked) {
                    return;
                }

                if ($locked->status !== 'active') {
                    return;
                }

                if ((string) ($locked->reminder_sent_at ?? '') !== '') {
                    return;
                }

                if (Schema::hasColumn('appointments', 'reminder_sent') && $locked->reminder_sent) {
                    return;
                }

                if (Schema::hasColumn('appointments', 'reminder_sent')) {
                    $locked->reminder_sent = true;
                }

                if (Schema::hasColumn('appointments', 'reminder_sent_at')) {
                    $locked->reminder_sent_at = $now;
                }

                $locked->save();

                $this->forgetReadState((int) $locked->client_id, (int) $locked->getKey());
            });
        }
    }
}
