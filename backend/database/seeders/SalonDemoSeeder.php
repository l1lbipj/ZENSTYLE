<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Staff;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SalonDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $usesMixedItemSchema = Schema::hasColumn('appointment_details', 'item_id');

            DB::table('appointment_details')->delete();
            DB::table('feedback')->delete();
            DB::table('appointments')->delete();
            DB::table('client_staff_preferences')->delete();
            DB::table('client_allergies')->delete();
            DB::table('client_favorite_products')->delete();
            DB::table('client_product_preferences')->delete();
            DB::table('staff_schedules')->delete();
            DB::table('work_shifts')->delete();
            DB::table('promotions')->delete();
            DB::table('services')->delete();
            DB::table('service_categories')->delete();
            DB::table('inventory_logs')->delete();
            DB::table('order_details')->delete();
            DB::table('purchase_orders')->delete();
            DB::table('suppliers')->delete();
            DB::table('products')->delete();
            DB::table('allergies')->delete();

            $hairCategoryId = DB::table('service_categories')->insertGetId([
                'category_name' => 'Hair',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'category_id');
            $skinCategoryId = DB::table('service_categories')->insertGetId([
                'category_name' => 'Skincare',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'category_id');

            $haircutId = DB::table('services')->insertGetId([
                'service_name' => 'Haircut & Blowout',
                'price' => 25.00,
                'duration' => 60,
                'description' => 'A tailored haircut with a clean finish, followed by a smooth blow-dry and light styling. Includes a quick consultation to match your face shape and daily routine.',
                'category_id' => $hairCategoryId,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'service_id');
            $facialId = DB::table('services')->insertGetId([
                'service_name' => 'Relaxing Facial',
                'price' => 45.00,
                'duration' => 90,
                'description' => 'A calming facial focused on deep cleansing, gentle exfoliation, and hydration. Finished with a relaxing massage and a soothing mask.',
                'category_id' => $skinCategoryId,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'service_id');

            $productAId = DB::table('products')->insertGetId([
                'product_name' => 'Argan Repair Shampoo (500ml)',
                'category' => 'Accessories',
                'description' => 'A nourishing shampoo that helps smooth frizz and support damaged hair. Leaves hair feeling soft, clean, and lightly scented.',
                'stock_quantity' => 60,
                'reorder_level' => 8,
                'unit_price' => 19.00,
                'min_stock_level' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'product_id');
            $productBId = DB::table('products')->insertGetId([
                'product_name' => 'Keratin Deep Conditioning Mask (250g)',
                'category' => 'Accessories',
                'description' => 'A rich conditioning mask designed to boost shine and reduce breakage. Ideal for weekly repair and extra smoothness.',
                'stock_quantity' => 45,
                'reorder_level' => 8,
                'unit_price' => 24.00,
                'min_stock_level' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'product_id');

            $promoId = DB::table('promotions')->insertGetId([
                'apply_type' => 'service',
                'service_id' => $haircutId,
                'percent' => 10,
                'promotion_code' => 'ZEN10',
                'expiration_date' => now()->addMonths(2)->toDateString(),
                'usage_limit' => 100,
                'created_at' => now(),
                'updated_at' => now(),
            ], 'promotion_id');

            $staffA = Staff::updateOrCreate(
                ['email' => 'staff1@zenstyle.com'],
                [
                    'staff_name' => 'Michael Brown',
                    'specialization' => 'Hair Stylist',
                    'phone' => '0901111111',
                    'password' => Hash::make('Staff@12345'),
                    'dob' => '1997-07-12',
                    'status' => 'active',
                ]
            );
            $staffB = Staff::updateOrCreate(
                ['email' => 'staff2@zenstyle.com'],
                [
                    'staff_name' => 'Emily Johnson',
                    'specialization' => 'Skincare Specialist',
                    'phone' => '0902222222',
                    'password' => Hash::make('Staff@12345'),
                    'dob' => '1998-04-04',
                    'status' => 'active',
                ]
            );

            $clientA = Client::updateOrCreate(
                ['email' => 'client1@zenstyle.com'],
                [
                    'client_name' => 'John Smith',
                    'phone' => '0911111111',
                    'password' => Hash::make('Client@12345'),
                    'dob' => '2000-08-12',
                    'status' => 'active',
                    'membership_point' => 1200,
                    'membership_tier' => 'silver',
                ]
            );
            $clientB = Client::updateOrCreate(
                ['email' => 'client2@zenstyle.com'],
                [
                    'client_name' => 'Sophia Davis',
                    'phone' => '0922222222',
                    'password' => Hash::make('Client@12345'),
                    'dob' => '1999-01-21',
                    'status' => 'active',
                    'membership_point' => 800,
                    'membership_tier' => 'bronze',
                ]
            );

            DB::table('allergies')->insert([
                ['allergy_name' => 'Fragrance', 'created_at' => now(), 'updated_at' => now()],
                ['allergy_name' => 'Paraben', 'created_at' => now(), 'updated_at' => now()],
            ]);
            $allergyIds = DB::table('allergies')->pluck('allergy_id')->all();

            DB::table('client_allergies')->insert([
                [
                    'client_id' => $clientA->client_id,
                    'allergy_id' => $allergyIds[0],
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            DB::table('client_staff_preferences')->insert([
                [
                    'client_id' => $clientA->client_id,
                    'staff_id' => $staffA->staff_id,
                    'note' => 'Preferred for haircut sessions',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            DB::table('client_favorite_products')->insert([
                [
                    'client_id' => $clientA->client_id,
                    'product_id' => $productAId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            $morningShiftId = DB::table('work_shifts')->insertGetId([
                'shift_name' => 'Morning',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'shift_id');
            $afternoonShiftId = DB::table('work_shifts')->insertGetId([
                'shift_name' => 'Afternoon',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'shift_id');

            DB::table('staff_schedules')->insert([
                [
                    'staff_id' => $staffA->staff_id,
                    'date' => now()->toDateString(),
                    'check_in' => '09:00:00',
                    'check_out' => '13:00:00',
                    'shift_id' => $morningShiftId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'staff_id' => $staffB->staff_id,
                    'date' => now()->toDateString(),
                    'check_in' => '13:00:00',
                    'check_out' => '18:00:00',
                    'shift_id' => $afternoonShiftId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            $apptAId = DB::table('appointments')->insertGetId([
                'client_id' => $clientA->client_id,
                'appointment_date' => now()->addDay()->setTime(10, 0),
                'total_amount' => 25.00,
                'promotion_id' => $promoId,
                'final_amount' => 22.50,
                'payment_method' => 'card',
                'payment_status' => 'unpay',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'appointment_id');

            $apptBId = DB::table('appointments')->insertGetId([
                'client_id' => $clientB->client_id,
                'appointment_date' => now()->subDays(2)->setTime(14, 0),
                'total_amount' => 45.00,
                'promotion_id' => null,
                'final_amount' => 45.00,
                'payment_method' => 'cash',
                'payment_status' => 'pay',
                'status' => 'inactive',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ], 'appointment_id');

            DB::table('appointment_details')->insert([
                [
                    'appointment_id' => $apptAId,
                    'staff_id' => $staffA->staff_id,
                    ...($usesMixedItemSchema ? [
                        'item_type' => 'service',
                        'item_id' => $haircutId,
                        'price' => 25.00,
                    ] : [
                        'item_type' => 'hair',
                        'service_id' => $haircutId,
                        'product_id' => null,
                        'total_price' => 25.00,
                    ]),
                    'quantity' => 1,
                    'start_time' => '10:00:00',
                    'end_time' => '11:00:00',
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'appointment_id' => $apptBId,
                    'staff_id' => $staffB->staff_id,
                    ...($usesMixedItemSchema ? [
                        'item_type' => 'service',
                        'item_id' => $facialId,
                        'price' => 45.00,
                    ] : [
                        'item_type' => 'skin',
                        'service_id' => $facialId,
                        'product_id' => null,
                        'total_price' => 45.00,
                    ]),
                    'quantity' => 1,
                    'start_time' => '14:00:00',
                    'end_time' => '15:30:00',
                    'status' => 'inactive',
                    'created_at' => now()->subDays(2),
                    'updated_at' => now()->subDays(2),
                ],
            ]);

            DB::table('feedback')->insert([
                [
                    'appointment_id' => $apptBId,
                    'rating' => 5,
                    'notes' => 'Great service and a very friendly team. I really liked the results.',
                    "manager_reply" => "Thank you for choosing ZenStyle. We're happy you enjoyed your visit - see you again soon!",
                    'replied_at' => now()->subDay(),
                    'created_at' => now()->subDay(),
                    'updated_at' => now()->subDay(),
                ],
            ]);

            $supplierAId = DB::table('suppliers')->insertGetId([
                'supplier_name' => 'Lotus Beauty Supply Co.',
                'email' => 'orders@lotusbeauty.example',
                'phone' => '0933333333',
                'created_at' => now(),
                'updated_at' => now(),
            ], 'supplier_id');

            $orderId = DB::table('purchase_orders')->insertGetId([
                'supplier_id' => $supplierAId,
                'order_date' => now()->subDays(15)->toDateString(),
                'total_amount' => 410.00,
                'status' => 'active',
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(15),
            ], 'order_id');

            DB::table('order_details')->insert([
                [
                    'order_id' => $orderId,
                    'product_id' => $productAId,
                    'import_price' => 14.00,
                    'quantity' => 20,
                    'created_at' => now()->subDays(15),
                    'updated_at' => now()->subDays(15),
                ],
                [
                    'order_id' => $orderId,
                    'product_id' => $productBId,
                    'import_price' => 19.00,
                    'quantity' => 10,
                    'created_at' => now()->subDays(15),
                    'updated_at' => now()->subDays(15),
                ],
            ]);

            DB::table('inventory_logs')->insert([
                [
                    'product_id' => $productAId,
                    'change_amount' => -3,
                    'reason' => 'Used for service',
                    'created_at' => now()->subDays(1),
                    'updated_at' => now()->subDays(1),
                ],
                [
                    'product_id' => $productBId,
                    'change_amount' => -2,
                    'reason' => 'Wastage',
                    'created_at' => now()->subDays(1),
                    'updated_at' => now()->subDays(1),
                ],
            ]);

            // Admin accounts are seeded via AdminSeeder (kept stable).
        });
    }
}
