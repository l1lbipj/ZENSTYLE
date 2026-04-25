<?php

namespace App\Support;

use App\Models\Client;
use App\Services\AllergyService;

class ClientAllergySync
{
    public function __construct(private readonly AllergyService $allergyService)
    {
    }

    /**
     * @param array<int, int|string> $allergyIds
     */
    public function sync(Client $client, array $allergyIds = [], array $customAllergies = []): void
    {
        // Custom allergies are intentionally ignored in the new model.
        unset($customAllergies);
        $this->allergyService->syncClientSelections($client, $allergyIds);
    }
}
