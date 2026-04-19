<?php

namespace App\Support;

class ImageData
{
    public static function rules(bool $required = false): array
    {
        $rules = [$required ? 'required' : 'nullable', 'string'];
        $rules[] = function (string $attribute, mixed $value, \Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            $stringValue = trim((string) $value);
            if (! preg_match('/^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+\/=\r\n]+$/i', $stringValue)) {
                $fail("The {$attribute} must be a valid base64 image data URL.");

                return;
            }

            if (strlen($stringValue) > 7 * 1024 * 1024) {
                $fail("The {$attribute} may not be greater than 7MB.");
            }
        };

        return $rules;
    }
}
