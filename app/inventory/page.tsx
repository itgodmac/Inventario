import { Suspense } from 'react';
import InventoryClient from './InventoryClient';
import { fetchInventory } from '../lib/google-sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default function InventoryPage() {
    // Start fetching but DON'T await it yet. 
    // This allows the Client Component to start rendering the shell immediately.
    const productsPromise = fetchInventory();

    return (
        <InventoryClient productsPromise={productsPromise} />
    );
}