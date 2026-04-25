<?php

namespace App\Http\Requests\Api;

use App\Http\Responses\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    private const BUSINESS_START = '07:00';
    private const BUSINESS_END = '22:00';

    public function authorize(): bool
    {
        $abilities = $this->user()?->currentAccessToken()?->abilities ?? [];

        return count(array_intersect(['admin', 'staff', 'client'], $abilities)) > 0;
    }

    private function timeToMinutes(string $time): int
    {
        [$hour, $minute] = array_pad(explode(':', $time, 2), 2, '0');

        return ((int) $hour * 60) + (int) $minute;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['nullable', 'integer', Rule::exists('clients', 'client_id')],
            'appointment_date' => ['nullable', 'date', 'after_or_equal:today'],
            'promotion_id' => ['nullable', 'integer', Rule::exists('promotions', 'promotion_id')],
            'payment_method' => ['nullable', Rule::in(['cash', 'card'])],
            'notification_preference' => ['nullable', Rule::in(['sms', 'email', 'both'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_type' => ['required', Rule::in(['service'])],
            'items.*.item_id' => ['required', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:1'],
            'items.*.staff_id' => ['nullable', 'integer', Rule::exists('staff', 'staff_id')],
            'items.*.start_time' => ['nullable', 'date_format:H:i'],
            'items.*.end_time' => ['nullable', 'date_format:H:i'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $serviceCount = collect($this->input('items', []))
                ->where('item_type', 'service')
                ->count();

            if ($serviceCount > 3) {
                $validator->errors()->add('items', 'You can select at most 3 services per appointment.');
            }

            if ($serviceCount > 0 && empty($this->input('appointment_date'))) {
                $validator->errors()->add('appointment_date', 'appointment_date is required for service items.');
            }

            foreach (collect($this->input('items', []))->values() as $index => $item) {
                if (($item['item_type'] ?? null) !== 'service') {
                    continue;
                }

                $startTime = (string) ($item['start_time'] ?? '');
                $endTime = (string) ($item['end_time'] ?? '');
                if ($startTime === '' || $endTime === '') {
                    continue;
                }

                $startMinutes = $this->timeToMinutes($startTime);
                $endMinutes = $this->timeToMinutes($endTime);
                $minMinutes = $this->timeToMinutes(self::BUSINESS_START);
                $maxMinutes = $this->timeToMinutes(self::BUSINESS_END);

                if ($startMinutes < $minMinutes || $endMinutes > $maxMinutes) {
                    $validator->errors()->add(
                        "items.$index.start_time",
                        'Service time must be between 07:00 and 22:00.',
                    );
                }

                if ($startMinutes >= $endMinutes) {
                    $validator->errors()->add(
                        "items.$index.end_time",
                        'Service end time must be after start time.',
                    );
                }
            }
        });
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(ApiResponse::error('Access denied.', 403, 'FORBIDDEN'));
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed.', 422, 'VALIDATION_ERROR', $validator->errors()->toArray())
        );
    }
}
