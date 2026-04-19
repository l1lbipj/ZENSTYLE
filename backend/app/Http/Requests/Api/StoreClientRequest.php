<?php

namespace App\Http\Requests\Api;

use App\Support\ImageData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:100', 'min:2'],
            'phone' => [
                'nullable',
                'string',
                'max:15',
                'regex:/^[\+]?[0-9\-\(\)\s]+$/',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $existsInClient = \App\Models\Client::where('phone', $value)->exists();
                        $existsInStaff = \App\Models\Staff::where('phone', $value)->exists();
                        if ($existsInClient || $existsInStaff) {
                            $fail('The phone has already been taken.');
                        }
                    }
                },
            ],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:100',
                function ($attribute, $value, $fail) {
                    $existsInClient = \App\Models\Client::where('email', $value)->exists();
                    $existsInStaff = \App\Models\Staff::where('email', $value)->exists();
                    if ($existsInClient || $existsInStaff) {
                        $fail('The email has already been taken.');
                    }
                },
            ],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()->uncompromised()],
            'image_data' => ImageData::rules(),
            'dob' => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }
}
