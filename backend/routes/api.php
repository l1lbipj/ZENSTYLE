<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\AuthController;

// Auth routes (login, profile, logout)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/client/profile', [AuthController::class, 'profile']);
        Route::post('/client/logout', [AuthController::class, 'logout']);
    });
});

// Client CRUD routes (protected)
Route::middleware('auth:sanctum')->prefix('client')->group(function () {
    Route::post('/', [ClientController::class, 'store']);
    Route::get('/', [ClientController::class, 'index']);
    Route::get('/{id}', [ClientController::class, 'show']);
    Route::put('/{id}', [ClientController::class, 'update']);
    Route::delete('/{id}', [ClientController::class, 'destroy']);
});
