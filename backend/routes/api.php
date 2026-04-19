<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ManagementController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ShopOrderController;
use App\Http\Controllers\Api\StaffWorkController;

// Auth routes (login, profile, logout)
Route::prefix('v1')->group(function () {

    // Public product catalog (no auth)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');

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
        Route::get('/client/me/history', [ProfileController::class, 'clientHistory']);
        Route::get('/client/me/preferences', [ProfileController::class, 'clientPreferences']);
        Route::put('/client/me/preferences', [ProfileController::class, 'updateClientPreferences']);

        Route::get('/dashboard/admin', [DashboardController::class, 'admin']);
        Route::get('/dashboard/staff', [DashboardController::class, 'staff']);
        Route::get('/dashboard/client', [DashboardController::class, 'client']);

        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::patch('/appointments/{id}/cancel', [AppointmentController::class, 'cancel'])->whereNumber('id');
        Route::patch('/appointments/{id}/check-in', [AppointmentController::class, 'checkIn'])->whereNumber('id');
        Route::patch('/appointments/{id}/check-out', [AppointmentController::class, 'checkOut'])->whereNumber('id');
        Route::put('/appointments/{id}/reschedule', [AppointmentController::class, 'reschedule'])->whereNumber('id');
        Route::patch('/appointment-details/{id}/complete', [AppointmentController::class, 'completeDetail'])->whereNumber('id');

        Route::get('/feedback', [FeedbackController::class, 'index']);
        Route::post('/feedback', [FeedbackController::class, 'store']);
        Route::patch('/feedback/{id}/reply', [FeedbackController::class, 'reply'])->whereNumber('id');

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

        Route::get('/management/suppliers', [ManagementController::class, 'suppliers']);
        Route::post('/management/suppliers', [ManagementController::class, 'storeSupplier']);
        Route::put('/management/suppliers/{id}', [ManagementController::class, 'updateSupplier'])->whereNumber('id');
        Route::delete('/management/suppliers/{id}', [ManagementController::class, 'deleteSupplier'])->whereNumber('id');

        Route::get('/management/reports', [ManagementController::class, 'reports']);

        // Admin product CRUD (same resource as public catalog)
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

        // Shop checkout (client)
        Route::prefix('shop')->group(function () {
            Route::post('/checkout', [ShopOrderController::class, 'checkout']);
            Route::get('/orders', [ShopOrderController::class, 'index']);
            Route::get('/orders/{id}', [ShopOrderController::class, 'show'])->whereNumber('id');
        });
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
