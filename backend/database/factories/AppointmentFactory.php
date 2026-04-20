<?php

namespace Database\Factories;

use App\Models\Appointment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $date = fake()->dateTimeBetween('-20 days', '+7 days');
        $isFuture = $date > now();
        $status = $isFuture ? 'active' : fake()->randomElement(['inactive', 'inactive', 'active']);
        $paymentStatus = $status === 'inactive'
            ? fake()->randomElement(['pay', 'pay', 'unpay'])
            : 'unpay';

        $total = fake()->randomFloat(2, 25, 220);
        $discountPercent = fake()->randomElement([0, 0, 10, 15, 20]);
        $final = max(1, round($total * (1 - ($discountPercent / 100)), 2));

        return [
            'appointment_date' => $date,
            'total_amount' => $total,
            'final_amount' => $final,
            'payment_method' => fake()->randomElement(['cash', 'card']),
            'payment_status' => $paymentStatus,
            'status' => $status,
        ];
    }
}
