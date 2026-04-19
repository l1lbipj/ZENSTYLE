<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\Appointment;
use App\Models\ShopOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    private function abilities(Request $request): array
    {
        return $request->user()?->currentAccessToken()?->abilities ?? [];
    }

    private function usesMixedItemSchema(): bool
    {
        return Schema::hasColumn('appointment_details', 'item_id');
    }

    private function usesLegacyItemTypeValues(): bool
    {
        try {
            $column = DB::selectOne("SHOW COLUMNS FROM appointment_details LIKE 'item_type'");
            $type = strtolower((string) ($column->Type ?? ''));

            return str_contains($type, "enum('skin','hair')") || str_contains($type, "enum('skin','hair')");
        } catch (\Throwable) {
            return false;
        }
    }

    private function constrainServiceDetails($query, bool $usesMixedItemSchema, bool $usesLegacyItemTypeValues): void
    {
        if ($usesMixedItemSchema && ! $usesLegacyItemTypeValues) {
            $query->where('item_type', 'service');

            return;
        }

        $query->whereNotNull('service_id');
    }

    public function index(Request $request)
    {
        $abilities = $this->abilities($request);
        $isAdmin = in_array('admin', $abilities, true);
        $isStaff = in_array('staff', $abilities, true);

        if (! $isAdmin && ! $isStaff) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $usesMixedItemSchema = $this->usesMixedItemSchema();
        $usesLegacyItemTypeValues = $this->usesLegacyItemTypeValues();

        $query = Appointment::query()
            ->with([
                'client:client_id,client_name,email,phone',
                'appointmentDetails' => function ($q) use ($isStaff, $request, $usesLegacyItemTypeValues, $usesMixedItemSchema) {
                    if ($isStaff) {
                        $q->where('staff_id', $request->user()->getKey());
                        $this->constrainServiceDetails($q, $usesMixedItemSchema, $usesLegacyItemTypeValues);
                    }
                },
                'appointmentDetails.service',
                'appointmentDetails.product',
                'appointmentDetails.staff:staff_id,staff_name',
            ]);

        if ($usesMixedItemSchema) {
            $query->with('appointmentDetails.item');
        }

        if ($isStaff) {
            $query->whereHas('appointmentDetails', function ($q) use ($request, $usesLegacyItemTypeValues, $usesMixedItemSchema) {
                $q->where('staff_id', $request->user()->getKey());
                $this->constrainServiceDetails($q, $usesMixedItemSchema, $usesLegacyItemTypeValues);
            });
        }

        $appointments = $query->orderByDesc('appointment_date')->limit(50)->get();

        if ($isAdmin) {
            $orders = ShopOrder::query()
                ->with(['items.product:product_id,product_name,image_url,unit_price'])
                ->orderByDesc('shop_order_id')
                ->limit(50)
                ->get();

            return ApiResponse::success([
                'appointments' => $appointments,
                'orders' => $orders,
            ], 'Notifications retrieved.');
        }

        return ApiResponse::success(['appointments' => $appointments], 'Notifications retrieved.');
    }
}
