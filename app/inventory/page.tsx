import { Suspense } from 'react';
import InventoryClient from './InventoryClient';
import { fetchInventory } from '../lib/google-sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function InventoryPage() {
    const products = await fetchInventory();

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin"></div>
                    <div className="text-[#8E8E93] font-medium animate-pulse">Loading inventory...</div>
                </div>
            </div>
        }>
            <InventoryClient initialProducts={products} />
        </Suspense>
    );
}