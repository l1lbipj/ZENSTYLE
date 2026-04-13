<?php

namespace App\Http\Requests\Api;

use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateStaffRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $id = (int) $this->route('id');
        return (int) $this->user()->getKey() === $id; // Chỉ cho phép update chính mình
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'staff_name' => ['sometimes', 'string', 'max:100', 'min:2'],
            'specialization' => ['sometimes', 'string', 'max:100'],
            'phone' => [
                'nullable',
                'string',
                'max:15',
                'regex:/^[\+]?[0-9\-\(\)\s]+$/',
                function ($attribute, $value, $fail) use ($id) {
                    if ($value) {
                        $existsInClient = \App\Models\Client::where('phone', $value)->exists();
                        $existsInStaff = \App\Models\Staff::where('phone', $value)->where('staff_id', '!=', $id)->exists();
                        if ($existsInClient || $existsInStaff) {
                            $fail('The phone has already been taken.');
                        }
                    }
                },
            ],
            'email' => [
                'sometimes',
                'email:rfc,dns',
                'max:100',
                function ($attribute, $value, $fail) use ($id) {
                    $existsInClient = \App\Models\Client::where('email', $value)->exists();
                    $existsInStaff = \App\Models\Staff::where('email', $value)->where('staff_id', '!=', $id)->exists();
                    if ($existsInClient || $existsInStaff) {
                        $fail('The email has already been taken.');
                    }
                },
            ],
            'password' => [
                'nullable',
                'string',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols()->uncompromised(),
            ],
            'dob' => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            ApiResponse::error(
                'You are not allowed to modify this staff record.',
                403,
                'FORBIDDEN',
            ),
        );
    }
}
