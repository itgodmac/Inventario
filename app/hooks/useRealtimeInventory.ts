import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';

import { Product } from '@/app/lib/types';

interface InventoryEvent {
    type: 'STOCK_UPDATE' | 'PRODUCT_UPDATE' | 'CONNECTED';
    payload?: {
        id: string;
        stock?: number;
        auditor?: string;
        timestamp?: string;
    };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRealtimeInventory() {
    // Initial data load with SWR (no polling)
    const { data: products, error, mutate, isValidating } = useSWR<Product[]>('/api/inventory', fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
        fallbackData: [],
        onSuccess: (data) => console.log(`📦 SWR: Loaded ${data.length} products`),
        onError: (err) => console.error('❌ SWR Error:', err),
    });

    useEffect(() => {
        if (isValidating) console.log('⏳ SWR: Revalidating data...');
    }, [isValidating]);

    const [isConnected, setIsConnected] = useState(false);

    // SSE connection for realtime updates
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            if (eventSource) eventSource.close();

            console.log('🔌 SSE: Attempting to connect...');
            eventSource = new EventSource('/api/inventory/subscribe');

            eventSource.onopen = () => {
                console.log('✅ SSE: Connected successfully');
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data: InventoryEvent = JSON.parse(event.data);
                    console.log(`📥 SSE Message received:`, data.type, data.payload || '');

                    if (data.type === 'STOCK_UPDATE' && data.payload) {
                        console.log(`📝 Local Mutation: Updating stock for SKU ${data.payload.id} to ${data.payload.stock}`);
                        mutate(current => {
                            if (!current) return [];
                            return current.map(p =>
                                p.id === data.payload!.id
                                    ? { ...p, stock: data.payload!.stock ?? p.stock }
                                    : p
                            );
                        }, false);
                    } else if (data.type === 'PRODUCT_UPDATE') {
                        console.log('🔄 Product Update detected: Triggering SWR refresh');
                        mutate();
                    } else if (data.type === 'CONNECTED') {
                        console.log('ℹ️ SSE Server Info:', data);
                    }
                } catch (err) {
                    console.error('❌ SSE Parse Error:', err);
                }
            };

            eventSource.onerror = (e) => {
                console.log('⚠️ SSE: Connection lost. Retrying in 3s...');
                setIsConnected(false);
                eventSource?.close();

                // Retry connection after a delay
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            console.log('🔌 SSE: Cleaning up connection');
            if (eventSource) eventSource.close();
            clearTimeout(reconnectTimeout);
        };
    }, [mutate]);

    const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
        console.log(`💾 Manual Update Triggered: SKU ${id}`, updates);
        mutate(current => {
            if (!current) return [];
            return current.map(p => p.id === id ? { ...p, ...updates } : p);
        }, false);
    }, [mutate]);

    // Monitor product state changes
    useEffect(() => {
        if (products && products.length > 0) {
            console.log(`📊 Hook State: Inventory set to ${products.length} products`);
        }
    }, [products?.length]);

    return {
        products: products || [],
        isLoading: !products && !error,
        error,
        isValidating,
        isConnected,
        updateProduct,
        refresh: () => {
            console.log('🔃 Manual Refresh: Forcing SWR revalidation');
            return mutate();
        },
    };
}
