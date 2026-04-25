<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ZenstyleCatalogSeeder extends Seeder
{
    private function buildPhone(int $index, int $offset = 0): string
    {
        $areaCodes = ['202', '212', '213', '305', '312', '347', '415', '503', '617', '646'];
        $areaCode = $areaCodes[($index + $offset) % count($areaCodes)];
        $lineNumber = str_pad((string) (3000 + ($offset * 20) + $index), 4, '0', STR_PAD_LEFT);

        return '+1'.$areaCode.'555'.$lineNumber;
    }

    public function run(): void
    {
        $now = now();

        $productCategoryNames = [
            'Hair Care',
            'Skin Care',
            'Hair Coloring',
            'Nail Care',
            'Tools & Equipment',
            'Scalp Care',
            'Salon Essentials',
            'Styling Products',
            'Body Care',
            'Beauty Devices',
            'Treatment Kits',
            'Spa Accessories',
            'Makeup Tools',
            'Fragrance',
            'Professional Brushes',
            'Heat Protection',
            'Curl Care',
            'Men Grooming',
            'Sensitive Skin',
            'Gift Sets',
        ];
        foreach ($productCategoryNames as $categoryName) {
            DB::table('product_categories')->updateOrInsert(
                ['product_category_name' => $categoryName],
                ['product_category_name' => $categoryName, 'created_at' => $now, 'updated_at' => $now]
            );
        }

        $productCategoryIds = DB::table('product_categories')
            ->orderBy('product_category_id')
            ->pluck('product_category_id', 'product_category_name')
            ->all();

        $categories = [
            "Women's Hair",
            "Men's Hair",
            'Skincare',
            'Nail Care',
            'Makeup',
            'Herbal Hair Wash',
            'Massage & Relaxation',
            'Scalp Treatment',
            'Hair Coloring',
            'Keratin Treatment',
            'Relaxation Therapy',
            'Face Glow',
            'Body Care',
            'Bridal Styling',
            'Barber Care',
            'Holistic Spa',
            'Dermal Care',
            'Nail Art',
            'Event Styling',
            'Luxury Reset',
        ];

        foreach ($categories as $name) {
            DB::table('service_categories')->updateOrInsert(
                ['category_name' => $name],
                [
                    'category_name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $workShifts = [
            'Morning Shift A',
            'Morning Shift B',
            'Morning Shift C',
            'Midday Shift A',
            'Midday Shift B',
            'Midday Shift C',
            'Afternoon Shift A',
            'Afternoon Shift B',
            'Afternoon Shift C',
            'Late Afternoon Shift',
            'Early Evening Shift',
            'Evening Shift A',
            'Evening Shift B',
            'Evening Shift C',
            'Closing Shift A',
            'Closing Shift B',
            'Weekend Morning',
            'Weekend Afternoon',
            'Weekend Evening',
            'On-Call Support',
        ];

        foreach ($workShifts as $name) {
            DB::table('work_shifts')->updateOrInsert(
                ['shift_name' => $name],
                [
                    'shift_name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $categoryIds = DB::table('service_categories')->orderBy('category_id')->pluck('category_id')->all();
        $serviceRows = [
            ["Women's Haircut & Blowout", 55.00, 60, 'Tailored haircut with a smooth blow-dry and light styling.'],
            ["Men's Barber Cut", 35.00, 30, 'Classic barber cut with neckline detailing and quick styling.'],
            ['Hair Coloring', 135.00, 90, 'Professional color application with tone matching and rinse finish.'],
            ['Root Touch-Up', 95.00, 60, 'Even coverage focused on regrowth and grays.'],
            ['Keratin Repair Treatment', 120.00, 90, 'Restorative treatment that reduces frizz and improves shine.'],
            ['Facial Treatment', 75.00, 60, 'Cleansing, exfoliation, and hydration tailored to the skin.'],
            ['Advanced Facial Treatment', 110.00, 90, 'Deeper facial with targeted serums and extended massage.'],
            ['Gel Manicure', 45.00, 60, 'Long-lasting gel manicure with shaping and cuticle care.'],
            ['Scalp Therapy', 40.00, 60, 'Relaxing herbal rinse and scalp massage.'],
            ['Event Makeup', 95.00, 90, 'Long-wear makeup tailored to outfit and skin tone.'],
            ['Hot Oil Scalp Detox', 58.00, 60, 'Warm oil treatment that cleanses the scalp and improves circulation.'],
            ['Bridal Makeup Package', 180.00, 90, 'Full bridal makeup with trial consultation and long-wear finish.'],
            ['Deep Conditioning Ritual', 68.00, 45, 'Hydrating ritual for dry and stressed hair.'],
            ['Split End Polish', 48.00, 40, 'Light precision cut for healthier ends and shape refresh.'],
            ['Men Fade Refresh', 42.00, 35, 'Low maintenance fade and styling detail.'],
            ['Glow Facial & Mask', 88.00, 70, 'Refresh and brighten the skin with a soothing finish.'],
            ['Relaxing Head Spa', 72.00, 60, 'Scalp massage and calming cleanse for stress relief.'],
            ['Luxury Nail Spa', 60.00, 55, 'Nail shaping, soak, and polish with extended care.'],
            ['Full Event Styling', 145.00, 100, 'Hair and makeup styling for photos and events.'],
            ['Sensitive Skin Reset', 92.00, 80, 'Gentle routine designed for reactive or sensitive skin.'],
        ];

        foreach ($serviceRows as $index => $service) {
            DB::table('services')->insertOrIgnore([
                'service_name' => $service[0],
                'price' => $service[1],
                'duration' => $service[2],
                'description' => $service[3],
                'category_id' => $categoryIds[$index % count($categoryIds)],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $serviceIds = DB::table('services')->orderBy('service_id')->pluck('service_id')->all();

        $promotionRows = [
            ['apply_type' => 'service', 'service_index' => 0, 'percent' => 10, 'promotion_code' => 'ZEN-HAIR-10', 'expiration_offset' => 60, 'usage_limit' => 100],
            ['apply_type' => 'service', 'service_index' => 2, 'percent' => 15, 'promotion_code' => 'ZEN-COLOR-15', 'expiration_offset' => 45, 'usage_limit' => 80],
            ['apply_type' => 'service', 'service_index' => 5, 'percent' => 20, 'promotion_code' => 'ZEN-FACIAL-20', 'expiration_offset' => 30, 'usage_limit' => 120],
            ['apply_type' => 'service', 'service_index' => 7, 'percent' => 12, 'promotion_code' => 'ZEN-NAIL-12', 'expiration_offset' => 90, 'usage_limit' => 75],
            ['apply_type' => 'service', 'service_index' => 8, 'percent' => 18, 'promotion_code' => 'ZEN-SCALP-18', 'expiration_offset' => 35, 'usage_limit' => 60],
            ['apply_type' => 'service', 'service_index' => 9, 'percent' => 25, 'promotion_code' => 'ZEN-MAKEUP-25', 'expiration_offset' => 40, 'usage_limit' => 50],
            ['apply_type' => 'service', 'service_index' => 11, 'percent' => 30, 'promotion_code' => 'ZEN-BRIDAL-30', 'expiration_offset' => 25, 'usage_limit' => 25],
            ['apply_type' => 'all', 'service_index' => null, 'percent' => 8, 'promotion_code' => 'ZEN-WELCOME-8', 'expiration_offset' => 120, 'usage_limit' => 300],
            ['apply_type' => 'order', 'service_index' => null, 'percent' => 5, 'promotion_code' => 'ZEN-SHOP-5', 'expiration_offset' => 75, 'usage_limit' => 200],
            ['apply_type' => 'order', 'service_index' => null, 'percent' => 10, 'promotion_code' => 'ZEN-SHOP-10', 'expiration_offset' => 45, 'usage_limit' => 120],
            ['apply_type' => 'order', 'service_index' => null, 'percent' => 12, 'promotion_code' => 'ZEN-CARE-12', 'expiration_offset' => 60, 'usage_limit' => 80],
            ['apply_type' => 'service', 'service_index' => 12, 'percent' => 14, 'promotion_code' => 'ZEN-CARE-14', 'expiration_offset' => 55, 'usage_limit' => 90],
            ['apply_type' => 'service', 'service_index' => 13, 'percent' => 16, 'promotion_code' => 'ZEN-CUT-16', 'expiration_offset' => 50, 'usage_limit' => 70],
            ['apply_type' => 'service', 'service_index' => 14, 'percent' => 11, 'promotion_code' => 'ZEN-FADE-11', 'expiration_offset' => 65, 'usage_limit' => 85],
            ['apply_type' => 'service', 'service_index' => 15, 'percent' => 22, 'promotion_code' => 'ZEN-GLOW-22', 'expiration_offset' => 42, 'usage_limit' => 110],
            ['apply_type' => 'service', 'service_index' => 16, 'percent' => 13, 'promotion_code' => 'ZEN-SPA-13', 'expiration_offset' => 77, 'usage_limit' => 60],
            ['apply_type' => 'service', 'service_index' => 17, 'percent' => 19, 'promotion_code' => 'ZEN-NAIL-19', 'expiration_offset' => 33, 'usage_limit' => 55],
            ['apply_type' => 'all', 'service_index' => null, 'percent' => 7, 'promotion_code' => 'ZEN-ALL-7', 'expiration_offset' => 95, 'usage_limit' => 220],
            ['apply_type' => 'order', 'service_index' => null, 'percent' => 9, 'promotion_code' => 'ZEN-ORDER-9', 'expiration_offset' => 88, 'usage_limit' => 150],
            ['apply_type' => 'order', 'service_index' => null, 'percent' => 15, 'promotion_code' => 'ZEN-ORDER-15', 'expiration_offset' => 52, 'usage_limit' => 90],
        ];

        foreach ($promotionRows as $row) {
            DB::table('promotions')->insertOrIgnore([
                'apply_type' => $row['apply_type'],
                'service_id' => $row['service_index'] !== null ? $serviceIds[$row['service_index']] : null,
                'percent' => $row['percent'],
                'promotion_code' => $row['promotion_code'],
                'expiration_date' => $now->copy()->addDays($row['expiration_offset'])->toDateString(),
                'usage_limit' => $row['usage_limit'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $suppliers = [
            'Glow Supply Co.',
            'Silk & Shine Wholesale',
            'Urban Beauty Depot',
            'PureScalp Distribution',
            'NailPro Supply',
            'ZenCare Ingredients',
            'Radiant Salon Supply',
            'EverFresh Beauty Sources',
            'Luxe Salon Wholesale',
            'Aura Beauty Traders',
            'Bloom Pro Supply',
            'Velvet Care Imports',
            'Prime Hair Solutions',
            'TrueSkin Distribution',
            'Mirror Finish Supply',
            'Serenity Tools Co.',
            'Salon One Depot',
            'Fresh Touch Traders',
            'Blooming Beauty Supply',
            'Elite Care Wholesale',
        ];

        foreach ($suppliers as $index => $supplierName) {
            DB::table('suppliers')->updateOrInsert(
                ['email' => 'supplier'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).'@zenstyle.com'],
                [
                    'supplier_name' => $supplierName,
                    'email' => 'supplier'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT).'@zenstyle.com',
                    'phone' => $this->buildPhone($index, 10),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $products = [
            ['name' => 'Argan Repair Shampoo', 'category' => 'hair', 'description' => 'Moisturizing shampoo for dry and damaged hair with a soft salon finish.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 36, 'reorder' => 18, 'price' => 18.00, 'min' => 10],
            ['name' => 'Keratin Smooth Conditioner', 'category' => 'hair', 'description' => 'Smoothing conditioner that helps reduce frizz and improve manageability.', 'image' => 'https://images.unsplash.com/photo-1526045478516-99145907023c', 'stock' => 8, 'reorder' => 15, 'price' => 19.50, 'min' => 8],
            ['name' => 'Deep Repair Hair Mask', 'category' => 'hair', 'description' => 'Weekly hair mask for strength, shine, and restoration.', 'image' => 'https://images.unsplash.com/photo-1556228578-56786d4f3425', 'stock' => 12, 'reorder' => 16, 'price' => 24.00, 'min' => 7],
            ['name' => 'Heat Protect Spray', 'category' => 'hair', 'description' => 'Protective spray for blow-drying, straightening, and curling tools.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 28, 'reorder' => 14, 'price' => 15.00, 'min' => 6],
            ['name' => 'Scalp Detox Scrub', 'category' => 'hair', 'description' => 'Gentle scrub that lifts product buildup and refreshes the scalp.', 'image' => 'https://images.unsplash.com/photo-1526045478516-99145907023c', 'stock' => 6, 'reorder' => 12, 'price' => 20.00, 'min' => 5],
            ['name' => 'Leave-In Treatment Cream', 'category' => 'hair', 'description' => 'Daily treatment cream for softness, hydration, and light protection.', 'image' => 'https://images.unsplash.com/photo-1556228578-56786d4f3425', 'stock' => 22, 'reorder' => 16, 'price' => 17.00, 'min' => 8],
            ['name' => 'Texturizing Sea Salt Spray', 'category' => 'hair', 'description' => 'Adds effortless texture and volume for a casual styled look.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 15, 'reorder' => 10, 'price' => 14.00, 'min' => 6],
            ['name' => 'Strong Hold Hair Spray', 'category' => 'hair', 'description' => 'Long-lasting finishing spray for polished styles and event looks.', 'image' => 'https://images.unsplash.com/photo-1526045478516-99145907023c', 'stock' => 40, 'reorder' => 20, 'price' => 13.00, 'min' => 10],
            ['name' => 'Curl Defining Cream', 'category' => 'hair', 'description' => 'Defines curls while keeping hair soft and controlled.', 'image' => 'https://images.unsplash.com/photo-1556228578-56786d4f3425', 'stock' => 9, 'reorder' => 14, 'price' => 16.00, 'min' => 5],
            ['name' => 'Matte Finish Clay', 'category' => 'hair', 'description' => 'Flexible styling clay for a matte and natural finish.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 26, 'reorder' => 15, 'price' => 15.50, 'min' => 7],
            ['name' => 'Gentle Face Cleanser', 'category' => 'skin', 'description' => 'Daily cleanser that removes impurities without stripping the skin barrier.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 18, 'reorder' => 18, 'price' => 12.00, 'min' => 8],
            ['name' => 'Hydrating Toner', 'category' => 'skin', 'description' => 'Hydrating toner to prep the skin for serum and moisturizer.', 'image' => 'https://images.unsplash.com/photo-1526045478516-99145907023c', 'stock' => 5, 'reorder' => 14, 'price' => 13.50, 'min' => 6],
            ['name' => 'Vitamin C Serum', 'category' => 'skin', 'description' => 'Brightening serum with a lightweight finish for daily routines.', 'image' => 'https://images.unsplash.com/photo-1556228578-56786d4f3425', 'stock' => 7, 'reorder' => 12, 'price' => 26.00, 'min' => 4],
            ['name' => 'Daily SPF50 Sunscreen', 'category' => 'skin', 'description' => 'Everyday broad-spectrum sunscreen with a clean, non-greasy feel.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 30, 'reorder' => 18, 'price' => 21.00, 'min' => 10],
            ['name' => 'Moisture Barrier Cream', 'category' => 'skin', 'description' => 'Rich cream that supports hydration and skin barrier repair.', 'image' => 'https://images.unsplash.com/photo-1526045478516-99145907023c', 'stock' => 11, 'reorder' => 15, 'price' => 28.00, 'min' => 7],
            ['name' => 'Calming Facial Mask', 'category' => 'skin', 'description' => 'Soothing mask designed for post-treatment recovery and comfort.', 'image' => 'https://images.unsplash.com/photo-1556228578-56786d4f3425', 'stock' => 14, 'reorder' => 12, 'price' => 18.50, 'min' => 6],
            ['name' => 'Nail Strengthener Base Coat', 'category' => 'skin', 'description' => 'Strengthening base coat for healthier looking nails.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 24, 'reorder' => 10, 'price' => 11.00, 'min' => 5],
            ['name' => 'Top Coat Shine Gel', 'category' => 'skin', 'description' => 'Glossy top coat that seals manicure color and adds shine.', 'image' => 'https://images.unsplash.com/photo-1526045478516-99145907023c', 'stock' => 19, 'reorder' => 10, 'price' => 10.50, 'min' => 5],
            ['name' => 'Cuticle Oil Pen', 'category' => 'skin', 'description' => 'Portable oil pen for nail care between salon visits.', 'image' => 'https://images.unsplash.com/photo-1556228578-56786d4f3425', 'stock' => 4, 'reorder' => 8, 'price' => 9.00, 'min' => 4],
            ['name' => 'Bridal Makeup Setting Spray', 'category' => 'skin', 'description' => 'Long-wear setting spray that helps makeup stay fresh for events.', 'image' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9', 'stock' => 10, 'reorder' => 9, 'price' => 22.00, 'min' => 4],
        ];

        foreach ($products as $index => $product) {
            $productCategoryName = $productCategoryNames[$index % count($productCategoryNames)];

            DB::table('products')->updateOrInsert(
                ['product_name' => $product['name']],
                [
                    'product_name' => $product['name'],
                    'category' => $productCategoryName,
                    'product_category_id' => $productCategoryIds[$productCategoryName] ?? null,
                    'description' => $product['description'],
                    'image_url' => $product['image'],
                    'stock_quantity' => (int) $product['stock'],
                    'reorder_level' => $product['reorder'],
                    'unit_price' => $product['price'],
                    'min_stock_level' => $product['min'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $clientIds = DB::table('clients')->orderBy('client_id')->pluck('client_id')->all();
        $staffIds = DB::table('staff')->where('status', 'active')->orderBy('staff_id')->pluck('staff_id')->all();

        $staffPreferenceNotes = [
            'Prefers this stylist for routine haircut and blow-dry appointments.',
            'Likes to book this specialist for skincare treatments.',
            'Requests this colorist for bright tone matching and retouch sessions.',
            'Feels comfortable with this barber for quick maintenance visits.',
            'Books this technician for detailed nail care and polish updates.',
            'Chooses this stylist for soft layering and face-framing cuts.',
            'Uses this specialist for calm, sensitive-skin facials.',
            'Schedules this barber for sharp fades and beard cleanup.',
            'Visits this colorist for balayage and gloss refreshes.',
            'Prefers this nail technician for natural gel finishes.',
            'Books this stylist for event prep and polished blowouts.',
            'Returns to this specialist for scalp detox and hair recovery.',
            'Selects this barber for fast trim maintenance.',
            'Trusts this technician for bridal and photoshoot glam.',
            'Uses this stylist for curl definition and styling advice.',
            'Likes this specialist for deep cleansing facials.',
            'Chooses this barber for weekly grooming visits.',
            'Prefers this technician for manicure and pedicure care.',
            'Books this stylist for premium smoothing treatments.',
            'Trusts this specialist for skin reset and aftercare guidance.',
        ];

        $staffPreferenceRows = [];
        foreach ($clientIds as $index => $clientId) {
            $staffPreferenceRows[] = [
                'client_id' => $clientId,
                'staff_id' => $staffIds[$index % count($staffIds)],
                'note' => $staffPreferenceNotes[$index % count($staffPreferenceNotes)],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('client_staff_preferences')->insertOrIgnore($staffPreferenceRows);

        $staffIds = DB::table('staff')->orderBy('staff_id')->pluck('staff_id')->all();

        $shiftIds = DB::table('work_shifts')->orderBy('shift_id')->pluck('shift_id')->all();
        $staffSchedules = [];
        foreach ($staffIds as $index => $staffId) {
            $shiftIndex = $index % count($shiftIds);
            $date = $now->copy()->subDays(10 + $index)->toDateString();
            $checkIn = match (true) {
                $shiftIndex < 3 => '08:00:00',
                $shiftIndex < 6 => '10:30:00',
                $shiftIndex < 9 => '13:00:00',
                $shiftIndex < 12 => '15:00:00',
                $shiftIndex < 15 => '17:00:00',
                $shiftIndex < 18 => '18:30:00',
                default => '19:30:00',
            };
            $checkOut = match (true) {
                $shiftIndex < 3 => '12:00:00',
                $shiftIndex < 6 => '14:30:00',
                $shiftIndex < 9 => '17:30:00',
                $shiftIndex < 12 => '19:00:00',
                $shiftIndex < 15 => '21:00:00',
                $shiftIndex < 18 => '22:00:00',
                default => '23:00:00',
            };
            $actual = $index % 2 === 0;

            $staffSchedules[] = [
                'staff_id' => $staffId,
                'date' => $date,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'shift_id' => $shiftIds[$shiftIndex],
                'actual_check_in' => $actual ? $now->copy()->subDays(10 + $index)->setTimeFromTimeString($checkIn) : null,
                'actual_check_out' => $actual ? $now->copy()->subDays(10 + $index)->setTimeFromTimeString($checkOut) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('staff_schedules')->insert($staffSchedules);
    }
}
