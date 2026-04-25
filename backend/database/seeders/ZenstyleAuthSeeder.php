<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Staff;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ZenstyleAuthSeeder extends Seeder
{
    private function buildPhone(int $index, int $offset = 0): string
    {
        $areaCodes = ['202', '212', '213', '305', '312', '347', '415', '503', '617', '646'];
        $areaCode = $areaCodes[($index + $offset) % count($areaCodes)];
        $lineNumber = str_pad((string) (1000 + ($offset * 20) + $index), 4, '0', STR_PAD_LEFT);

        return '+1'.$areaCode.'555'.$lineNumber;
    }

    private function randomDob(int $minAge = 18, int $maxAge = 45): string
    {
        return fake()->dateTimeBetween('-'.$maxAge.' years', '-'.$minAge.' years')->format('Y-m-d');
    }

    public function run(): void
    {
        $now = now();

        $adminNames = [
            'Alicia Morgan', 'Daniel Reed', 'Hannah Brooks', 'Victor Chen', 'Naomi Parker',
            'Jordan Lee', 'Sophia Turner', 'Mason Hall', 'Chloe Bennett', 'Ethan Cooper',
            'Olivia Price', 'Ryan Foster', 'Grace Ramirez', 'Liam Carter', 'Emma Hughes',
            'Lucas Perry', 'Ava Mitchell', 'Henry Scott', 'Ella Adams', 'Noah King',
        ];

        foreach ($adminNames as $index => $adminName) {
            $email = $index === 0
                ? 'admin@zenstyle.com'
                : ($index === 1 ? 'manager@zenstyle.com' : 'admin'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).'@zenstyle.com');

            Admin::updateOrCreate(
                ['email' => $email],
                [
                    'admin_name' => $adminName,
                    'phone' => $this->buildPhone($index, 0),
                    'dob' => $this->randomDob(24, 50),
                    'password' => Hash::make($index === 0 ? 'Admin@12345' : ($index === 1 ? 'Manager@12345' : 'Admin@12345')),
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $staffNames = [
            'Michael Brown', 'Emily Johnson', 'Olivia Parker', 'Ethan Brooks', 'Sophia Nguyen',
            'Noah Walker', 'Ava Thompson', 'Liam Harris', 'Mia Chen', 'James Lee',
            'Isabella Clark', 'Benjamin Young', 'Charlotte Davis', 'Daniel Wilson', 'Amelia Martin',
            'Lucas Hall', 'Harper Allen', 'Elijah Scott', 'Evelyn Turner', 'Henry Adams',
        ];
        $specializations = [
            'Hair Stylist', 'Skincare Specialist', 'Colorist', 'Barber', 'Nail Technician',
            'Massage Therapist', 'Makeup Artist', 'Salon Coordinator',
        ];
        $staffRows = [];
        foreach ($staffNames as $index => $name) {
            $staffRows[] = [
                'email' => 'staff'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).'@zenstyle.com',
                'staff_name' => $name,
                'specialization' => $specializations[$index % count($specializations)],
                'phone' => $this->buildPhone($index, 1),
                'dob' => $this->randomDob(21, 42),
                'status' => $index < 17 ? 'active' : 'inactive',
            ];
        }

        foreach ($staffRows as $row) {
            Staff::updateOrCreate(
                ['email' => $row['email']],
                [
                    'staff_name' => $row['staff_name'],
                    'specialization' => $row['specialization'],
                    'phone' => $row['phone'],
                    'password' => Hash::make('Staff@12345'),
                    'dob' => $row['dob'],
                    'status' => $row['status'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $clientNames = [
            'John Smith', 'Sophia Davis', 'Grace Wilson', 'Henry Martin', 'Isabella Garcia',
            'Lucas Anderson', 'Emma Taylor', 'Olivia White', 'David Kim', 'Mila Brown',
            'Natalie Evans', 'Brian Foster', 'Chloe Walker', 'Evan Ramirez', 'Sophie Turner',
            'Aiden Cooper', 'Madison Reed', 'Samuel Parker', 'Lily Bennett', 'Caleb Brooks',
        ];
        $clientRows = [];
        foreach ($clientNames as $index => $name) {
            $points = 280 + (($index * 487) % 9200);
            $tier = match (true) {
                $points >= 8000 => 'platinum',
                $points >= 4000 => 'gold',
                $points >= 1500 => 'silver',
                default => 'bronze',
            };

            $clientRows[] = [
                'email' => 'client'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).'@zenstyle.com',
                'client_name' => $name,
                'phone' => $this->buildPhone($index, 2),
                'dob' => $this->randomDob(20, 45),
                'membership_point' => $points,
                'membership_tier' => $tier,
                'status' => $index % 9 === 8 ? 'inactive' : 'active',
            ];
        }

        foreach ($clientRows as $row) {
            Client::updateOrCreate(
                ['email' => $row['email']],
                [
                    'client_name' => $row['client_name'],
                    'phone' => $row['phone'],
                    'password' => Hash::make('Client@12345'),
                    'dob' => $row['dob'],
                    'status' => $row['status'],
                    'membership_point' => $row['membership_point'],
                    'membership_tier' => $row['membership_tier'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

    }
}
