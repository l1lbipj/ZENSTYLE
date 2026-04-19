<?php

namespace Database\Factories;

use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    protected $model = Staff::class;

    public function definition(): array
    {
        $first = fake()->firstName();
        $last = fake()->lastName();
        $email = strtolower($first . '.' . $last) . '+' . fake()->unique()->numberBetween(1000, 9999) . '@zenstyle.com';

        return [
            'staff_name' => $first . ' ' . $last,
            'specialization' => fake()->randomElement([
                'Hair Stylist',
                'Skincare Specialist',
                'Nail Technician',
                'Makeup Artist',
                'Barber',
            ]),
            'phone' => fake()->unique()->numerify('##########'),
            'email' => $email,
            'password' => Hash::make('Staff@12345'),
            'dob' => fake()->date('Y-m-d', '-20 years'),
            'status' => 'active',
        ];
    }
}

