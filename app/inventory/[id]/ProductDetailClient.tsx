'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';

interface Product {
    id: string;
    name: string;
    nameEn: string;
    nameEs: string;
    sku: string;
    barcode: string;
    itemCode: string;
    category: string;
    stock: number;
    price: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    image: string;
    description: string;
}

interface Theme {
    primary: string;
    secondary: string;
    name: string;
}

export default function ProductDetailClient({ product, currentTheme }: { product: Product; currentTheme: Theme }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'sales' | 'purchase' | 'inventory' | 'accounting'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [isFavorite, setIsFavorite] = useState(true);

    // Inventory Count State
    const [physicalCount, setPhysicalCount] = useState<string>(''); // String to allow empty state
    const [countStatus, setCountStatus] = useState<'idle' | 'matching' | 'discrepancy'>('idle');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on load for rapid scanning/entry
    useEffect(() => {
        // Only if not editing general info
        if (!isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleCountChange = (val: string) => {
        setPhysicalCount(val);
        const count = parseInt(val);
        if (isNaN(count)) {
            setCountStatus('idle');
            return;
        }
        if (count === product.stock) {
            setCountStatus('matching');
        } else {
            setCountStatus('discrepancy');
        }
    };

    const getStockColor = (status: string) => {
        switch (status) {
            case 'in-stock': return '#34C759'; // Apple Green
            case 'low-stock': return '#FF9500'; // Apple Orange
            case 'out-of-stock': return '#FF3B30'; // Apple Red
            default: return '#8E8E93'; // Apple Gray
        }
    };

    const handleConfirmCount = async () => {
        if (!physicalCount) return;
        setIsUpdating(true);

        const payload = {
            id: product.id,
            quantity: parseInt(physicalCount),
            difference: parseInt(physicalCount) - product.stock,
            auditor: 'TEST'
        };

        console.log("🚀 [CLIENT] Starting Write-Back", payload);

        try {
            console.log("📡 [CLIENT] Sending POST to /api/inventory/update...");
            const response = await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log("📥 [CLIENT] Response Status:", response.status);
            const data = await response.json();
            console.log("📦 [CLIENT] Response Data:", data);

            if (data.warning) {
                console.warn("⚠️ [CLIENT] Warning:", data.warning);
                alert("⚠️ AVISO: El conteo se guardó en memoria pero NO en Excel.\n\nNecesitas configurar el Script de Google (ver instrucciones).");
                router.push('/inventory');
            } else if (response.ok && data.status === 'success') {
                console.log("✅ [CLIENT] Success!");
                alert("✅ Éxito: Inventario actualizado en Google Sheet.");
                router.push('/inventory');
            } else {
                console.error("❌ [CLIENT] Logical Error:", data);
                throw new Error(data.message || 'Error desconocido');
            }
        } catch (error: any) {
            console.error("🔥 [CLIENT] Exception:", error);
            alert(`❌ Error al guardar: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] pb-24 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Apple Style Sticky Navigation Bar with Blur */}
            <div className="sticky top-14 z-40 bg-white/75 backdrop-blur-xl border-b border-[#3C3C43]/10 transition-colors duration-500 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Link href="/inventory" className="flex-shrink-0 flex items-center gap-1 text-[#007AFF] hover:opacity-70 transition-opacity">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 18l-6-6 6-6" /></svg>
                            <span className="hidden sm:inline text-[17px] font-medium tracking-tight">Inventory</span>
                        </Link>
                        <span className="text-[#3C3C43]/30 text-[17px] hidden sm:inline">/</span>
                        <span className="text-[17px] font-semibold tracking-tight text-[#1C1C1E] truncate">{product.nameEs || product.name}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[15px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-[15px] font-medium text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-[15px] font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Done
                                </button>
                            </>
                        )}
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#767680]/10 hover:bg-[#767680]/20 transition-colors text-[#007AFF]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Sheet */}
            <div className="bg-white border-b border-[#3C3C43]/10 px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
                {['Update Quantity', 'Replenish', 'Print Labels'].map((action) => (
                    <button key={action} className="flex-shrink-0 bg-[#767680]/10 hover:bg-[#767680]/20 active:bg-[#767680]/30 transition-colors px-4 py-2 rounded-lg text-[13px] font-medium text-[#1C1C1E] whitespace-nowrap active:scale-95 duration-100">
                        {action}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto mt-4 md:mt-8 px-4 sm:px-6 pb-20">

                {/* Header Card */}
                <div className="bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 p-5 md:p-6 mb-6 relative overflow-hidden">
                    <div className="flex flex-col-reverse md:block">
                        <div className="md:pr-[200px] z-10 relative">
                            <div className="flex items-center gap-2 mb-1.5">
                                {isFavorite && <span className="text-[#FF9500] text-lg">★</span>}
                                <span className="text-[12px] md:text-[13px] font-semibold text-[#8E8E93] tracking-wide uppercase">Product</span>
                            </div>
                            <h1 className="text-[26px] md:text-[34px] font-bold text-[#1C1C1E] tracking-tight leading-tight mb-2">{product.nameEs || product.name || 'Unnamed Product'}</h1>
                            <h2 className="text-[17px] md:text-[20px] text-[#8E8E93] mb-4 md:mb-6">{product.sku}</h2>
                        </div>
                        {/* Stats - Standard View */}
                        <div className="flex md:absolute md:top-0 md:right-0 p-0 md:p-6 gap-3 mb-6 md:mb-0">
                            <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-[#F2F2F7] px-4 py-2.5 rounded-xl min-w-[80px]">
                                <span className="text-[17px] font-semibold text-[#1C1C1E]">0</span>
                                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wide">Sales</span>
                            </div>
                            <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-[#F2F2F7] px-4 py-2.5 rounded-xl min-w-[80px]">
                                <span className="text-[17px] font-semibold text-[#34C759]">{product.stock}</span>
                                <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wide">System</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QUICK COUNT INTERFACE (Primary Action) */}
                <div className="bg-white rounded-[20px] shadow-md border border-[#3C3C43]/5 overflow-hidden mb-8 ring-4 ring-[#007AFF]/10">
                    <div className="px-5 py-3 border-b border-[#3C3C43]/5 bg-[#007AFF]/5 backdrop-blur-sm flex justify-between items-center">
                        <h3 className="text-[16px] font-bold text-[#007AFF] flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            Conteo Rápido / Cycle Count
                        </h3>
                        <span className="text-[12px] font-medium text-[#007AFF]/70 uppercase tracking-wider">Ready to Scan</span>
                    </div>
                    <div className="p-5 md:p-6">
                        <div className="grid grid-cols-2 gap-4 md:gap-8 items-center">
                            {/* System Stock Display */}
                            <div className="flex flex-col items-center p-4 rounded-2xl bg-[#F2F2F7] border border-[#3C3C43]/5 opacity-60">
                                <span className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-1">Teórico (System)</span>
                                <span className="text-[32px] md:text-[40px] font-bold text-[#1C1C1E]">{product.stock}</span>
                            </div>

                            {/* Physical Input */}
                            <div className="flex flex-col items-center p-4 rounded-2xl bg-white border-2 border-[#007AFF] shadow-lg shadow-[#007AFF]/10 relative">
                                <span className="text-[13px] font-bold text-[#007AFF] uppercase tracking-wide mb-1">Físico (Real)</span>
                                <input
                                    ref={inputRef}
                                    type="number"
                                    value={physicalCount}
                                    onChange={(e) => handleCountChange(e.target.value)}
                                    placeholder="?"
                                    className="w-full text-center text-[32px] md:text-[40px] font-bold text-[#1C1C1E] focus:outline-none placeholder-[#C7C7CC] py-0 leading-none bg-transparent"
                                />
                                {/* Status Indicator Dot */}
                                {countStatus === 'matching' && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#34C759] shadow-sm animate-pulse"></div>}
                                {countStatus === 'discrepancy' && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#FF3B30] shadow-sm animate-pulse"></div>}
                            </div>
                        </div>

                        {/* Feedback & Action */}
                        <div className="mt-6">
                            {countStatus === 'discrepancy' && (
                                <div className="mb-4 p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span className="text-[14px] font-medium text-[#FF3B30]">Diferencia de {parseInt(physicalCount) - product.stock} unidades</span>
                                </div>
                            )}
                            {countStatus === 'matching' && (
                                <div className="mb-4 p-3 rounded-xl bg-[#34C759]/10 border border-[#34C759]/20 flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span className="text-[14px] font-medium text-[#34C759]">Stock coincide perfectamente</span>
                                </div>
                            )}

                            <button
                                onClick={handleConfirmCount}
                                disabled={physicalCount === ''}
                                className={`w-full py-3.5 rounded-xl font-bold text-[16px] shadow-sm transition-all active:scale-[0.98] ${physicalCount === ''
                                    ? 'bg-[#F2F2F7] text-[#C7C7CC] cursor-not-allowed'
                                    : 'bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-[#007AFF]/30'
                                    }`}
                            >
                                {isUpdating ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando...
                                    </>
                                ) : (
                                    'Confirmar Conteo / Confirm Count'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Segmented Control / Tabs */}
                <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
                    <div className="inline-flex bg-[#767680]/10 p-1 rounded-xl whitespace-nowrap">
                        {['General', 'Attributes', 'Sales', 'Purchase', 'Inventory'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-95 ${activeTab === tab.toLowerCase()
                                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grouped Inset Forms (Rest of content) */}
                <div className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Detailed form content same as before ... */}
                            <div className="bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
                                <div className="px-5 py-3 border-b border-[#3C3C43]/5 bg-[#F2F2F7]/50 backdrop-blur-sm">
                                    <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Basic details</h3>
                                </div>
                                <div className="divide-y divide-[#3C3C43]/5 px-5">
                                    <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                        <label className="text-[15px] text-[#1C1C1E] font-medium md:font-normal">Product Type</label>
                                        <div className="md:text-left text-[#8E8E93] text-[15px]">Storable Product</div>
                                    </div>
                                    <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                        <label className="text-[15px] text-[#1C1C1E] font-medium md:font-normal">Category</label>
                                        <div className="md:text-left text-[#1C1C1E] text-[15px]">{product.category}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
                                <div className="px-5 py-3 border-b border-[#3C3C43]/5 bg-[#F2F2F7]/50 backdrop-blur-sm">
                                    <h3 className="text-[16px] font-semibold text-[#1C1C1E]">Pricing & Codes</h3>
                                </div>
                                <div className="divide-y divide-[#3C3C43]/5 px-5">
                                    <div className="py-3.5 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Price</label>
                                        <div className="text-right text-[15px] text-[#007AFF] font-medium">${product.price.toLocaleString()}</div>
                                    </div>
                                    <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 items-center gap-1 md:gap-4">
                                        <label className="text-[15px] text-[#1C1C1E] font-medium md:font-normal">Barcode</label>
                                        <div className="md:col-span-2 text-[15px] font-mono text-[#8E8E93] truncate text-right">{product.barcode || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab !== 'general' && (
                        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-[20px] border border-[#3C3C43]/5 text-center">
                            <p className="text-[#8E8E93]">View only mode active.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
