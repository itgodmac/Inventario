'use client';

import { useState } from 'react';
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

    const getStockColor = (status: string) => {
        switch (status) {
            case 'in-stock': return '#34C759'; // Apple Green
            case 'low-stock': return '#FF9500'; // Apple Orange
            case 'out-of-stock': return '#FF3B30'; // Apple Red
            default: return '#8E8E93'; // Apple Gray
        }
    };

    return (
        <main className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
            <DashboardHeader appName="Inventory" />

            {/* Apple Style Sticky Navigation Bar with Blur */}
            <div className="sticky top-14 z-40 bg-white/75 backdrop-blur-xl border-b border-[#3C3C43]/10 transition-colors duration-500 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/inventory" className="flex items-center gap-1 text-[#007AFF] hover:opacity-70 transition-opacity">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 18l-6-6 6-6" /></svg>
                            <span className="text-[17px] font-medium tracking-tight">Inventory</span>
                        </Link>
                        <span className="text-[#3C3C43]/30 text-[17px]">/</span>
                        <span className="text-[17px] font-semibold tracking-tight text-[#1C1C1E] truncate max-w-[200px]">{product.nameEs || product.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
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

            {/* Action Sheet / Toolbar */}
            <div className="bg-white border-b border-[#3C3C43]/10 px-4 py-3 flex gap-4 overflow-x-auto">
                {['Update Quantity', 'Replenish', 'Print Labels'].map((action) => (
                    <button key={action} className="flex-shrink-0 bg-[#767680]/10 hover:bg-[#767680]/20 active:bg-[#767680]/30 transition-colors px-4 py-1.5 rounded-lg text-[13px] font-medium text-[#1C1C1E]">
                        {action}
                    </button>
                ))}
            </div>

            {/* Main Content Area - iOS Grouped Inset Style */}
            <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">

                {/* Header Card */}
                <div className="bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 p-6 mb-8 relative overflow-visible">
                    {/* Smart Stat Buttons - iOS Widgets Style */}
                    <div className="absolute top-0 right-0 p-6 flex gap-3">
                        <div className="flex flex-col items-center bg-[#F2F2F7] px-4 py-2 rounded-xl min-w-[80px]">
                            <span className="text-[17px] font-semibold text-[#1C1C1E]">0</span>
                            <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wide">Sales</span>
                        </div>
                        <div className="flex flex-col items-center bg-[#F2F2F7] px-4 py-2 rounded-xl min-w-[80px]">
                            <span className="text-[17px] font-semibold text-[#34C759]">{product.stock}</span>
                            <span className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wide">On Hand</span>
                        </div>
                    </div>

                    <div className="pr-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                            {isFavorite && <span className="text-[#FF9500] text-lg">★</span>}
                            <span className="text-[13px] font-semibold text-[#8E8E93] tracking-wide uppercase">Product</span>
                        </div>
                        <h1 className="text-[34px] font-bold text-[#1C1C1E] tracking-tight leading-tight mb-2">{product.nameEs || product.name}</h1>
                        <h2 className="text-[20px] text-[#8E8E93] mb-4">{product.nameEn}</h2>

                        <div className="flex flex-wrap gap-4 mb-2">
                            {['Can be sold', 'Can be purchased'].map((label) => (
                                <label key={label} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${true ? 'bg-[#007AFF] border-[#007AFF]' : 'border-[#C7C7CC] bg-white'}`}>
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-[15px] text-[#1C1C1E] group-hover:text-[#007AFF] transition-colors">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Floating Product Image */}
                    {product.image && (
                        <div className="absolute top-24 right-6 w-32 h-32 bg-white rounded-2xl shadow-lg border border-[#3C3C43]/5 p-2 rotate-2 hover:rotate-0 transition-all duration-500 ease-out z-10">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                </div>

                {/* Segmented Control / Tabs */}
                <div className="mb-6 overflow-x-auto pb-2">
                    <div className="inline-flex bg-[#767680]/10 p-1 rounded-xl">
                        {['General', 'Attributes', 'Sales', 'Purchase', 'Inventory'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-300 ${activeTab === tab.toLowerCase()
                                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grouped Inset Forms */}
                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Group */}
                            <div className="bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#3C3C43]/5 bg-[#F2F2F7]/50 backdrop-blur-sm">
                                    <h3 className="text-[17px] font-semibold text-[#1C1C1E]">Basic details</h3>
                                </div>
                                <div className="divide-y divide-[#3C3C43]/5 px-5">
                                    <div className="py-3 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Product Type</label>
                                        <select disabled={!isEditing} className="appearance-none bg-transparent text-[15px] text-[#8E8E93] text-right focus:outline-none disabled:opacity-100">
                                            <option>Storable Product</option>
                                        </select>
                                    </div>
                                    <div className="py-3 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Invoicing Policy</label>
                                        <select disabled={!isEditing} className="appearance-none bg-transparent text-[15px] text-[#8E8E93] text-right focus:outline-none">
                                            <option>Ordered quantities</option>
                                        </select>
                                    </div>
                                    <div className="py-3 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Unit of Measure</label>
                                        <div className="text-right text-[15px] text-[#8E8E93]">Units</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Group */}
                            <div className="bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#3C3C43]/5 bg-[#F2F2F7]/50 backdrop-blur-sm">
                                    <h3 className="text-[17px] font-semibold text-[#1C1C1E]">Pricing</h3>
                                </div>
                                <div className="divide-y divide-[#3C3C43]/5 px-5">
                                    <div className="py-3 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Sales Price</label>
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-[#8E8E93] text-[15px]">$</span>
                                            <input
                                                type="number"
                                                defaultValue={product.price}
                                                disabled={!isEditing}
                                                className="text-right text-[15px] text-[#007AFF] font-medium bg-transparent border-none p-0 focus:ring-0 w-24"
                                            />
                                        </div>
                                    </div>
                                    <div className="py-3 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Customer Taxes</label>
                                        <div className="flex justify-end">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-[#AF52DE]/10 text-[#AF52DE]">
                                                16% IVA
                                            </span>
                                        </div>
                                    </div>
                                    <div className="py-3 grid grid-cols-2 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Cost</label>
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-[#8E8E93] text-[15px]">$</span>
                                            <input
                                                type="number"
                                                defaultValue={0.00}
                                                disabled={!isEditing}
                                                className="text-right text-[15px] text-[#1C1C1E] bg-transparent border-none p-0 focus:ring-0 w-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Group for Codes */}
                            <div className="md:col-span-2 bg-white rounded-[20px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
                                <div className="divide-y divide-[#3C3C43]/5 px-5">
                                    <div className="py-3 grid grid-cols-3 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Internal Reference</label>
                                        <div className="col-span-2 text-[15px] font-mono text-[#8E8E93]">{product.itemCode || '-'}</div>
                                    </div>
                                    <div className="py-3 grid grid-cols-3 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Barcode</label>
                                        <div className="col-span-2 text-[15px] font-mono text-[#8E8E93]">{product.barcode || '-'}</div>
                                    </div>
                                    <div className="py-3 grid grid-cols-3 items-center gap-4">
                                        <label className="text-[15px] text-[#1C1C1E]">Category</label>
                                        <div className="col-span-2 text-[15px] text-[#1C1C1E]">{product.category}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'general' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[20px] border border-[#3C3C43]/5 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#F2F2F7] flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <h3 className="text-[17px] font-semibold text-[#1C1C1E]">No content yet</h3>
                            <p className="text-[15px] text-[#8E8E93] mt-1 max-w-xs">This section is currently under development for the Apple Design System update.</p>
                        </div>
                    )}
                </div>

                {/* Footer Brand */}
                <div className="mt-12 mb-8 text-center text-[#8E8E93]">
                    <p className="text-[13px] font-medium uppercase tracking-wider">Big Machines de Mexico S de R.L. de C.V.</p>
                </div>
            </div>
        </main>
    );
}
