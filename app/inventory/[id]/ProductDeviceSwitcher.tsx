'use client';

import { useState, useEffect } from 'react';
import InventoryClient from '../InventoryClient';
import ProductDetailClient from './ProductDetailClient';

interface ProductDeviceSwitcherProps {
    product: any;
    initialId: string;
}

export default function ProductDeviceSwitcher({ product, initialId }: ProductDeviceSwitcherProps) {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    // Theme configurations (shared)
    const themes = {
        bigm: {
            primary: '#C8D900',
            secondary: '#5A6670',
            name: 'Big Machines',
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initial render / Loading state
    if (isMobile === null) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-zinc-800 border-t-primary animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Cargando producto...</p>
                </div>
            </div>
        );
    }

    if (isMobile) {
        // MOBILE: Show full inventory with modal open
        return <InventoryClient initialProductId={initialId} initialProduct={product} />;
    }

    // DESKTOP: Show dedicated detail page
    return <ProductDetailClient product={product} currentTheme={themes.bigm} />;
}
