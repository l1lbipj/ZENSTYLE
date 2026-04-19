<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use App\Http\Responses\ApiResponse;
use App\Support\ImageData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $id = (int) $this->route('id');
        $abilities = $this->user()?->currentAccessToken()?->abilities ?? [];
        $isAdmin = in_array('admin', $abilities, true);

        return $isAdmin || (int) $this->user()?->getKey() === $id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'client_name' => ['sometimes', 'string', 'max:100', 'min:2'],
            'phone' => [
                'nullable',
                'string',
                'max:15',
                'regex:/^[\+]?[0-9\-\(\)\s]+$/',
                function ($attribute, $value, $fail) use ($id) {
                    if ($value) {
                        $existsInClient = \App\Models\Client::where('phone', $value)->where('client_id', '!=', $id)->exists();
                        $existsInStaff = \App\Models\Staff::where('phone', $value)->exists();
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
                    $existsInClient = \App\Models\Client::where('email', $value)->where('client_id', '!=', $id)->exists();
                    $existsInStaff = \App\Models\Staff::where('email', $value)->exists();
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
            'image_data' => ['sometimes', ...ImageData::rules()],
            'dob' => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'status' => ['nullable', 'in:active,inactive'],
            'membership_point' => ['nullable', 'integer', 'min:0', 'max:1000000'],
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
