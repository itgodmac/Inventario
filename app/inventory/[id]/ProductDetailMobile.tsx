'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ImageUpload from '@/app/components/ImageUpload';
import NumericKeypad from '@/app/components/NumericKeypad';
import { Product, Theme, useProductDetail } from '@/hooks/useProductDetail';
import { CloudinaryPresets } from '@/lib/cloudinary';
import { canEdit, canCount } from '@/lib/permissions';
import { useRealtimeInventory } from '@/app/hooks/useRealtimeInventory';

interface Props {
    product: Product;
    currentTheme: Theme;
}

export default function ProductDetailMobile(props: Props) {
    const { data: session } = useSession();
    const userCanEdit = canEdit(session);
    const userCanCount = canCount(session);
    const { product: initialProduct, currentTheme } = props;

    // Real-time hook for mobile
    const { products, updateProduct: mutateLocal } = useRealtimeInventory();
    const liveProduct = products.find(p => p.id === initialProduct.id) || initialProduct;

    const {
        activeTab, setActiveTab,
        isEditing, setIsEditing,
        isFavorite,
        formData, handleChange,
        handleSave: baseSave, handleDelete,
        stockLogs, logsLoading,
        physicalCount, handleCountChange,
        countStatus,
        inputRef,
        isUpdating, handleConfirmCount: baseConfirm
    } = useProductDetail(liveProduct);

    // Optimized handlers that use the real-time hook's local mutation
    const handleSave = async () => {
        await baseSave();
        mutateLocal(liveProduct.id, formData);
    };

    const handleConfirmCount = async () => {
        const count = parseInt(physicalCount);
        await baseConfirm();
        if (!isNaN(count)) {
            mutateLocal(liveProduct.id, { stock: count });
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white pb-24 font-sans selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
            {/* Apple Style Sticky Navigation Bar with Blur */}
            <div className="sticky top-14 z-40 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border-b border-border transition-colors duration-500 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Link href="/inventory" className="flex-shrink-0 flex items-center gap-1 text-primary hover:opacity-70 transition-opacity">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 18l-6-6 6-6" /></svg>
                            <span className="hidden sm:inline text-[17px] font-medium tracking-tight">Inventory</span>
                        </Link>
                        <span className="text-muted-foreground/30 text-[17px] hidden sm:inline">/</span>
                        <span className="text-[17px] font-semibold tracking-tight text-foreground truncate">
                            {isEditing ? 'Editing Product' : (liveProduct.nameEs || liveProduct.name)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {userCanEdit && (
                            <>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-[15px] font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => { setIsEditing(false); }}
                                            className="text-[15px] font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="text-[15px] font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Done
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#767680]/10 hover:bg-[#767680]/20 transition-colors text-[#007AFF]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Sheet */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/5 px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
                {['Update Quantity', 'Replenish', 'Print Labels'].map((action) => (
                    <button key={action} className="flex-shrink-0 bg-[#767680]/10 hover:bg-[#767680]/20 active:bg-[#767680]/30 transition-colors px-4 py-2 rounded-lg text-[13px] font-medium text-[#1C1C1E] whitespace-nowrap active:scale-95 duration-100">
                        {action}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto mt-4 md:mt-8 px-4 sm:px-6 pb-20">

                {/* Header Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Left: Product Info */}
                        <div className="md:col-span-3 flex flex-col justify-center">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">English Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className="w-full text-2xl font-bold border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Nombre Español</label>
                                        <input
                                            value={formData.nameEs || ''}
                                            onChange={(e) => handleChange('nameEs', e.target.value)}
                                            className="w-full text-2xl font-bold border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">SKU</label>
                                        <input
                                            value={formData.sku}
                                            onChange={(e) => handleChange('sku', e.target.value)}
                                            className="w-full text-lg text-gray-600 border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-2">
                                        {isFavorite && <span className="text-[#FF9500] text-lg">★</span>}
                                        <span className="text-[12px] md:text-[13px] font-semibold text-[#8E8E93] tracking-wide uppercase">Product</span>
                                    </div>
                                    <h1 className="text-[28px] md:text-[36px] font-bold text-foreground tracking-tight leading-tight mb-1">
                                        {liveProduct.nameEs || liveProduct.name || 'Unnamed Product'}
                                    </h1>
                                    {liveProduct.nameEn && liveProduct.nameEs && (
                                        <p className="text-[16px] md:text-[18px] text-[#8E8E93] mb-2 font-medium">{liveProduct.nameEn}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        <span className="text-[15px] font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">{liveProduct.sku}</span>
                                        {liveProduct.barcode && (
                                            <span className="text-[15px] font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">{liveProduct.barcode}</span>
                                        )}
                                        <div className="flex gap-2 ml-auto">
                                            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                                                <span className="text-[15px] font-semibold text-foreground">0</span>
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Sales</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                                                <span className="text-[15px] font-semibold text-[#34C759]">{liveProduct.stock}</span>
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Stock</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right: Image */}
                        <div className="flex flex-col justify-center">
                            {isEditing ? (
                                <ImageUpload
                                    onUpload={(url) => handleChange('image', url)}
                                    currentImage={formData.image}
                                    productId={liveProduct.sku || liveProduct.id}
                                />
                            ) : liveProduct.image ? (
                                <img
                                    src={CloudinaryPresets.medium(liveProduct.image || '')}
                                    alt={liveProduct.name}
                                    className="w-full aspect-square object-cover rounded-xl border border-gray-200 shadow-sm"
                                />
                            ) : (
                                <div className="w-full aspect-square bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* QUICK COUNT INTERFACE (Primary Action) - Only for users with count permission */}
                {userCanCount && (
                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-md border border-gray-200 dark:border-white/5 overflow-hidden mb-8 ring-4 ring-[#007AFF]/10">
                        <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-[#007AFF]/5 backdrop-blur-sm flex justify-between items-center">
                            <h3 className="text-[16px] font-bold text-[#007AFF] flex items-center gap-2">
                                Conteo Rápido / Cycle Count
                            </h3>
                            <span className="text-[12px] font-medium text-[#007AFF]/70 uppercase tracking-wider">Ready to Scan</span>
                        </div>
                        <div className="p-5 md:p-6">
                            <div className="grid grid-cols-2 gap-4 md:gap-8 items-center">
                                {/* System Stock Display */}
                                <div className="flex flex-col items-center p-4 rounded-2xl bg-secondary border border-border opacity-80">
                                    <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Teórico (System)</span>
                                    <span className="text-[32px] md:text-[40px] font-bold text-foreground">{liveProduct.stock}</span>
                                </div>

                                {/* Physical Input */}
                                <div className="flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-primary shadow-lg shadow-primary/10 relative w-full">
                                    <span className="text-[13px] font-bold text-primary uppercase tracking-wide mb-1">Físico (Real)</span>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        inputMode="numeric"
                                        value={physicalCount}
                                        onChange={(e) => handleCountChange(e.target.value)}
                                        // Make readOnly on Mobile to force numpad
                                        readOnly={true}
                                        onFocus={(e) => e.target.blur()}
                                        placeholder="0"
                                        className="w-full text-center text-[48px] font-bold text-foreground focus:outline-none placeholder-muted-foreground py-2 leading-none bg-transparent"
                                    />
                                    {countStatus === 'matching' && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#34C759] shadow-sm animate-pulse"></div>}
                                    {countStatus === 'discrepancy' && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#FF3B30] shadow-sm animate-pulse"></div>}
                                </div>
                            </div>

                            {/* Custom Numeric Keypad - ALWAYS ON FOR MOBILE VIEW */}
                            <div>
                                <NumericKeypad
                                    onKeyPress={(key) => handleCountChange(physicalCount + key)}
                                    onDelete={() => handleCountChange(physicalCount.slice(0, -1))}
                                    onClear={() => handleCountChange('')}
                                    onConfirm={handleConfirmCount}
                                    isConfirmDisabled={physicalCount === '' || isUpdating}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Segmented Control / Tabs */}
                <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
                    <div className="inline-flex bg-[#767680]/10 p-1 rounded-xl whitespace-nowrap">
                        {['General', 'Attributes', 'Sales', 'Purchase', 'Inventory'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-95 ${activeTab === tab.toLowerCase()
                                    ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                            {/* Basic Details */}
                            <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                                    <h3 className="text-[16px] font-semibold text-foreground">Basic details</h3>
                                </div>
                                <div className="divide-y divide-border px-5">
                                    <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                        <label className="text-[15px] text-foreground font-medium md:font-normal">Product Type</label>
                                        <div className="md:text-left text-muted-foreground text-[15px]">Storable Product</div>
                                    </div>
                                    <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                        <label className="text-[15px] text-foreground font-medium md:font-normal">Category</label>
                                        {isEditing ? (
                                            <input value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className="text-right border-b border-gray-200 outline-none focus:border-blue-500" />
                                        ) : (
                                            <div className="md:text-left text-[#1C1C1E] text-[15px]">{liveProduct.category}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                                    <h3 className="text-[16px] font-semibold text-foreground">Pricing & Codes</h3>
                                </div>
                                <div className="divide-y divide-border px-5">
                                    {/* Advanced Pricing Section */}
                                    <div className="py-3.5">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Pricing Logic</h4>
                                            {!isEditing && <span className="text-[10px] text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded">Auto-Calculated</span>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] text-[#8E8E93] mb-1">Competitor ($ Oth)</label>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={(formData as any).priceOth || ''}
                                                        onChange={(e) => handleChange('priceOth', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full text-right border border-yellow-200 bg-yellow-50 rounded px-2 py-1 outline-none focus:border-yellow-400 font-mono text-[#1C1C1E]"
                                                    />
                                                ) : (
                                                    <div className="text-right text-[14px] font-mono text-[#1C1C1E]">${(liveProduct.priceOth || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-[#8E8E93] mb-1">Factory ($ ZG)</label>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={(formData as any).priceZG || ''}
                                                        onChange={(e) => handleChange('priceZG', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full text-right border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-zinc-800 rounded px-2 py-1 outline-none focus:border-blue-400 font-mono text-gray-900 dark:text-white"
                                                    />
                                                ) : (
                                                    <div className="text-right text-[14px] font-mono text-[#1C1C1E]">${(liveProduct.priceZG || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                                            <label className="text-[14px] font-bold text-[#1C1C1E]">Final Price ($ Venta)</label>
                                            <div className="text-right text-[20px] text-[#007AFF] font-bold">
                                                ${liveProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 items-center gap-1 md:gap-4">
                                        <label className="text-[15px] text-[#1C1C1E] font-medium md:font-normal">Barcode</label>
                                        {isEditing ? (
                                            <input value={formData.barcode} onChange={(e) => handleChange('barcode', e.target.value)} className="md:col-span-2 text-right border-b border-gray-200 outline-none focus:border-blue-500 font-mono text-[#8E8E93]" />
                                        ) : (
                                            <div className="md:col-span-2 text-[15px] font-mono text-[#8E8E93] truncate text-right">{liveProduct.barcode || '-'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* STOCK HISTORY */}
                            <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                <div className="border-b border-gray-100 p-4">
                                    <h3 className="text-[15px] font-semibold text-[#1C1C1E]">Historial de Conteos</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {logsLoading ? (
                                        <div className="p-6 text-center text-[#8E8E93]">Cargando...</div>
                                    ) : stockLogs.length === 0 ? (
                                        <div className="p-6 text-center text-[#8E8E93]">No hay conteos registrados</div>
                                    ) : (
                                        stockLogs.map((log: any) => (
                                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${log.difference > 0 ? 'bg-green-500' : log.difference < 0 ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[14px] font-medium text-[#1C1C1E]">
                                                                    {log.oldQuantity} → {log.newQuantity}
                                                                </span>
                                                                <span className={`text-[13px] font-semibold ${log.difference > 0 ? 'text-green-600' : log.difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                    {log.difference > 0 ? '+' : ''}{log.difference}
                                                                </span>
                                                            </div>
                                                            <div className="text-[12px] text-[#8E8E93] mt-0.5">
                                                                {new Date(log.timestamp).toLocaleString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">
                                                            {log.auditor}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* DELETE BUTTON */}
                            {isEditing && (
                                <div className="col-span-1 md:col-span-2 flex justify-center pt-8">
                                    <button
                                        onClick={handleDelete}
                                        className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg font-medium border border-red-200 transition-colors"
                                    >
                                        Delete Product
                                    </button>
                                </div>
                            )}

                        </div>
                    )}
                    {activeTab !== 'general' && (
                        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-200 dark:border-white/5 text-center">
                            <p className="text-gray-500 dark:text-gray-400">View only mode active.</p>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}
