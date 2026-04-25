<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\AppointmentDetail;
use App\Models\Client;
use App\Models\Product;
use App\Models\Staff;
use App\Models\StaffSchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function resolveRevenueWindow(array $validated): array
    {
        $mode = strtolower((string) ($validated['mode'] ?? 'quick'));
        $preset = strtolower((string) ($validated['preset'] ?? 'this_month'));

        if ($mode === 'custom') {
            $from = $validated['from_date'] ?? $validated['from'] ?? null;
            $to = $validated['to_date'] ?? $validated['to'] ?? null;
            $start = $from ? Carbon::createFromFormat('Y-m-d', $from)->startOfDay() : now()->copy()->startOfMonth();
            $end = $to ? Carbon::createFromFormat('Y-m-d', $to)->endOfDay() : now()->copy()->endOfDay();
            $days = $start->copy()->startOfDay()->diffInDays($end->copy()->endOfDay()) + 1;
            $suggestedGroupBy = match (true) {
                $days <= 7 => 'day',
                $days <= 60 => 'week',
                default => 'month',
            };
            $groupBy = strtolower((string) ($validated['group_by'] ?? $suggestedGroupBy));

            return [
                'mode' => 'custom',
                'preset' => null,
                'start' => $start,
                'end' => $end,
                'group_by' => in_array($groupBy, ['day', 'week', 'month'], true) ? $groupBy : $suggestedGroupBy,
            ];
        }

        $now = now();
        $start = match ($preset) {
            'today' => $now->copy()->setTime(7, 0, 0),
            'this_week', 'last_7_days' => $now->copy()->startOfWeek(Carbon::MONDAY)->startOfDay(),
            'this_month' => $now->copy()->startOfMonth()->startOfDay(),
            'this_year' => $now->copy()->startOfYear()->startOfDay(),
            default => $now->copy()->startOfDay(),
        };

        $end = match ($preset) {
            'today' => $now->copy()->setTime(22, 0, 0),
            'this_week', 'last_7_days' => $now->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay(),
            'this_year' => $now->copy()->endOfYear()->endOfDay(),
            'this_month' => $now->copy()->endOfMonth()->endOfDay(),
            default => $now->copy()->endOfDay(),
        };

        $groupBy = match ($preset) {
            'today' => 'hour',
            'this_year' => 'month',
            'this_week', 'last_7_days', 'this_month' => 'day',
            default => 'day',
        };

        return [
            'mode' => 'quick',
            'preset' => $preset,
            'start' => $start,
            'end' => $end,
            'group_by' => $groupBy,
        ];
    }

    private function revenueBucketKey(Carbon $date, string $groupBy): string
    {
        return match ($groupBy) {
            'hour' => $date->copy()->startOfHour()->format('Y-m-d H:00:00'),
            'day' => $date->toDateString(),
            'week' => $date->copy()->startOfWeek(Carbon::MONDAY)->toDateString(),
            'month' => $date->copy()->startOfMonth()->toDateString(),
            'year' => $date->copy()->startOfYear()->toDateString(),
            default => $date->toDateString(),
        };
    }

    private function revenueBucketLabel(Carbon $date, string $groupBy): string
    {
        return match ($groupBy) {
            'hour' => $date->format('H:00'),
            'day' => $date->format('M d'),
            'week' => 'Week of '.$date->copy()->startOfWeek(Carbon::MONDAY)->format('M d'),
            'month' => $date->format('M Y'),
            'year' => $date->format('Y'),
            default => $date->format('M d'),
        };
    }

    private function buildRevenueTrendSeries(Carbon $start, Carbon $end, string $groupBy): array
    {
        $groupBy = in_array($groupBy, ['hour', 'day', 'week', 'month', 'year'], true) ? $groupBy : 'day';

        $bucketExprFor = function (string $tableAlias, string $column) use ($groupBy): string {
            $qualified = "{$tableAlias}.{$column}";
            return match ($groupBy) {
                'hour' => "DATE_FORMAT($qualified, '%Y-%m-%d %H:00:00')",
                'day' => "DATE($qualified)",
                'week' => "DATE(DATE_SUB($qualified, INTERVAL WEEKDAY($qualified) DAY))",
                'month' => "DATE_FORMAT($qualified, '%Y-%m-01')",
                'year' => "DATE_FORMAT($qualified, '%Y-01-01')",
                default => "DATE($qualified)",
            };
        };

        $period = match ($groupBy) {
            'hour' => CarbonPeriod::create($start->copy()->startOfHour(), '1 hour', $end->copy()->startOfHour()),
            'day' => CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay()),
            'week' => CarbonPeriod::create($start->copy()->startOfWeek(Carbon::MONDAY), '1 week', $end->copy()->startOfWeek(Carbon::MONDAY)),
            'month' => CarbonPeriod::create($start->copy()->startOfMonth(), '1 month', $end->copy()->startOfMonth()),
            'year' => CarbonPeriod::create($start->copy()->startOfYear(), '1 year', $end->copy()->startOfYear()),
            default => CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay()),
        };

        $apBucketExpr = $bucketExprFor('a', 'appointment_date');

        $apSource = DB::table('appointments as a')
            ->selectRaw("$apBucketExpr as bucket, SUM(a.final_amount) as revenue")
            ->whereBetween('a.appointment_date', [$start, $end])
            ->where('a.status', 'inactive')
            ->where('a.payment_status', 'pay')
            ->groupBy(DB::raw($apBucketExpr))
            ->orderBy('bucket')
            ->get()
            ->keyBy('bucket');

        // Shop (customer orders) source grouped by created_at
        $coBucketExpr = $bucketExprFor('co', 'created_at');
        $coSource = DB::table('customer_orders as co')
            ->selectRaw("$coBucketExpr as bucket, SUM(co.final_amount) as revenue")
            ->whereBetween('co.created_at', [$start, $end])
            ->where('co.payment_status', 'paid')
            ->where('co.order_status', '!=', 'cancelled')
            ->groupBy(DB::raw($coBucketExpr))
            ->orderBy('bucket')
            ->get()
            ->keyBy('bucket');

        return collect($period)
            ->map(function (Carbon $date) use ($groupBy, $apSource, $coSource) {
                $bucketKey = $this->revenueBucketKey($date, $groupBy);
                $a = $apSource->get($bucketKey);
                $c = $coSource->get($bucketKey);

                $apRev = (float) ($a->revenue ?? 0);
                $coRev = (float) ($c->revenue ?? 0);

                return [
                    'bucket' => $bucketKey,
                    'day' => $bucketKey,
                    'label' => $this->revenueBucketLabel($date, $groupBy),
                    'appointment_revenue' => $apRev,
                    'shop_revenue' => $coRev,
                    'total_revenue' => $apRev + $coRev,
                ];
            })
            ->values()
            ->all();
    }

    private function appointmentRevenueBetween(Carbon $start, Carbon $end): float
    {
        return (float) Appointment::query()
            ->whereBetween('appointment_date', [$start, $end])
            ->where('status', 'inactive')
            ->where('payment_status', 'pay')
            ->sum('final_amount');
    }

    private function shopRevenueBetween(Carbon $start, Carbon $end): float
    {
        return (float) DB::table('customer_orders')
            ->whereBetween('updated_at', [$start, $end])
            ->where('payment_status', 'paid')
            ->where('order_status', '!=', 'cancelled')
            ->sum('final_amount');
    }

    public function admin(Request $request)
    {
        if (! in_array('admin', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $today = now()->toDateString();
        $monthStart = now()->copy()->startOfMonth();
        $yearStart = now()->copy()->startOfYear();

        $todayAppointmentRevenue = $this->appointmentRevenueBetween(now()->startOfDay(), now()->endOfDay());
        $monthAppointmentRevenue = $this->appointmentRevenueBetween($monthStart->copy()->startOfDay(), now()->copy()->endOfMonth()->endOfDay());
        $yearAppointmentRevenue = $this->appointmentRevenueBetween($yearStart->copy()->startOfDay(), now()->copy()->endOfYear()->endOfDay());

        // Shop revenue (product orders) measured by when they were paid (updated_at)
        $todayShopRevenue = $this->shopRevenueBetween(now()->startOfDay(), now()->endOfDay());
        $monthShopRevenue = $this->shopRevenueBetween($monthStart->copy()->startOfDay(), now()->copy()->endOfMonth()->endOfDay());
        $yearShopRevenue = $this->shopRevenueBetween($yearStart->copy()->startOfDay(), now()->copy()->endOfYear()->endOfDay());

        $todayRevenue = $todayAppointmentRevenue + $todayShopRevenue;
        $monthRevenue = $monthAppointmentRevenue + $monthShopRevenue;
        $yearRevenue = $yearAppointmentRevenue + $yearShopRevenue;

        $upcomingAppointments = Appointment::query()
            ->with(['client:client_id,client_name', 'appointmentDetails.staff:staff_id,staff_name', 'appointmentDetails.service:service_id,service_name'])
            ->where('status', 'active')
            ->where('appointment_date', '>=', now())
            ->orderBy('appointment_date')
            ->limit(8)
            ->get();

        $lowStockProducts = Product::query()
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->orderBy('stock_quantity')
            ->limit(10)
            ->get(['product_id', 'product_name', 'stock_quantity', 'reorder_level']);

        return ApiResponse::success([
            'metrics' => [
                'total_staff' => Staff::where('status', 'active')->count(),
                'appointments_today' => Appointment::whereDate('appointment_date', $today)->count(),
                'today_revenue' => (float) $todayRevenue,
                'month_revenue' => (float) $monthRevenue,
                'year_revenue' => (float) $yearRevenue,
                'total_clients' => Client::count(),
            ],
            'upcoming_appointments' => $upcomingAppointments,
            'low_stock_products' => $lowStockProducts,
        ], 'Admin dashboard retrieved.');
    }

    public function revenue(Request $request)
    {
        if (! in_array('admin', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $validated = $request->validate([
            'mode' => ['nullable', 'in:quick,custom'],
            'preset' => ['nullable', 'in:today,this_week,last_7_days,this_month,this_year'],
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            // Back-compat
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'group_by' => ['nullable', 'in:hour,day,week,month'],
        ]);

        $window = $this->resolveRevenueWindow($validated);
        $start = $window['start'];
        $end = $window['end'];
        $groupBy = $window['group_by'];

        $days = $start->copy()->startOfDay()->diffInDays($end->copy()->endOfDay()) + 1;
        if ($days > 370) {
            return ApiResponse::error('Date range is too large. Please choose a smaller window.', 422, 'RANGE_TOO_LARGE');
        }

        $appointmentRevenue = $this->appointmentRevenueBetween($start, $end);
        $shopRevenue = (float) DB::table('customer_orders')
            ->whereBetween('created_at', [$start, $end])
            ->where('payment_status', 'paid')
            ->where('order_status', '!=', 'cancelled')
            ->sum('final_amount');

        $totalRevenue = $appointmentRevenue + $shopRevenue;
        $effectiveGroupBy = in_array($groupBy, ['hour', 'day', 'week', 'month', 'year'], true) ? $groupBy : ($days <= 31 ? 'day' : 'month');
        $trend = $this->buildRevenueTrendSeries($start, $end, $effectiveGroupBy);

        return ApiResponse::success([
            'mode' => $window['mode'],
            'preset' => $window['preset'],
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'group_by' => $effectiveGroupBy,
            'summary' => [
                'appointment_revenue' => $appointmentRevenue,
                'shop_revenue' => $shopRevenue,
                'total_revenue' => $totalRevenue,
            ],
            'trend' => $trend ?? [],
        ], 'Revenue retrieved.');
    }

    public function staff(Request $request)
    {
        $user = $request->user();
        if (! in_array('staff', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $today = now()->toDateString();

        $todayDetails = AppointmentDetail::query()
            ->join('appointments', 'appointments.appointment_id', '=', 'appointment_details.appointment_id')
            ->where('appointment_details.staff_id', $user->getKey())
            ->whereNotNull('appointment_details.service_id')
            ->whereDate('appointments.appointment_date', $today);

        $pendingCount = (clone $todayDetails)->where('appointment_details.status', 'active')->count();
        $completedCount = (clone $todayDetails)->where('appointment_details.status', 'inactive')->count();

        $todaySchedule = StaffSchedule::query()
            ->with('shift:shift_id,shift_name')
            ->where('staff_id', $user->getKey())
            ->whereDate('date', $today)
            ->orderBy('check_in')
            ->get();

        $upcomingTasks = AppointmentDetail::query()
            ->with([
                'appointment:appointment_id,appointment_date,client_id',
                'appointment.client:client_id,client_name',
                'service:service_id,service_name',
            ])
            ->where('staff_id', $user->getKey())
            ->whereNotNull('service_id')
            ->where('status', 'active')
            ->orderBy('appointment_id')
            ->limit(10)
            ->get();

        return ApiResponse::success([
            'metrics' => [
                'appointments_today' => $pendingCount + $completedCount,
                'pending_tasks' => $pendingCount,
                'completed_tasks' => $completedCount,
            ],
            'today_schedule' => $todaySchedule,
            'upcoming_tasks' => $upcomingTasks,
        ], 'Staff dashboard retrieved.');
    }

    public function client(Request $request)
    {
        $user = $request->user();
        if (! in_array('client', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $upcomingAppointments = Appointment::query()
            ->with('appointmentDetails.staff:staff_id,staff_name', 'appointmentDetails.service:service_id,service_name')
            ->where('client_id', $user->getKey())
            ->where('status', 'active')
            ->where('appointment_date', '>=', now())
            ->orderBy('appointment_date')
            ->limit(10)
            ->get();

        $historyCount = Appointment::where('client_id', $user->getKey())->count();
        $details = DB::table('appointment_details')
            ->join('appointments', 'appointments.appointment_id', '=', 'appointment_details.appointment_id')
            ->where('appointments.client_id', $user->getKey())
            ->whereNotNull('appointment_details.service_id')
            ->leftJoin('services', 'services.service_id', '=', 'appointment_details.service_id');

        $favoriteServices = $details
            ->whereNotNull('services.service_name')
            ->select('services.service_name', DB::raw('COUNT(*) as usage_count'))
            ->groupBy('services.service_name')
            ->orderByDesc('usage_count')
            ->limit(3)
            ->get();

        return ApiResponse::success([
            'metrics' => [
                'upcoming_visits' => $upcomingAppointments->count(),
                'reward_points' => (int) ($user->membership_point ?? 0),
                'history_count' => $historyCount,
            ],
            'upcoming_appointments' => $upcomingAppointments,
            'favorite_services' => $favoriteServices,
        ], 'Client dashboard retrieved.');
    }
}
