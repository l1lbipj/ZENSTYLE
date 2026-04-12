<?php

namespace App\Http\Requests\Api;

use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $id = (int) $this->route('id');

        return (int) $this->user()->getKey() === $id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'client_name' => ['sometimes', 'string', 'max:100'],
            'phone' => [
                'nullable',
                'string',
                'max:15',
                Rule::unique('client', 'phone')->ignore($id, 'client_id'),
            ],
            'email' => [
                'sometimes',
                'email',
                'max:100',
                Rule::unique('client', 'email')->ignore($id, 'client_id'),
            ],
            'password' => [
                'nullable',
                'string',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
            'dob' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive'],
            'membership_point' => ['nullable', 'integer', 'min:0'],
            'membership_tier' => ['nullable', Rule::in(['bronze', 'silver', 'gold', 'platinum'])],
        ];
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(
            ApiResponse::error(
                'You are not allowed to modify this client record.',
                403,
                'FORBIDDEN',
            ),
        );
    }
}
