<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\AppointmentDetail;
use App\Models\Client;
use App\Models\Product;
use App\Models\Staff;
use App\Models\ShopOrder;
use App\Models\StaffSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    public function admin(Request $request)
    {
        if (! in_array('admin', $this->abilities($request), true)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $today = now()->toDateString();
        $monthStart = now()->copy()->startOfMonth();
        $yearStart = now()->copy()->startOfYear();

        $todayAppointmentRevenue = Appointment::whereDate('appointment_date', $today)
            ->where('payment_status', 'pay')
            ->sum('final_amount');
        $monthAppointmentRevenue = Appointment::whereDate('appointment_date', '>=', $monthStart)
            ->where('payment_status', 'pay')
            ->sum('final_amount');
        $yearAppointmentRevenue = Appointment::whereDate('appointment_date', '>=', $yearStart)
            ->where('payment_status', 'pay')
            ->sum('final_amount');

        // Include paid shop orders in revenue calculations (shop orders use shop_orders.total_amount in USD).
        // Convert shop USD totals to VND for consistency with appointment amounts (which are in VND).
        $vndPerUsd = (float) env('VND_PER_USD', 25000);

        $todayShopRevenueUsd = ShopOrder::whereDate('created_at', $today)
            ->where('status', 'paid')
            ->sum('total_amount');
        $monthShopRevenueUsd = ShopOrder::whereDate('created_at', '>=', $monthStart)
            ->where('status', 'paid')
            ->sum('total_amount');
        $yearShopRevenueUsd = ShopOrder::whereDate('created_at', '>=', $yearStart)
            ->where('status', 'paid')
            ->sum('total_amount');

        $todayShopRevenue = (float) $todayShopRevenueUsd * $vndPerUsd;
        $monthShopRevenue = (float) $monthShopRevenueUsd * $vndPerUsd;
        $yearShopRevenue = (float) $yearShopRevenueUsd * $vndPerUsd;

        $todayRevenue = (float) $todayAppointmentRevenue + $todayShopRevenue;
        $monthRevenue = (float) $monthAppointmentRevenue + $monthShopRevenue;
        $yearRevenue = (float) $yearAppointmentRevenue + $yearShopRevenue;

        $upcomingAppointments = Appointment::query()
            ->with(['client:client_id,client_name', 'appointmentDetails.staff:staff_id,staff_name', 'appointmentDetails.item'])
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
            ->where('appointment_details.item_type', 'service')
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
                'item',
            ])
            ->where('staff_id', $user->getKey())
            ->where('item_type', 'service')
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
            ->with('appointmentDetails.staff:staff_id,staff_name', 'appointmentDetails.item')
            ->where('client_id', $user->getKey())
            ->where('status', 'active')
            ->where('appointment_date', '>=', now())
            ->orderBy('appointment_date')
            ->limit(10)
            ->get();

        $historyCount = Appointment::where('client_id', $user->getKey())->count();
        // Support both old schema (service_id/product_id + item_type skin/hair)
        // and new schema (item_type service/product + item_id).
        $details = DB::table('appointment_details')
            ->join('appointments', 'appointments.appointment_id', '=', 'appointment_details.appointment_id')
            ->where('appointments.client_id', $user->getKey());

        if (Schema::hasColumn('appointment_details', 'item_id')) {
            $details = $details
                ->where('appointment_details.item_type', 'service')
                ->leftJoin('services', 'services.service_id', '=', 'appointment_details.item_id');
        } else {
            $details = $details
                ->whereNotNull('appointment_details.service_id')
                ->leftJoin('services', 'services.service_id', '=', 'appointment_details.service_id');
        }

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
