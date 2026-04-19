<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        $company = fake()->unique()->company();

        return [
            'supplier_name' => $company,
            'email' => fake()->unique()->companyEmail(),
            'phone' => fake()->unique()->numerify('##########'),
        ];
    }
}

