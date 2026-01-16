
'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import PrintLabelBodega from '@/app/components/print/PrintLabelBodega';
import { Product } from '@/app/lib/types';

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PrintStationPage() {
    const [currentJob, setCurrentJob] = useState<{ id: string; productId: string } | null>(null);
    const [productData, setProductData] = useState<Product | null>(null);
    const [status, setStatus] = useState('Escuchando...');

    // Polling logic
    useEffect(() => {
        const interval = setInterval(async () => {
            // Only poll if we are not currently processing a job
            if (currentJob) return;

            try {
                const res = await fetch('/api/inventory/print-queue');
                const data = await res.json();

                if (data.job) {
                    setStatus(`Procesando trabajo: ${data.job.id}`);
                    setCurrentJob(data.job);

                    // Fetch product details
                    // We can reuse the main inventory API or a dedicated one. 
                    // For simplicity, let's assume we can fetch by ID from the main list or a specific endpoint.
                    // Actually, let's call the specific product API
                    const prodRes = await fetch(`/api/inventory/${data.job.productId}`);
                    const prodData = await prodRes.json();

                    if (prodData && prodData.product) {
                        setProductData(prodData.product);

                        // Wait a bit for render then print
                        setTimeout(() => {
                            window.print();
                            // Reset after print dialog closes (or assumes it did)
                            // In a real kiosk mode, print is instant. With dialog, user has to click.
                            // We'll reset state after a delay to allow next job.
                            setTimeout(() => {
                                setCurrentJob(null);
                                setProductData(null);
                                setStatus('Escuchando...');
                            }, 1000);
                        }, 500);
                    } else {
                        console.error("Product not found");
                        setCurrentJob(null); // Skip if failed
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [currentJob]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 print:bg-white print:block">

            {/* UI for the User running the station */}
            <div className="print:hidden p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Estación de Impresión Ripodoo</h1>
                <div className={`p-4 rounded-lg ${currentJob ? 'bg-green-100 text-green-800' : 'bg-white text-gray-500 shadow'}`}>
                    <div className="text-xl font-mono">{status}</div>
                    {currentJob && <div className="mt-2 text-sm">ID Ref: {currentJob.productId}</div>}
                </div>
                <p className="mt-8 text-gray-400 text-sm">Mantén esta pestaña abierta para recibir impresiones.</p>
            </div>

            {/* The Actual Label to Print - Only visible when we have data */}
            {productData && (
                <div className="hidden print:block absolute top-0 left-0">
                    <PrintLabelBodega product={productData} />
                </div>
            )}
        </div>
    );
}
