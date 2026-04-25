<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ManagementController;
use App\Http\Controllers\Api\ServiceCategoryController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\CustomerOrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ClientNotificationController;
use App\Http\Controllers\Api\WorkforceController;
use App\Http\Controllers\Api\StaffWorkController;

// Auth routes (login, profile, logout)
Route::prefix('v1')->group(function () {

    // Public product catalog (no auth)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');
    Route::get('/products/categories', [ProductController::class, 'categories']);

    Route::prefix('auth')->group(function () {

        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::post('/google', [AuthController::class, 'googleLogin'])->middleware('throttle:5,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/profile', [AuthController::class, 'profile'])->middleware('throttle:60,1');
            Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle:60,1');
        });
    });

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/profile/me', [ProfileController::class, 'me']);
        Route::put('/profile/me', [ProfileController::class, 'updateMe']);
        Route::get('/allergies', [ProfileController::class, 'allergyCatalog']);
        Route::get('/client/me/history', [ProfileController::class, 'clientHistory']);
        Route::get('/client/me/payments', [ProfileController::class, 'clientPaymentHistory']);
        Route::get('/client/me/orders', [CustomerOrderController::class, 'index']);
        Route::get('/client/me/orders/{id}', [CustomerOrderController::class, 'show'])->whereNumber('id');
        Route::patch('/client/me/orders/{id}/cancel', [CustomerOrderController::class, 'cancel'])->whereNumber('id');
        Route::get('/client/me/preferences', [ProfileController::class, 'clientPreferences']);
        Route::put('/client/me/preferences', [ProfileController::class, 'updateClientPreferences']);
        Route::get('/client/notifications', [ClientNotificationController::class, 'index']);
        Route::put('/client/notifications/{id}/read', [ClientNotificationController::class, 'read'])->whereNumber('id');

        Route::get('/dashboard/admin', [DashboardController::class, 'admin']);
        Route::get('/dashboard/staff', [DashboardController::class, 'staff']);
        Route::get('/dashboard/client', [DashboardController::class, 'client']);
        Route::get('/admin/revenue', [DashboardController::class, 'revenue']);

        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::patch('/appointments/{id}/cancel', [AppointmentController::class, 'cancel'])->whereNumber('id');
        Route::post('/appointments/{id}/check-in', [AppointmentController::class, 'checkIn'])->whereNumber('id');
        Route::post('/appointments/{id}/check-out', [AppointmentController::class, 'checkOut'])->whereNumber('id');
        Route::patch('/appointments/{id}/check-in', [AppointmentController::class, 'checkIn'])->whereNumber('id');
        Route::patch('/appointments/{id}/check-out', [AppointmentController::class, 'checkOut'])->whereNumber('id');
        Route::patch('/appointments/{id}/service-start', [AppointmentController::class, 'startService'])->whereNumber('id');
        Route::patch('/appointments/{id}/service-end', [AppointmentController::class, 'endService'])->whereNumber('id');
        Route::put('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule'])->whereNumber('id');
        Route::patch('/appointment-details/{id}/complete', [AppointmentController::class, 'completeDetail'])->whereNumber('id');
        Route::get('/services', [ManagementController::class, 'services']);

        Route::get('/feedback', [FeedbackController::class, 'index']);
        Route::post('/feedback', [FeedbackController::class, 'store']);
        Route::patch('/feedback/{id}/reply', [FeedbackController::class, 'reply'])->whereNumber('id');
        Route::post('/feedbacks/{id}/reply', [FeedbackController::class, 'reply'])->whereNumber('id');
        Route::get('/admin/feedbacks', [FeedbackController::class, 'adminIndex']);
        Route::get('/staff/feedbacks', [FeedbackController::class, 'staffIndex']);

        // Backward compatible alias for performance (frontend uses /operations/performance)
        Route::get('/admin/performance', [WorkforceController::class, 'performance']);
        Route::get('/admin/allergies', [ManagementController::class, 'allergies']);
        Route::post('/admin/allergies', [ManagementController::class, 'storeAllergy']);
        Route::put('/admin/allergies/{key}', [ManagementController::class, 'updateAllergy']);
        Route::delete('/admin/allergies/{key}', [ManagementController::class, 'deleteAllergy']);

        Route::get('/management/services', [ManagementController::class, 'services']);
        Route::post('/management/services', [ManagementController::class, 'storeService']);
        Route::put('/management/services/{id}', [ManagementController::class, 'updateService'])->whereNumber('id');
        Route::delete('/management/services/{id}', [ManagementController::class, 'deleteService'])->whereNumber('id');

        Route::get('/management/promotions', [ManagementController::class, 'promotions']);
        Route::post('/management/promotions', [ManagementController::class, 'storePromotion']);
        Route::put('/management/promotions/{id}', [ManagementController::class, 'updatePromotion'])->whereNumber('id');
        Route::delete('/management/promotions/{id}', [ManagementController::class, 'deletePromotion'])->whereNumber('id');

        Route::get('/management/products', [ManagementController::class, 'products']);
        Route::post('/management/products', [ManagementController::class, 'storeProduct']);
        Route::put('/management/products/{id}', [ManagementController::class, 'updateProduct'])->whereNumber('id');
        Route::delete('/management/products/{id}', [ManagementController::class, 'deleteProduct'])->whereNumber('id');
        Route::get('/admin/products', [ManagementController::class, 'products']);
        Route::post('/admin/products', [ManagementController::class, 'storeProduct']);
        Route::put('/admin/products/{id}', [ManagementController::class, 'updateProduct'])->whereNumber('id');
        Route::delete('/admin/products/{id}', [ManagementController::class, 'deleteProduct'])->whereNumber('id');
        Route::get('/admin/orders', [ManagementController::class, 'orders']);
        Route::get('/admin/orders/{id}', [ManagementController::class, 'orderShow'])->whereNumber('id');
        Route::put('/admin/orders/{id}/approve', [ManagementController::class, 'approveOrder'])->whereNumber('id');
        Route::put('/admin/orders/{id}/cancel', [ManagementController::class, 'cancelOrder'])->whereNumber('id');
        // Admin product orders
        Route::get('/admin/product-orders', [ManagementController::class, 'productOrders']);
        Route::get('/admin/product-orders/{id}', [ManagementController::class, 'productOrderShow']);
        Route::put('/admin/product-orders/{id}/approve', [ManagementController::class, 'approveProductOrder']);
        Route::put('/admin/product-orders/{id}/cancel', [ManagementController::class, 'cancelProductOrder']);
        Route::put('/admin/appointments/{id}/approve', [ManagementController::class, 'approveAppointment'])->whereNumber('id');
        Route::put('/admin/appointments/{id}/cancel', [ManagementController::class, 'cancelOrder'])->whereNumber('id');
        Route::get('/admin/product-categories', [ProductCategoryController::class, 'index']);
        Route::post('/admin/product-categories', [ProductCategoryController::class, 'store']);
        Route::put('/admin/product-categories/{id}', [ProductCategoryController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/product-categories/{id}', [ProductCategoryController::class, 'destroy'])->whereNumber('id');
        Route::get('/admin/service-categories', [ServiceCategoryController::class, 'index']);
        Route::post('/admin/service-categories', [ServiceCategoryController::class, 'store']);
        Route::put('/admin/service-categories/{id}', [ServiceCategoryController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/service-categories/{id}', [ServiceCategoryController::class, 'destroy'])->whereNumber('id');

        Route::get('/management/suppliers', [ManagementController::class, 'suppliers']);
        Route::post('/management/suppliers', [ManagementController::class, 'storeSupplier']);
        Route::put('/management/suppliers/{id}', [ManagementController::class, 'updateSupplier'])->whereNumber('id');
        Route::delete('/management/suppliers/{id}', [ManagementController::class, 'deleteSupplier'])->whereNumber('id');

        Route::get('/management/reports', [ManagementController::class, 'reports']);

        Route::get('/operations/calendar', [WorkforceController::class, 'calendar']);
        Route::get('/operations/performance', [WorkforceController::class, 'performance']);

        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
        Route::put('/purchase-orders/{id}', [PurchaseOrderController::class, 'update'])->whereNumber('id');
        Route::patch('/purchase-orders/{id}/send', [PurchaseOrderController::class, 'send'])->whereNumber('id');
        Route::patch('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'receive'])->whereNumber('id');
        Route::delete('/purchase-orders/{id}', [PurchaseOrderController::class, 'destroy'])->whereNumber('id');
        Route::post('/customer-orders', [CustomerOrderController::class, 'store']);

        // Admin product CRUD (same resource as public catalog)
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

    });

    Route::middleware(['auth:sanctum'])->prefix('client')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/{id}', [ClientController::class, 'show'])->whereNumber('id');
        Route::put('/{id}', [ClientController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [ClientController::class, 'destroy'])->whereNumber('id');
    });

    Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
        Route::get('/', [StaffController::class, 'index']);
        Route::post('/', [StaffController::class, 'store']);
        Route::get('/{id}', [StaffController::class, 'show'])->whereNumber('id');
        Route::put('/{id}', [StaffController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [StaffController::class, 'destroy'])->whereNumber('id');
        Route::get('/schedules', [StaffWorkController::class, 'schedules']);
        Route::get('/schedule', [StaffWorkController::class, 'schedule']);
        Route::get('/appointments', [StaffWorkController::class, 'appointments']);
        // Backward-compatible paths used by current frontend
        Route::get('/attendance/today', [StaffWorkController::class, 'todayAttendance']);
        Route::get('/attendance/history', [StaffWorkController::class, 'attendanceHistory']);
        Route::post('/attendance/check-in', [StaffWorkController::class, 'checkIn']);
        Route::post('/attendance/check-out', [StaffWorkController::class, 'checkOut']);
    });

    // Requested generic attendance endpoints for staff
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/attendance/today', [StaffWorkController::class, 'todayAttendance']);
        Route::get('/attendance/history', [StaffWorkController::class, 'attendanceHistory']);
        Route::post('/attendance/check-in', [StaffWorkController::class, 'checkIn']);
        Route::post('/attendance/check-out', [StaffWorkController::class, 'checkOut']);
    });

});
