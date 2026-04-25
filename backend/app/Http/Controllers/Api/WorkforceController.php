<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\AppointmentDetail;
use App\Models\Feedback;
use App\Models\Staff;
use App\Models\StaffSchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkforceController extends Controller
{
    private function isAdmin(Request $request): bool
    {
        return in_array('admin', $request->user()?->currentAccessToken()?->abilities ?? [], true);
    }

    private function constrainServiceDetails($query, ?string $alias = null): void
    {
        $serviceIdColumn = $alias ? "{$alias}.service_id" : 'service_id';

        $query->whereNotNull($serviceIdColumn);
    }

    private function resolvePerformanceWindow(array $validated, string $range = 'month'): array
    {
        $mode = strtolower((string) ($validated['mode'] ?? (($validated['from_date'] ?? $validated['from'] ?? null) && ($validated['to_date'] ?? $validated['to'] ?? null) ? 'custom' : 'quick')));
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

    private function buildPerformanceTrendSeries(Carbon $start, Carbon $end, string $groupBy): array
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

        $bucketExpr = $bucketExprFor('a', 'appointment_date');
        $source = DB::table('appointments as a')
            ->selectRaw("$bucketExpr as bucket, COUNT(*) as appointments, SUM(CASE WHEN a.status = \"inactive\" THEN 1 ELSE 0 END) as completed_appointments, SUM(CASE WHEN a.payment_status = \"pay\" AND a.status = \"inactive\" THEN a.final_amount ELSE 0 END) as revenue")
            ->whereBetween('a.appointment_date', [$start, $end])
            ->groupBy(DB::raw($bucketExpr))
            ->orderBy('bucket')
            ->get()
            ->keyBy('bucket');

        return collect($period)
            ->map(function (Carbon $date) use ($groupBy, $source) {
                $bucketKey = match ($groupBy) {
                    'day' => $date->toDateString(),
                    'week' => $date->copy()->startOfWeek(Carbon::MONDAY)->toDateString(),
                    'month' => $date->copy()->startOfMonth()->toDateString(),
                    'year' => $date->copy()->startOfYear()->toDateString(),
                    default => $date->toDateString(),
                };

                $row = $source->get($bucketKey);

                return [
                    'day' => $bucketKey,
                    'label' => match ($groupBy) {
                        'day' => $date->format('M d'),
                        'week' => 'Week of '.$date->copy()->startOfWeek(Carbon::MONDAY)->format('M d'),
                        'month' => $date->format('M Y'),
                        'year' => $date->format('Y'),
                        default => $date->format('M d'),
                    },
                    'appointments' => (int) ($row->appointments ?? 0),
                    'completed_appointments' => (int) ($row->completed_appointments ?? 0),
                    'completion_rate' => (int) ($row->appointments ?? 0) > 0
                        ? round(((int) ($row->completed_appointments ?? 0) / (int) ($row->appointments ?? 0)) * 100, 1)
                        : 0.0,
                    'revenue' => (float) ($row->revenue ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function buildRevenueTrend(string $range): array
    {
        if ($range === 'day') {
            $day = now()->copy()->startOfDay();
            $row = DB::table('appointments as a')
                ->selectRaw('COUNT(*) as appointments, SUM(CASE WHEN a.payment_status = "pay" AND a.status = "inactive" THEN a.final_amount ELSE 0 END) as revenue')
                ->whereDate('a.appointment_date', $day->toDateString())
                ->where('a.status', 'inactive')
                ->first();

            return [[
                'day' => $day->toDateString(),
                'label' => $day->format('M d'),
                'appointments' => (int) ($row->appointments ?? 0),
                'revenue' => (float) ($row->revenue ?? 0),
            ]];
        }

        if ($range === 'month') {
            $trendStart = now()->copy()->subDays(19)->startOfDay();
            $trendEnd = now()->copy()->endOfDay();
            $trendSource = DB::table('appointments as a')
                ->selectRaw('DATE(a.appointment_date) as day, COUNT(*) as appointments, SUM(CASE WHEN a.payment_status = "pay" AND a.status = "inactive" THEN a.final_amount ELSE 0 END) as revenue')
                ->whereBetween('a.appointment_date', [$trendStart, $trendEnd])
                ->where('a.status', 'inactive')
                ->groupBy(DB::raw('DATE(a.appointment_date)'))
                ->orderBy('day')
                ->get()
                ->keyBy('day');

            return collect(CarbonPeriod::create($trendStart->copy()->startOfDay(), '1 day', $trendEnd->copy()->startOfDay()))
                ->map(function (Carbon $day) use ($trendSource) {
                    $key = $day->toDateString();
                    $row = $trendSource->get($key);

                    return [
                        'day' => $key,
                        'label' => $day->format('M d'),
                        'appointments' => (int) ($row->appointments ?? 0),
                        'revenue' => (float) ($row->revenue ?? 0),
                    ];
                })
                ->values()
                ->all();
        }

        $year = now()->year;
        $source = DB::table('appointments as a')
            ->selectRaw('MONTH(a.appointment_date) as month, COUNT(*) as appointments, SUM(CASE WHEN a.payment_status = "pay" AND a.status = "inactive" THEN a.final_amount ELSE 0 END) as revenue')
            ->whereYear('a.appointment_date', $year)
            ->where('a.status', 'inactive')
            ->groupBy(DB::raw('MONTH(a.appointment_date)'))
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        return collect(range(1, 12))
            ->map(function (int $month) use ($source, $year) {
                $row = $source->get($month);
                $date = Carbon::create($year, $month, 1);

                return [
                    'day' => $date->toDateString(),
                    'label' => $date->format('M'),
                    'appointments' => (int) ($row->appointments ?? 0),
                    'revenue' => (float) ($row->revenue ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function buildRevenueTrendForWindow(Carbon $start, Carbon $end): array
    {
        $days = $start->copy()->startOfDay()->diffInDays($end->copy()->endOfDay()) + 1;

        if ($days <= 31) {
            $source = DB::table('appointments as a')
                ->selectRaw('DATE(a.appointment_date) as day, COUNT(*) as appointments, SUM(CASE WHEN a.payment_status = "pay" AND a.status = "inactive" THEN a.final_amount ELSE 0 END) as revenue')
                ->whereBetween('a.appointment_date', [$start, $end])
                ->where('a.status', 'inactive')
                ->groupBy(DB::raw('DATE(a.appointment_date)'))
                ->orderBy('day')
                ->get()
                ->keyBy('day');

            return collect(CarbonPeriod::create($start->copy()->startOfDay(), '1 day', $end->copy()->startOfDay()))
                ->map(function (Carbon $day) use ($source) {
                    $key = $day->toDateString();
                    $row = $source->get($key);

                    return [
                        'day' => $key,
                        'label' => $day->format('M d'),
                        'appointments' => (int) ($row->appointments ?? 0),
                        'revenue' => (float) ($row->revenue ?? 0),
                    ];
                })
                ->values()
                ->all();
        }

        // Wider ranges: aggregate by month and still return every month in the window.
        $monthStart = $start->copy()->startOfMonth();
        $monthEnd = $end->copy()->startOfMonth();

        $source = DB::table('appointments as a')
            ->selectRaw('DATE_FORMAT(a.appointment_date, "%Y-%m-01") as day, COUNT(*) as appointments, SUM(CASE WHEN a.payment_status = "pay" AND a.status = "inactive" THEN a.final_amount ELSE 0 END) as revenue')
            ->whereBetween('a.appointment_date', [$start, $end])
            ->where('a.status', 'inactive')
            ->groupBy(DB::raw('DATE_FORMAT(a.appointment_date, "%Y-%m-01")'))
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        return collect(CarbonPeriod::create($monthStart, '1 month', $monthEnd))
            ->map(function (Carbon $month) use ($source) {
                $key = $month->toDateString();
                $row = $source->get($key);

                return [
                    'day' => $key,
                    'label' => $month->format('M Y'),
                    'appointments' => (int) ($row->appointments ?? 0),
                    'revenue' => (float) ($row->revenue ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    public function calendar(Request $request)
    {
        $abilities = $request->user()?->currentAccessToken()?->abilities ?? [];
        $isAdmin = in_array('admin', $abilities, true);
        $isStaff = in_array('staff', $abilities, true);
        $isClient = in_array('client', $abilities, true);

        $from = $request->query('from', now()->startOfWeek()->toDateString());
        $to = $request->query('to', now()->endOfWeek()->toDateString());
        $view = $request->query('view', 'week');

        $appointments = Appointment::query()
            ->with(['client:client_id,client_name', 'appointmentDetails.staff:staff_id,staff_name', 'appointmentDetails.service:service_id,service_name'])
            ->whereDate('appointment_date', '>=', $from)
            ->whereDate('appointment_date', '<=', $to)
            ->orderBy('appointment_date');

        if ($isClient) {
            $appointments->where('client_id', $request->user()->getKey());
        } elseif ($isStaff) {
            $appointments->whereHas('appointmentDetails', function ($q) use ($request) {
                $q->where('staff_id', $request->user()->getKey());
            });
        } elseif (! $isAdmin) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $schedules = StaffSchedule::query()
            ->with(['staff:staff_id,staff_name', 'shift:shift_id,shift_name'])
            ->whereBetween('date', [$from, $to])
            ->orderBy('date');

        if ($isStaff) {
            $schedules->where('staff_id', $request->user()->getKey());
        }

        return ApiResponse::success([
            'view' => $view,
            'from' => $from,
            'to' => $to,
            'appointments' => $appointments->get(),
            'schedules' => $schedules->get(),
            'shifts' => $schedules->get(),
        ], 'Calendar retrieved.');
    }

    public function performance(Request $request)
    {
        if (! $this->isAdmin($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $range = $request->query('range', 'month');
        $staffId = $request->query('staff_id');

        $validated = $request->validate([
            'mode' => ['nullable', 'in:quick,custom'],
            'preset' => ['nullable', 'in:today,this_week,last_7_days,this_month,this_year'],
            'group_by' => ['nullable', 'in:hour,day,week,month'],
            // Spec params
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            // Back-compat params currently used by frontend
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $window = $this->resolvePerformanceWindow($validated, $range);
        $start = $window['start'];
        $end = $window['end'];
        $groupBy = $window['group_by'];

        $appointmentQuery = Appointment::query()
            ->whereBetween('appointment_date', [$start, $end]);

        if ($staffId) {
            $appointmentQuery->whereHas('appointmentDetails', function ($query) use ($staffId) {
                $query->where('staff_id', $staffId);
                $this->constrainServiceDetails($query);
            });
        }

        $totalAppointments = (clone $appointmentQuery)->count();
        $completedAppointments = (clone $appointmentQuery)->where('status', 'inactive')->count();
        $activeAppointments = (clone $appointmentQuery)->where('status', 'active')->count();
        $revenue = (float) (clone $appointmentQuery)->where('status', 'inactive')->sum('final_amount');
        $completionRate = $totalAppointments > 0 ? round(($completedAppointments / $totalAppointments) * 100, 1) : 0.0;
        $averageRevenue = $completedAppointments > 0 ? round($revenue / $completedAppointments, 2) : 0.0;

        $detailBaseQuery = DB::table('appointment_details as ad')
            ->join('appointments as a', 'a.appointment_id', '=', 'ad.appointment_id')
            ->whereBetween('a.appointment_date', [$start, $end]);
        $this->constrainServiceDetails($detailBaseQuery, 'ad');
        if ($staffId) {
            $detailBaseQuery->where('ad.staff_id', $staffId);
        }

        $completedTasks = (clone $detailBaseQuery)
            ->where(function ($query) {
                $query->whereNotNull('ad.completed_at')
                    ->orWhere('a.status', 'inactive');
            })
            ->count();
        $activeTasks = (clone $detailBaseQuery)
            ->where(function ($query) {
                $query->whereNull('ad.completed_at')
                    ->where('a.status', 'active');
            })
            ->count();

        $attendanceBaseQuery = StaffSchedule::query()
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        if ($staffId) {
            $attendanceBaseQuery->where('staff_id', $staffId);
        }

        $attendanceSummary = (clone $attendanceBaseQuery)
            ->selectRaw('COUNT(*) as scheduled_days, SUM(CASE WHEN actual_check_in IS NOT NULL THEN 1 ELSE 0 END) as attended_days, SUM(CASE WHEN actual_check_in IS NOT NULL AND actual_check_out IS NOT NULL THEN 1 ELSE 0 END) as completed_shifts')
            ->first();
        $attendanceRate = (int) ($attendanceSummary->scheduled_days ?? 0) > 0
            ? round(((int) ($attendanceSummary->attended_days ?? 0) / (int) ($attendanceSummary->scheduled_days ?? 0)) * 100, 1)
            : 0.0;

        $feedbackSummary = DB::table('feedback as f')
            ->join('appointments as a', 'a.appointment_id', '=', 'f.appointment_id')
            ->join('appointment_details as ad', 'ad.appointment_id', '=', 'a.appointment_id')
            ->whereBetween('a.appointment_date', [$start, $end]);
        $this->constrainServiceDetails($feedbackSummary, 'ad');
        if ($staffId) {
            $feedbackSummary->where('ad.staff_id', $staffId);
        }
        $feedbackSummary = $feedbackSummary
            ->selectRaw('AVG(f.rating) as avg_rating, COUNT(DISTINCT f.feedback_id) as feedback_count')
            ->first();

        $trendRows = $this->buildPerformanceTrendSeries($start, $end, $groupBy);

        $staffTaskRows = (clone $detailBaseQuery)
            ->selectRaw('ad.staff_id, COUNT(*) as total_tasks, SUM(CASE WHEN ad.completed_at IS NOT NULL OR a.status = "inactive" THEN 1 ELSE 0 END) as completed_tasks, SUM(CASE WHEN ad.completed_at IS NULL AND a.status = "active" THEN 1 ELSE 0 END) as active_tasks, COUNT(DISTINCT a.appointment_id) as appointments_served, SUM(CASE WHEN a.payment_status = "pay" AND a.status = "inactive" THEN a.final_amount ELSE 0 END) as revenue, AVG(CASE WHEN ad.started_at IS NOT NULL AND ad.completed_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ad.started_at, ad.completed_at) WHEN ad.start_time IS NOT NULL AND ad.end_time IS NOT NULL THEN TIME_TO_SEC(TIMEDIFF(ad.end_time, ad.start_time)) / 60 ELSE NULL END) as avg_service_minutes')
            ->groupBy('ad.staff_id')
            ->get()
            ->keyBy('staff_id');

        $feedbackByStaff = DB::table('feedback as f')
            ->join('appointments as a', 'a.appointment_id', '=', 'f.appointment_id')
            ->join('appointment_details as ad', 'ad.appointment_id', '=', 'a.appointment_id')
            ->whereBetween('a.appointment_date', [$start, $end]);
        $this->constrainServiceDetails($feedbackByStaff, 'ad');
        if ($staffId) {
            $feedbackByStaff->where('ad.staff_id', $staffId);
        }

        $feedbackByStaff = $feedbackByStaff
            ->selectRaw('ad.staff_id, AVG(f.rating) as avg_rating, COUNT(DISTINCT f.feedback_id) as feedback_count')
            ->groupBy('ad.staff_id')
            ->get()
            ->keyBy('staff_id');

        $staffScheduleRows = $attendanceBaseQuery
            ->selectRaw('staff_id, COUNT(*) as scheduled_days, SUM(CASE WHEN actual_check_in IS NOT NULL THEN 1 ELSE 0 END) as attended_days, SUM(CASE WHEN actual_check_in IS NOT NULL AND actual_check_out IS NOT NULL THEN 1 ELSE 0 END) as completed_shifts')
            ->groupBy('staff_id')
            ->get()
            ->keyBy('staff_id');

        $staffPerformance = Staff::query()
            ->select('staff_id', 'staff_name', 'specialization', 'status')
            ->when($staffId, fn ($query) => $query->where('staff_id', $staffId))
            ->orderBy('staff_name')
            ->get()
            ->map(function ($staff) use ($staffTaskRows, $staffScheduleRows, $feedbackByStaff) {
                $taskRow = $staffTaskRows->get($staff->staff_id);
                $attendanceRow = $staffScheduleRows->get($staff->staff_id);
                $feedbackRow = $feedbackByStaff->get($staff->staff_id);

                $completed = (int) ($taskRow->completed_tasks ?? 0);
                $active = (int) ($taskRow->active_tasks ?? 0);
                $total = (int) ($taskRow->total_tasks ?? 0);
                $appointmentsServed = (int) ($taskRow->appointments_served ?? 0);
                $revenueValue = (float) ($taskRow->revenue ?? 0);
                $scheduledDays = (int) ($attendanceRow->scheduled_days ?? 0);
                $attendedDays = (int) ($attendanceRow->attended_days ?? 0);
                $completedShifts = (int) ($attendanceRow->completed_shifts ?? 0);
                $attendanceRate = $scheduledDays > 0 ? round(($attendedDays / $scheduledDays) * 100, 1) : 0.0;
                $feedbackAverage = round((float) ($feedbackRow->avg_rating ?? 0), 1);
                $feedbackCount = (int) ($feedbackRow->feedback_count ?? 0);

                return [
                    'staff_id' => $staff->staff_id,
                    'staff_name' => $staff->staff_name,
                    'specialization' => $staff->specialization,
                    'status' => $staff->status,
                    'completed_tasks' => $completed,
                    'active_tasks' => $active,
                    'total_tasks' => $total,
                    'appointments_served' => $appointmentsServed,
                    'revenue' => $revenueValue,
                    'attendance_rate' => $attendanceRate,
                    'scheduled_days' => $scheduledDays,
                    'attended_days' => $attendedDays,
                    'completed_shifts' => $completedShifts,
                    'feedback_average' => $feedbackAverage,
                    'feedback_count' => $feedbackCount,
                    'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0.0,
                ];
            })
            ->sortByDesc('revenue')
            ->values()
            ->all();

        $maxRevenue = collect($staffPerformance)->max('revenue') ?: 0;
        $staffPerformance = collect($staffPerformance)->map(function (array $row) use ($maxRevenue) {
            $revenueScore = $maxRevenue > 0 ? round(($row['revenue'] / $maxRevenue) * 100, 1) : 0.0;
            $feedbackScore = $row['feedback_average'] > 0 ? round(($row['feedback_average'] / 5) * 100, 1) : 0.0;
            $score = round(
                ($row['completion_rate'] * 0.35) +
                ($row['attendance_rate'] * 0.25) +
                ($feedbackScore * 0.2) +
                ($revenueScore * 0.2),
                1
            );

            return array_merge($row, [
                'revenue_score' => $revenueScore,
                'feedback_score' => $feedbackScore,
                'performance_score' => $score,
            ]);
        })->sortByDesc('performance_score')->values()->all();

        $serviceRows = DB::table('appointment_details as ad')
            ->join('appointments as a', 'a.appointment_id', '=', 'ad.appointment_id')
            ->leftJoin('services as s', function ($join) {
                $join->on('s.service_id', '=', 'ad.service_id')
                    ->orOn('s.service_id', '=', 'ad.item_id');
            })
            ->whereBetween('a.appointment_date', [$start, $end]);
        $this->constrainServiceDetails($serviceRows, 'ad');
        if ($staffId) {
            $serviceRows->where('ad.staff_id', $staffId);
        }

        $serviceEfficiency = $serviceRows
            ->selectRaw('COALESCE(s.service_name, CONCAT("Service #", COALESCE(ad.service_id, ad.item_id))) as service_name, COUNT(*) as total_lines, SUM(CASE WHEN ad.completed_at IS NOT NULL OR a.status = "inactive" THEN 1 ELSE 0 END) as completed_lines, AVG(CASE WHEN ad.started_at IS NOT NULL AND ad.completed_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ad.started_at, ad.completed_at) WHEN ad.start_time IS NOT NULL AND ad.end_time IS NOT NULL THEN TIME_TO_SEC(TIMEDIFF(ad.end_time, ad.start_time)) / 60 ELSE NULL END) as avg_minutes, AVG(CASE WHEN ad.completed_at IS NOT NULL OR a.status = "inactive" THEN 1 ELSE 0 END) as completion_ratio, COUNT(DISTINCT a.appointment_id) as appointments_count')
            ->groupByRaw('COALESCE(s.service_name, CONCAT("Service #", COALESCE(ad.service_id, ad.item_id)))')
            ->orderByDesc('completed_lines')
            ->get()
            ->map(function ($row) {
                return [
                    'service_name' => $row->service_name,
                    'total_lines' => (int) $row->total_lines,
                    'completed_lines' => (int) $row->completed_lines,
                    'completion_rate' => round(((float) ($row->completion_ratio ?? 0)) * 100, 1),
                    'avg_minutes' => round((float) ($row->avg_minutes ?? 0), 1),
                    'appointments_count' => (int) $row->appointments_count,
                ];
            })
            ->values()
            ->all();

        $summary = [
            'total_appointments' => $totalAppointments,
            'completed_appointments' => $completedAppointments,
            'active_appointments' => $activeAppointments,
            'completion_rate' => $completionRate,
            'completed_tasks' => $completedTasks,
            'active_tasks' => $activeTasks,
            'revenue' => $revenue,
            'average_revenue' => $averageRevenue,
            'attendance_rate' => $attendanceRate,
            'feedback_average' => round((float) ($feedbackSummary->avg_rating ?? 0), 1),
            'feedback_count' => (int) ($feedbackSummary->feedback_count ?? 0),
        ];

        return ApiResponse::success([
            'mode' => $window['mode'],
            'preset' => $window['preset'],
            'group_by' => $groupBy,
            'start' => $start->toISOString(),
            'end' => $end->toISOString(),
            'summary' => $summary,
            'trend' => $trendRows,
            'staff_performance' => $staffPerformance,
            'service_efficiency' => $serviceEfficiency,
        ], 'Performance retrieved.');
    }
}
