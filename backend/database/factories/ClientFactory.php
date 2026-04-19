<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Client>
 */
class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        $first = fake()->firstName();
        $last = fake()->lastName();
        $email = strtolower($first . '.' . $last) . '+' . fake()->unique()->numberBetween(1000, 9999) . '@example.com';

        return [
            'client_name' => $first . ' ' . $last,
            'phone' => fake()->unique()->numerify('##########'),
            'email' => $email,
            'password' => Hash::make('Client@12345'),
            'dob' => fake()->dateTimeBetween('-45 years', '-16 years')->format('Y-m-d'),
            'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']),
            'membership_point' => fake()->numberBetween(0, 25000),
            'membership_tier' => fake()->randomElement(['bronze', 'silver', 'gold', 'platinum']),
        ];
    }
}

