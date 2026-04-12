<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ClientController;

Route::post('/client', [ClientController::class, 'store']);
Route::get('/client', [ClientController::class, 'index']);
Route::get('/client/{id}', [ClientController::class, 'show']);
