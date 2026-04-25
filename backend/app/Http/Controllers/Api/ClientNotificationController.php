<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Services\ClientNotificationService;
use Illuminate\Http\Request;

class ClientNotificationController extends Controller
{
    public function __construct(private readonly ClientNotificationService $notificationService)
    {
    }

    private function isClient(Request $request): bool
    {
        return in_array('client', $request->user()?->currentAccessToken()?->abilities ?? [], true);
    }

    public function index(Request $request)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $payload = $this->notificationService->listForClient((int) $request->user()->getKey());

        return ApiResponse::success($payload, 'Notifications retrieved.');
    }

    public function read(Request $request, string $id)
    {
        if (! $this->isClient($request)) {
            return ApiResponse::error('Access denied.', 403, 'FORBIDDEN');
        }

        $notification = $this->notificationService->markAsRead((int) $request->user()->getKey(), (int) $id);
        if (! $notification) {
            return ApiResponse::error('Notification not found.', 404, 'NOT_FOUND');
        }

        return ApiResponse::success($notification, 'Notification marked as read.');
    }
}

