<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Staff;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class ZenstyleFullSeeder extends Seeder
{
    private const MIN_ROWS = 30;

    public function run(): void
    {
        $now = now();
        $usesMixedItemSchema = Schema::hasColumn('appointment_details', 'item_id');

        // Reset tables (domain + auth tables). Skip cache/jobs tables on purpose.
        Schema::disableForeignKeyConstraints();
        foreach ([
            'appointment_details',
            'feedback',
            'appointments',
            'promotions',
            'client_staff_preferences',
            'client_allergies',
            'client_favorite_products',
            'client_product_preferences',
            'staff_schedules',
            'work_shifts',
            'services',
            'service_categories',
            'inventory_logs',
            'order_details',
            'purchase_orders',
            'suppliers',
            'products',
            'allergies',
            'password_reset_otps',
            'personal_access_tokens',
            'password_reset_tokens',
            'sessions',
            'staff',
            'clients',
            'users',
        ] as $table) {
            DB::table($table)->truncate();
        }
        Schema::enableForeignKeyConstraints();

        // Users (built-in, not used by API roles but kept populated for completeness)
        User::factory(self::MIN_ROWS)->create();

        // Staff
        Staff::factory(self::MIN_ROWS)->create([
            'password' => Hash::make('Staff@12345'),
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Clients
        Client::factory(self::MIN_ROWS)->create([
            'password' => Hash::make('Client@12345'),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Stable demo accounts (easier local login than random factory emails)
        $demoStaffPhone = '0900000001';
        while (DB::table('staff')->where('phone', $demoStaffPhone)->exists()) {
            $demoStaffPhone = '09' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }

        $demoClientPhone = '0900000002';
        while (DB::table('clients')->where('phone', $demoClientPhone)->exists()) {
            $demoClientPhone = '09' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }
        $demoStaffPhone1 = '0901111111';
        while (DB::table('staff')->where('phone', $demoStaffPhone1)->exists()) {
            $demoStaffPhone1 = '09' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }
        $demoStaffPhone2 = '0902222222';
        while (DB::table('staff')->where('phone', $demoStaffPhone2)->exists() || $demoStaffPhone2 === $demoStaffPhone1) {
            $demoStaffPhone2 = '09' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }
        $demoClientPhone1 = '0911111111';
        while (DB::table('clients')->where('phone', $demoClientPhone1)->exists()) {
            $demoClientPhone1 = '09' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }
        $demoClientPhone2 = '0922222222';
        while (DB::table('clients')->where('phone', $demoClientPhone2)->exists() || $demoClientPhone2 === $demoClientPhone1) {
            $demoClientPhone2 = '09' . str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }

        Staff::updateOrCreate(
            ['email' => 'staff@zenstyle.com'],
            [
                'staff_name' => 'Demo Staff',
                'specialization' => 'Hair Stylist',
                'phone' => $demoStaffPhone,
                'password' => Hash::make('Staff@12345'),
                'dob' => '1998-01-01',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
        Staff::updateOrCreate(
            ['email' => 'staff1@zenstyle.com'],
            [
                'staff_name' => 'Demo Staff 1',
                'specialization' => 'Hair Stylist',
                'phone' => $demoStaffPhone1,
                'password' => Hash::make('Staff@12345'),
                'dob' => '1998-01-02',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
        Staff::updateOrCreate(
            ['email' => 'staff2@zenstyle.com'],
            [
                'staff_name' => 'Demo Staff 2',
                'specialization' => 'Skincare Specialist',
                'phone' => $demoStaffPhone2,
                'password' => Hash::make('Staff@12345'),
                'dob' => '1998-01-03',
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        Client::updateOrCreate(
            ['email' => 'client@zenstyle.com'],
            [
                'client_name' => 'Demo Client',
                'phone' => $demoClientPhone,
                'password' => Hash::make('Client@12345'),
                'dob' => '2000-01-01',
                'status' => 'active',
                'membership_point' => 0,
                'membership_tier' => 'bronze',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
        Client::updateOrCreate(
            ['email' => 'client1@zenstyle.com'],
            [
                'client_name' => 'Demo Client 1',
                'phone' => $demoClientPhone1,
                'password' => Hash::make('Client@12345'),
                'dob' => '2000-01-02',
                'status' => 'active',
                'membership_point' => 0,
                'membership_tier' => 'bronze',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
        Client::updateOrCreate(
            ['email' => 'client2@zenstyle.com'],
            [
                'client_name' => 'Demo Client 2',
                'phone' => $demoClientPhone2,
                'password' => Hash::make('Client@12345'),
                'dob' => '2000-01-03',
                'status' => 'active',
                'membership_point' => 0,
                'membership_tier' => 'bronze',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        // Lookup tables
        DB::table('allergies')->insert(array_map(fn ($name) => [
            'allergy_name' => $name,
            'created_at' => $now,
            'updated_at' => $now,
        ], [
            'Fragrance',
            'Alcohol',
            'Paraben',
            'Peppermint oil',
            'Latex',
            'Hair dye (PPD)',
            'AHA/BHA acids',
            'Pollen',
            'Tea tree oil',
            'Milk proteins',
        ]));

        DB::table('service_categories')->insert(array_map(fn ($name) => [
            'category_name' => $name,
            'created_at' => $now,
            'updated_at' => $now,
        ], [
            "Women's Hair",
            "Men's Hair",
            'Skincare',
            'Nail Care',
            'Makeup',
            'Herbal Hair Wash',
            'Massage & Relaxation',
        ]));

        $categoryIds = DB::table('service_categories')->pluck('category_id')->all();
        $services = [
            ["Women's Haircut & Blowout", 55.00, 60, 'A tailored haircut finished with a smooth blow-dry and light styling. Includes a quick consultation to match your face shape and routine.'],
            ["Men's Barber Cut", 35.00, 45, 'A clean, classic barber cut with neckline detailing and simple styling. Great for both business and casual looks.'],
            ['Cold Perm / Setting Perm', 135.00, 120, 'Soft, natural curls designed to hold shape while keeping hair touchable. Finished with after-care tips for longer-lasting results.'],
            ['Root Touch-Up / Gray Coverage', 95.00, 90, 'Even color coverage focused on regrowth and grays for a natural finish. Includes a protective treatment to reduce dryness.'],
            ['Keratin Repair Treatment', 120.00, 75, 'A restorative treatment to reduce frizz and improve shine. Helps hair feel smoother and more manageable for weeks.'],
            ['Signature Facial (60 min)', 75.00, 60, 'Cleansing, gentle exfoliation, and hydration tailored to your skin. Finished with a calming mask and moisturizer.'],
            ['Advanced Facial (90 min)', 110.00, 90, 'A deeper treatment with targeted serums and extended massage. Ideal for boosting glow and improving texture.'],
            ['Gel Manicure', 45.00, 60, 'A long-lasting gel manicure with a clean finish and glossy color. Includes shaping and cuticle care.'],
            ['Herbal Hair Wash & Scalp Massage', 40.00, 60, 'Relaxing wash with an herbal rinse and a focused scalp massage. Helps relieve tension around the neck and shoulders.'],
            ['Event Makeup', 95.00, 75, 'Long-wear makeup tailored to your outfit and skin tone. Includes simple touch-up tips for the rest of the day.'],
        ];
        $serviceRows = [];
        foreach ($services as $idx => [$name, $price, $duration, $desc]) {
            $serviceRows[] = [
                'service_name' => $name,
                'price' => $price,
                'duration' => $duration,
                'description' => $desc,
                'category_id' => $categoryIds[$idx % count($categoryIds)],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('services')->insert($serviceRows);

        $shiftRows = [];
        foreach (['Morning Shift', 'Afternoon Shift', 'Evening Shift'] as $name) {
            $shiftRows[] = ['shift_name' => $name, 'created_at' => $now, 'updated_at' => $now];
        }
        DB::table('work_shifts')->insert($shiftRows);

        // Suppliers & products
        Supplier::factory(6)->create([
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $productRows = [];
        $productBlueprints = [
            // Haircare (12-55)
            ['Argan Repair Shampoo (500ml)', 'Haircare', [14.00, 32.00]],
            ['Keratin Smoothing Conditioner (500ml)', 'Haircare', [16.00, 35.00]],
            ['Deep Repair Hair Mask (250g)', 'Haircare', [18.00, 42.00]],
            ['Heat Protect Spray (200ml)', 'Haircare', [12.00, 28.00]],
            ['Scalp Detox Scrub (150ml)', 'Haircare', [16.00, 34.00]],
            ['Leave-In Treatment Cream (150ml)', 'Haircare', [15.00, 36.00]],

            // Styling (10-40)
            ['Texturizing Sea Salt Spray (200ml)', 'Styling', [12.00, 26.00]],
            ['Strong Hold Hair Spray (300ml)', 'Styling', [10.00, 22.00]],
            ['Curl Defining Cream (200ml)', 'Styling', [14.00, 30.00]],
            ['Matte Finish Clay (100g)', 'Styling', [12.00, 28.00]],

            // Skincare (9-75)
            ['Gentle Face Cleanser (150ml)', 'Skincare', [9.00, 22.00]],
            ['Hydrating Toner (200ml)', 'Skincare', [12.00, 28.00]],
            ['Vitamin C Serum (30ml)', 'Skincare', [22.00, 55.00]],
            ['Daily SPF50 Sunscreen (50ml)', 'Skincare', [16.00, 38.00]],
            ['Moisture Barrier Cream (50ml)', 'Skincare', [18.00, 45.00]],

            // Tools (25-190)
            ['Ceramic Hair Dryer (2000W)', 'Tools', [65.00, 160.00]],
            ['Ionic Straightener', 'Tools', [55.00, 150.00]],
            ['Professional Curling Iron', 'Tools', [45.00, 120.00]],
            ['Detangling Brush', 'Tools', [8.00, 20.00]],
        ];

        $productCount = max(self::MIN_ROWS, count($productBlueprints));
        for ($i = 1; $i <= $productCount; $i++) {
            [$baseName, $category, [$minPrice, $maxPrice]] = $productBlueprints[($i - 1) % count($productBlueprints)];

            $variant = fake()->randomElement(['Original', 'Fragrance-Free', 'Salon Edition', 'Sensitive', 'Hydrating', 'Repair']);

            $stock = fake()->numberBetween(10, 200);
            $minStock = fake()->numberBetween(5, 25);
            $reorderLevel = fake()->numberBetween($minStock, min(80, $minStock + 35));
            $unitPrice = fake()->randomFloat(2, $minPrice, $maxPrice);

            $productRows[] = [
                'product_name' => Str::limit("{$baseName} - {$variant}", 50, ''),
                'category' => $category,
                'description' => implode(' ', [
                    'Salon-grade formula designed for daily use and visible results.',
                    'Made to complement professional treatments and home care routines.',
                    'Directions and safety notes are included on the label.',
                ]),
                'image_url' => fake()->randomElement([
                    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
                    'https://images.unsplash.com/photo-1526045478516-99145907023c',
                    'https://images.unsplash.com/photo-1556228578-56786d4f3425',
                ]),
                'stock_quantity' => $stock,
                'reorder_level' => $reorderLevel,
                'unit_price' => $unitPrice,
                'min_stock_level' => $minStock,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('products')->insert($productRows);

        // Purchase orders + details
        $supplierIds = DB::table('suppliers')->pluck('supplier_id')->all();
        $productIds = DB::table('products')->pluck('product_id')->all();
        $orderIds = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $orderIds[] = DB::table('purchase_orders')->insertGetId([
                'supplier_id' => $supplierIds[array_rand($supplierIds)],
                'order_date' => $now->copy()->subDays(fake()->numberBetween(1, 60))->toDateString(),
                'total_amount' => fake()->randomFloat(2, 250.00, 4500.00),
                'status' => fake()->randomElement(['active', 'inactive']),
                'created_at' => $now,
                'updated_at' => $now,
            ], 'order_id');
        }

        $orderDetailRows = [];
        foreach ($orderIds as $orderId) {
            $picked = [];
            foreach (range(1, 2) as $_) {
                $productId = $productIds[array_rand($productIds)];
                while (isset($picked[$productId])) {
                    $productId = $productIds[array_rand($productIds)];
                }
                $picked[$productId] = true;

                $orderDetailRows[] = [
                    'order_id' => $orderId,
                    'product_id' => $productId,
                    'import_price' => fake()->randomFloat(2, 4.00, 80.00),
                    'quantity' => fake()->numberBetween(5, 40),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        DB::table('order_details')->insert($orderDetailRows);

        // Inventory logs
        $inventoryRows = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $productId = $productIds[array_rand($productIds)];
            $inventoryRows[] = [
                'product_id' => $productId,
                'change_amount' => fake()->randomElement([-5, -3, -2, -1, 1, 2, 5, 10]),
                'reason' => fake()->randomElement(['Used for service', 'Restock', 'Wastage', 'Inventory adjustment']),
                'created_at' => $now->copy()->subDays(fake()->numberBetween(0, 30)),
                'updated_at' => $now,
            ];
        }
        DB::table('inventory_logs')->insert($inventoryRows);

        // Preferences & references (unique pairs)
        $clientIds = DB::table('clients')->pluck('client_id')->all();
        $staffIds = DB::table('staff')->pluck('staff_id')->all();
        $allergyIds = DB::table('allergies')->pluck('allergy_id')->all();

        $pairs = [];
        $clientAllergyRows = [];
        while (count($clientAllergyRows) < self::MIN_ROWS) {
            $clientId = $clientIds[array_rand($clientIds)];
            $allergyId = $allergyIds[array_rand($allergyIds)];
            $key = $clientId.'-'.$allergyId;
            if (isset($pairs[$key])) {
                continue;
            }
            $pairs[$key] = true;
            $clientAllergyRows[] = [
                'client_id' => $clientId,
                'allergy_id' => $allergyId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('client_allergies')->insert($clientAllergyRows);

        $pairs = [];
        $clientProductPreferenceRows = [];
        while (count($clientProductPreferenceRows) < self::MIN_ROWS) {
            $clientId = $clientIds[array_rand($clientIds)];
            $allergyId = $allergyIds[array_rand($allergyIds)];
            $key = $clientId.'-'.$allergyId;
            if (isset($pairs[$key])) {
                continue;
            }
            $pairs[$key] = true;
            $clientProductPreferenceRows[] = [
                'client_id' => $clientId,
                'allergy_id' => $allergyId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('client_product_preferences')->insert($clientProductPreferenceRows);

        $pairs = [];
        $clientStaffPreferenceRows = [];
        while (count($clientStaffPreferenceRows) < self::MIN_ROWS) {
            $clientId = $clientIds[array_rand($clientIds)];
            $staffId = $staffIds[array_rand($staffIds)];
            $key = $clientId.'-'.$staffId;
            if (isset($pairs[$key])) {
                continue;
            }
            $pairs[$key] = true;
            $clientStaffPreferenceRows[] = [
                'client_id' => $clientId,
                'staff_id' => $staffId,
                'note' => fake()->sentence(10),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('client_staff_preferences')->insert($clientStaffPreferenceRows);

        $pairs = [];
        $favoriteRows = [];
        while (count($favoriteRows) < self::MIN_ROWS) {
            $clientId = $clientIds[array_rand($clientIds)];
            $productId = $productIds[array_rand($productIds)];
            $key = $clientId.'-'.$productId;
            if (isset($pairs[$key])) {
                continue;
            }
            $pairs[$key] = true;
            $favoriteRows[] = [
                'client_id' => $clientId,
                'product_id' => $productId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('client_favorite_products')->insert($favoriteRows);

        // Staff schedules (unique staff/date/shift)
        $shiftIds = DB::table('work_shifts')->pluck('shift_id')->all();
        $scheduleRows = [];
        foreach ($staffIds as $idx => $staffId) {
            $date = $now->copy()->addDays($idx % 14)->toDateString();
            $shiftId = $shiftIds[$idx % count($shiftIds)];
            $shiftName = DB::table('work_shifts')->where('shift_id', $shiftId)->value('shift_name');
            $checkIn = $shiftName === 'Morning Shift' ? '08:30:00' : ($shiftName === 'Afternoon Shift' ? '13:00:00' : '17:00:00');
            $checkOut = $shiftName === 'Morning Shift' ? '12:30:00' : ($shiftName === 'Afternoon Shift' ? '17:00:00' : '20:30:00');
            $scheduleRows[] = [
                'staff_id' => $staffId,
                'date' => $date,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'shift_id' => $shiftId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('staff_schedules')->insert($scheduleRows);

        // Promotions
        $serviceIds = DB::table('services')->pluck('service_id')->all();
        $promotionIds = [];
        for ($i = 1; $i <= 12; $i++) {
            $promotionIds[] = DB::table('promotions')->insertGetId([
                'apply_type' => fake()->randomElement(['service', 'service', 'order']),
                'service_id' => $serviceIds[array_rand($serviceIds)],
                'percent' => fake()->numberBetween(5, 30),
                'promotion_code' => 'ZEN'.str_pad((string) $i, 2, '0', STR_PAD_LEFT).strtoupper(Str::random(3)),
                'expiration_date' => $now->copy()->addDays(fake()->numberBetween(10, 120))->toDateString(),
                'usage_limit' => fake()->numberBetween(30, 400),
                'created_at' => $now,
                'updated_at' => $now,
            ], 'promotion_id');
        }

        // Appointments + details + feedback
        foreach (range(1, 60) as $i) {
            $clientId = $clientIds[array_rand($clientIds)];
            $appointmentDate = $now->copy()->addDays(fake()->numberBetween(-10, 20))->setTime(fake()->numberBetween(9, 18), 0);
            $status = $appointmentDate->isFuture() ? 'active' : 'inactive';
            $paymentStatus = $status === 'inactive' ? 'pay' : 'unpay';
            $promotionId = fake()->boolean(35) ? $promotionIds[array_rand($promotionIds)] : null;

            $appointmentId = DB::table('appointments')->insertGetId([
                'client_id' => $clientId,
                'appointment_date' => $appointmentDate,
                'total_amount' => 1, // updated after details
                'promotion_id' => $promotionId,
                'final_amount' => 1, // updated after details
                'payment_method' => fake()->randomElement(['cash', 'card']),
                'payment_status' => $paymentStatus,
                'status' => $status,
                'created_at' => $now,
                'updated_at' => $now,
            ], 'appointment_id');

            $detailCount = 2;
            $start = $appointmentDate->copy();
            $total = 0.0;

            for ($d = 0; $d < $detailCount; $d++) {
                $useService = fake()->boolean(75);

                $serviceId = null;
                $productId = null;
                $unitPrice = 0.0;
                $durationMin = 30;
                $detailItemType = 'service';
                $detailItemId = null;
                $detailStaffId = null;
                $startTime = null;
                $endTime = null;

                if ($useService) {
                    $serviceId = $serviceIds[array_rand($serviceIds)];
                    $service = DB::table('services')->select('price', 'duration')->where('service_id', $serviceId)->first();
                    $unitPrice = (float) $service->price;
                    $durationMin = (int) $service->duration;
                    $detailItemType = 'service';
                    $detailItemId = $serviceId;
                    $detailStaffId = $staffIds[array_rand($staffIds)];
                } else {
                    $productId = $productIds[array_rand($productIds)];
                    $product = DB::table('products')->select('unit_price')->where('product_id', $productId)->first();
                    $unitPrice = (float) $product->unit_price;
                    $durationMin = fake()->randomElement([15, 30, 45]);
                    $detailItemType = 'product';
                    $detailItemId = $productId;
                    $detailStaffId = null;
                }

                $quantity = fake()->numberBetween(1, 2);
                $end = $start->copy()->addMinutes($durationMin);

                $lineTotal = $unitPrice * $quantity;
                $total += $lineTotal;

                if ($detailItemType === 'service') {
                    $startTime = $start->format('H:i:s');
                    $endTime = $end->format('H:i:s');
                }

                if ($usesMixedItemSchema) {
                    DB::table('appointment_details')->insert([
                        'appointment_id' => $appointmentId,
                        'staff_id' => $detailStaffId,
                        'item_type' => $detailItemType,
                        'item_id' => $detailItemId,
                        // Keep legacy reference columns populated too (some DBs still enforce old CHECK constraints).
                        'service_id' => $serviceId,
                        'product_id' => $productId,
                        'quantity' => $quantity,
                        'price' => $lineTotal,
                        'start_time' => $detailItemType === 'service' ? $startTime : null,
                        'end_time' => $detailItemType === 'service' ? $endTime : null,
                        'status' => $status,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                } else {
                    // Legacy schema: item_type hair/skin + service_id/product_id + total_price + required times.
                    DB::table('appointment_details')->insert([
                        'appointment_id' => $appointmentId,
                        'staff_id' => $detailStaffId,
                        'item_type' => fake()->randomElement(['hair', 'skin']),
                        'service_id' => $serviceId,
                        'product_id' => $productId,
                        'quantity' => $quantity,
                        'total_price' => $lineTotal,
                        'start_time' => $detailItemType === 'service' ? $startTime : '00:00:00',
                        'end_time' => $detailItemType === 'service' ? $endTime : '00:01:00',
                        'status' => $status,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                // Next service item starts after the previous one. Product items don't consume schedule.
                if ($detailItemType === 'service') {
                    $start = $end->copy()->addMinutes(15);
                }
            }

            $discountPercent = 0;
            if ($promotionId) {
                $discountPercent = (int) DB::table('promotions')->where('promotion_id', $promotionId)->value('percent');
            }
            $final = max(1.00, round($total * (1 - ($discountPercent / 100)), 2));

            DB::table('appointments')->where('appointment_id', $appointmentId)->update([
                'total_amount' => max(1.00, round($total, 2)),
                'final_amount' => $final,
            ]);

            DB::table('feedback')->insert([
                'appointment_id' => $appointmentId,
                'rating' => fake()->numberBetween(3, 5),
                'notes' => fake()->randomElement([
                    "Friendly staff and great attention to detail. I'm very happy with the result.",
                    'Clean space, professional service, and a relaxing experience overall.',
                    "Solid service - good value. I'll likely come back.",
                    'I love how it turned out. Thank you, ZenStyle!',
                    'A short wait, but the quality made it worth it.',
                ]),
                'manager_reply' => fake()->boolean(45) ? fake()->randomElement([
                    "Thank you for choosing ZenStyle - we're glad you enjoyed your visit!",
                    'We really appreciate your feedback. See you again soon!',
                    "Thanks for the note - our team will keep improving.",
                ]) : null,
                'replied_at' => fake()->boolean(45) ? $now->copy()->subDays(fake()->numberBetween(0, 3)) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Password reset tokens / OTPs (demo only)
        $userEmails = DB::table('users')->pluck('email')->take(self::MIN_ROWS)->all();
        $resetTokenRows = [];
        foreach ($userEmails as $email) {
            $resetTokenRows[] = [
                'email' => $email,
                'token' => Hash::make(Str::random(60)),
                'created_at' => $now,
            ];
        }
        DB::table('password_reset_tokens')->insert($resetTokenRows);

        $otpRows = [];
        foreach (range(1, self::MIN_ROWS) as $i) {
            $otpRows[] = [
                'email' => $userEmails[$i - 1] ?? fake()->safeEmail(),
                'otp_hash' => Hash::make(str_pad((string) fake()->numberBetween(0, 99999), 5, '0', STR_PAD_LEFT)),
                'expires_at' => $now->copy()->addMinutes(fake()->numberBetween(3, 10)),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('password_reset_otps')->insert($otpRows);

        // Generate API tokens (populates personal_access_tokens) - admins are kept by AdminSeeder.
        Staff::query()->take(self::MIN_ROWS)->get()->each(fn (Staff $s) => $s->createToken($s->email.'-'.$now->timestamp, ['staff'], $now->copy()->addHours(24)));
        Client::query()->take(self::MIN_ROWS)->get()->each(fn (Client $c) => $c->createToken($c->email.'-'.$now->timestamp, ['client'], $now->copy()->addHours(24)));
    }
}
