<?php

namespace App\Providers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Product;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::enforceMorphMap([
            // Sanctum tokenable types
            'admin' => Admin::class,
            'staff' => Staff::class,
            'client' => Client::class,

            'service' => Service::class,
            'product' => Product::class,
        ]);
    }
}
