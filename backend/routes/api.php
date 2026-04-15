<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\AuthController;

// Auth routes (login, profile, logout)
Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {

        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::post('/google', [AuthController::class, 'googleLogin'])->middleware('throttle:5,1');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/profile', [AuthController::class, 'profile'])->middleware('throttle:60,1');
            Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle:60,1');
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
    });

});
