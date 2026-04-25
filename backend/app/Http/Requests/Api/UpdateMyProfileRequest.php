<?php

namespace App\Http\Requests\Api;

use App\Http\Responses\ApiResponse;
use App\Support\ImageData;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class UpdateMyProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $abilities = $this->user()?->currentAccessToken()?->abilities ?? [];
        $user = $this->user();
        $isClient = in_array('client', $abilities, true)
            || $user instanceof \App\Models\Client
            || $this->filled('allergy_ids')
            || $this->filled('client_name');
        $isStaff = in_array('staff', $abilities, true) || $user instanceof \App\Models\Staff;
        $isAdmin = in_array('admin', $abilities, true) || $user instanceof \App\Models\Admin;

        $rules = [
            'phone' => ['nullable', 'string', 'max:15', 'regex:/^[\+]?[0-9\-\(\)\s]+$/'],
            'email' => ['sometimes', 'email:rfc,dns', 'max:100'],
            'dob' => ['nullable', 'date', 'before:today', 'after:1900-01-01'],
            'image_data' => ['sometimes', ...ImageData::rules()],
            'password' => ['nullable', 'string', 'confirmed', 'min:8'],
        ];

        if ($isClient) {
            $rules['name'] = ['required_without:client_name', 'string', 'min:2', 'max:100'];
            $rules['client_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
            $rules['allergy_ids'] = ['nullable', 'array'];
            $rules['allergy_ids.*'] = ['distinct', 'integer', Rule::exists('allergies', 'allergy_id')];
            $rules['custom_allergies'] = ['prohibited'];
        } elseif ($isStaff) {
            $rules['name'] = ['required_without:staff_name', 'string', 'min:2', 'max:100'];
            $rules['staff_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
            $rules['specialization'] = ['sometimes', 'string', 'max:100'];
        } elseif ($isAdmin) {
            $rules['name'] = ['required_without:admin_name', 'string', 'min:2', 'max:100'];
            $rules['admin_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
        } else {
            $rules['name'] = ['required_without:admin_name', 'string', 'min:2', 'max:100'];
            $rules['admin_name'] = ['required_without:name', 'string', 'min:2', 'max:100'];
        }

        return $rules;
    }

    protected function failedAuthorization(): void
    {
        throw new HttpResponseException(ApiResponse::error('Unauthenticated.', 401, 'UNAUTHENTICATED'));
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed.', 422, 'VALIDATION_ERROR', $validator->errors()->toArray())
        );
    }
}
