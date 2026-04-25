<?php

namespace App\Http\Requests\Api;

use App\Http\Responses\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateClientPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $abilities = $this->user()?->currentAccessToken()?->abilities ?? [];

        return in_array('client', $abilities, true) || $this->user() instanceof \App\Models\Client;
    }

    public function rules(): array
    {
        return [
            'allergy_ids' => ['nullable', 'array'],
            'allergy_ids.*' => ['distinct', 'integer', Rule::exists('allergies', 'allergy_id')],
            'custom_allergies' => ['prohibited'],
            'preferred_staff' => ['nullable', 'array'],
            'preferred_staff.*.staff_id' => ['required', 'integer', Rule::exists('staff', 'staff_id')],
            'preferred_staff.*.note' => ['nullable', 'string'],
            'favorite_product_ids' => ['nullable', 'array'],
            'favorite_product_ids.*' => ['integer', Rule::exists('products', 'product_id')],
        ];
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
