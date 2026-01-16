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

export function useRealtimeInventory() {
    const fetcher = (url: string) => fetch(url).then((r) => r.json());

    // Initial data load with SWR (no polling)
    const { data: initialProducts, error, mutate } = useSWR<Product[]>('/api/inventory', fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 0, // Disable polling
        fallbackData: [],
    });

    const [products, setProducts] = useState<Product[]>(initialProducts || []);
    const [isConnected, setIsConnected] = useState(false);

    // Sync initial data
    useEffect(() => {
        if (initialProducts) {
            setProducts(initialProducts);
        }
    }, [initialProducts]);

    // SSE connection for realtime updates
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimer: NodeJS.Timeout;

        const connect = () => {
            eventSource = new EventSource('/api/inventory/subscribe');

            eventSource.onopen = () => {
                console.log('✅ SSE Connected');
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data: InventoryEvent = JSON.parse(event.data);

                    if (data.type === 'STOCK_UPDATE' && data.payload) {
                        // Update specific product stock
                        setProducts(prev =>
                            prev.map(p =>
                                p.id === data.payload!.id
                                    ? { ...p, stock: data.payload!.stock || p.stock }
                                    : p
                            )
                        );
                    } else if (data.type === 'PRODUCT_UPDATE') {
                        // Full refresh on product changes
                        mutate();
                    }
                } catch (err) {
                    console.error('Failed to parse SSE message:', err);
                }
            };

            eventSource.onerror = () => {
                console.log('❌ SSE Disconnected, reconnecting...');
                setIsConnected(false);
                eventSource?.close();

                // Reconnect after 3s
                reconnectTimer = setTimeout(() => {
                    connect();
                }, 3000);
            };
        };

        // Start connection
        connect();

        // Cleanup
        return () => {
            eventSource?.close();
            clearTimeout(reconnectTimer);
        };
    }, [mutate]);

    const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
        setProducts(prev =>
            prev.map(p => p.id === id ? { ...p, ...updates } : p)
        );
    }, []);

    return {
        products,
        isLoading: !initialProducts && !error,
        error,
        isConnected,
        updateProduct,
        refresh: mutate,
    };
}
