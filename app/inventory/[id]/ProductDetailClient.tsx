'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../components/DashboardHeader';
import ImageUpload from '@/app/components/ImageUpload';
import NumericKeypad from '@/app/components/NumericKeypad';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    nameEn: string | null;
    nameEs: string | null;
    sku: string | null;
    barcode: string | null;
    itemCode: string | null;
    photoId: string | null;
    category: string | null;
    stock: number;
    price: number;
    // Pricing Inputs
    priceZG?: number;
    priceOth?: number;

    status: string; // Simplified to string to match Prisma
    image: string | null;
    description: string | null;
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

    // Form State
    const [formData, setFormData] = useState({
        name: product.name,
        nameEs: product.nameEs || '',
        sku: product.sku || '',
        itemCode: product.itemCode || '',
        photoId: product.photoId || '',
        barcode: product.barcode || '',
        price: product.price,
        category: product.category || '',
        stock: product.stock,
        status: product.status,
        priceZG: product.priceZG || 0,
        priceOth: product.priceOth || 0,
        image: product.image || ''
    });

    // Sync form with product prop updates (e.g. from background refresh)
    useEffect(() => {
        if (!isEditing) {
            setFormData({
                name: product.name,
                nameEs: product.nameEs || '',
                sku: product.sku || '',
                itemCode: product.itemCode || '',
                photoId: product.photoId || '',
                barcode: product.barcode || '',
                price: product.price,
                category: product.category || '',
                stock: product.stock,
                status: product.status,
                priceZG: product.priceZG || 0,
                priceOth: product.priceOth || 0,
                image: product.image || ''
            });
        }
    }, [product, isEditing]);

    // Stock Logs State
    const [stockLogs, setStockLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Fetch stock logs
    useEffect(() => {
        const fetchLogs = async () => {
            setLogsLoading(true);
            try {
                const res = await fetch(`/api/inventory/${product.id}/logs`);
                const data = await res.json();
                setStockLogs(data.logs || []);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLogsLoading(false);
            }
        };
        fetchLogs();
    }, [product.id]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/inventory/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Producto actualizado correctamente');
            setIsEditing(false);
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/inventory/${product.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Producto eliminado');
            router.push('/inventory');
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Inventory Count State
    const [physicalCount, setPhysicalCount] = useState<string>(''); // String to allow empty state
    const [countStatus, setCountStatus] = useState<'idle' | 'matching' | 'discrepancy'>('idle');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Focus input on load for rapid scanning/entry
    useEffect(() => {
        if (!isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                console.log("✅ [CLIENT] Success!");
                toast.success('Inventario actualizado');
                router.refresh(); // Refresh server data
                setPhysicalCount(''); // Clear input

                // Refresh logs
                const res = await fetch(`/api/inventory/${product.id}/logs`);
                const logsData = await res.json();
                setStockLogs(logsData.logs || []);
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        } catch (error: any) {
            console.error("🔥 [CLIENT] Exception:", error);
            toast.error(`Error al guardar: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-primary/20 selection:text-primary">
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
                            {isEditing ? 'Editing Product' : (product.nameEs || product.name)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
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
                                    onClick={() => { setIsEditing(false); setFormData({ ...product } as any); }} // Reset
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
                        <div className="hidden md:flex items-center gap-2 mr-2">
                            {['Update Quantity', 'Replenish', 'Print Labels'].map((action) => (
                                <button key={action} className="text-[13px] font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                                    {action}
                                </button>
                            ))}
                        </div>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#767680]/10 hover:bg-[#767680]/20 transition-colors text-[#007AFF]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Sheet - Mobile Only */}
            <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/5 px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">ID (Col A)</label>
                                            <input
                                                value={formData.photoId}
                                                onChange={(e) => handleChange('photoId', e.target.value)}
                                                className="w-full text-lg font-mono text-blue-600 border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">OEM (Item Code)</label>
                                            <input
                                                value={formData.itemCode}
                                                onChange={(e) => handleChange('itemCode', e.target.value)}
                                                className="w-full text-lg text-gray-600 border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                            />
                                        </div>
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
                                        {product.nameEs || product.name || 'Unnamed Product'}
                                    </h1>
                                    {product.nameEn && product.nameEs && (
                                        <p className="text-[16px] md:text-[18px] text-[#8E8E93] mb-2 font-medium">{product.nameEn}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-blue-500 uppercase ml-1">ID</span>
                                            <span className="text-[15px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">{product.photoId || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">SKU</span>
                                            <span className="text-[15px] font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">{product.sku}</span>
                                        </div>
                                        {product.barcode && (
                                            <span className="text-[15px] font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">{product.barcode}</span>
                                        )}
                                        <div className="flex gap-2 ml-auto">
                                            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                                                <span className="text-[15px] font-semibold text-foreground">0</span>
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Sales</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
                                                <span className="text-[15px] font-semibold text-[#34C759]">{product.stock}</span>
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
                                    productId={product.sku || product.id}
                                />
                            ) : product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT COLUMN: TABS AND CONTENT */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        {/* Segmented Control / Tabs */}



                        {/* Segmented Control / Tabs */}
                        {/* Mobile: Horizontal Scroll Pills */}
                        <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar">
                            <div className="inline-flex bg-[#767680]/10 p-1 rounded-xl whitespace-nowrap">
                                {['General', 'Attributes', 'Sales', 'Purchase', 'Inventory'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                        className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-95 ${activeTab === tab.toLowerCase()
                                            ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop: Standard Tabs */}
                        <div className="hidden md:flex border-b border-gray-200 dark:border-white/5 mb-8">
                            {['General', 'Attributes', 'Sales', 'Purchase', 'Inventory'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab.toLowerCase() as any)}
                                    className={`px-6 py-3 text-[14px] font-medium border-b-2 transition-all duration-200 ${activeTab === tab.toLowerCase()
                                        ? 'border-[#007AFF] text-[#007AFF]'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Grouped Inset Forms (Rest of content) */}
                        <div className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
                            {activeTab === 'general' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Detailed form content same as before ... */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                        <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                                            <h3 className="text-[16px] font-semibold text-foreground">Basic details</h3>
                                        </div>
                                        <div className="divide-y divide-gray-200 dark:divide-white/5 px-5">
                                            <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                                <label className="text-[15px] text-foreground font-medium md:font-normal">Product Type</label>
                                                <div className="md:text-left text-muted-foreground text-[15px]">Storable Product</div>
                                            </div>
                                            <div className="py-3.5 grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                                <label className="text-[15px] text-foreground font-medium md:font-normal">Category</label>
                                                {isEditing ? (
                                                    <input value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className="text-right bg-transparent dark:text-white border-b border-gray-200 dark:border-white/10 outline-none focus:border-blue-500" />
                                                ) : (
                                                    <div className="md:text-left text-foreground text-[15px]">{product.category}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                        <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                                            <h3 className="text-[16px] font-semibold text-foreground">Pricing & Codes</h3>
                                        </div>
                                        <div className="divide-y divide-gray-200 dark:divide-white/5 px-5">
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
                                                                className="w-full text-right border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10 rounded px-2 py-1 outline-none focus:border-yellow-400 font-mono text-gray-900 dark:text-yellow-100"
                                                            />
                                                        ) : (
                                                            <div className="text-right text-[14px] font-mono text-gray-900 dark:text-white">${(product.priceOth || 0).toLocaleString()}</div>
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
                                                                className="w-full text-right border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800 rounded px-2 py-1 outline-none focus:border-blue-400 font-mono text-gray-900 dark:text-white"
                                                            />
                                                        ) : (
                                                            <div className="text-right text-[14px] font-mono text-gray-900 dark:text-white">${(product.priceZG || 0).toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-white/10 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg">
                                                    <label className="text-[14px] font-bold text-gray-900 dark:text-white">Final Price ($ Venta)</label>
                                                    <div className="text-right text-[20px] text-[#007AFF] font-bold">
                                                        ${product.price.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="py-3.5 grid grid-cols-1 md:grid-cols-3 items-center gap-1 md:gap-4">
                                                <label className="text-[15px] text-gray-900 dark:text-white font-medium md:font-normal">Barcode</label>
                                                {isEditing ? (
                                                    <input value={formData.barcode} onChange={(e) => handleChange('barcode', e.target.value)} className="md:col-span-2 text-right bg-transparent dark:text-white border-b border-gray-200 dark:border-white/10 outline-none focus:border-blue-500 font-mono text-[#8E8E93]" />
                                                ) : (
                                                    <div className="md:col-span-2 text-[15px] font-mono text-[#8E8E93] truncate text-right">{product.barcode || '-'}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* STOCK HISTORY */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                        <div className="border-b border-gray-200 dark:border-white/5 p-4">
                                            <h3 className="text-[15px] font-semibold text-[#1C1C1E] dark:text-white">Historial de Conteos</h3>
                                        </div>
                                        <div className="divide-y divide-gray-200 dark:divide-white/5">
                                            {logsLoading ? (
                                                <div className="p-6 text-center text-[#8E8E93]">Cargando...</div>
                                            ) : stockLogs.length === 0 ? (
                                                <div className="p-6 text-center text-[#8E8E93]">No hay conteos registrados</div>
                                            ) : (
                                                stockLogs.map((log: any) => (
                                                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${log.difference > 0 ? 'bg-green-500' : log.difference < 0 ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[14px] font-medium text-[#1C1C1E] dark:text-white">
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
                                    <p className="text-[#8E8E93]">View only mode active.</p>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* RIGHT COLUMN: QUICK COUNT & WIDGETS */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        {/* QUICK COUNT INTERFACE (Moved here) */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[20px] shadow-md border border-gray-200 dark:border-white/5 overflow-hidden mb-6 ring-4 ring-primary/10 sticky top-24">
                            <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 bg-primary/5 backdrop-blur-sm flex justify-between items-center">
                                <h3 className="text-[14px] font-bold text-[#007AFF] flex items-center gap-2">
                                    Quick Count
                                </h3>
                                <span className="text-[10px] font-medium text-[#007AFF]/70 uppercase tracking-wider">Ready</span>
                            </div>
                            <div className="p-4">
                                {/* System Stock Display */}
                                <div className="flex justify-between items-center mb-4 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-white/5">
                                    <span className="text-[12px] font-medium text-muted-foreground uppercase">System</span>
                                    <span className="text-[20px] font-bold text-foreground">{product.stock}</span>
                                </div>

                                {/* Physical Input */}
                                <div className="relative w-full mb-4">
                                    <span className="absolute -top-2.5 left-3 bg-white dark:bg-zinc-900 px-1 text-[11px] font-bold text-primary uppercase">Physical</span>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        inputMode="numeric"
                                        value={physicalCount}
                                        onChange={(e) => handleCountChange(e.target.value)}
                                        readOnly={isMobile}
                                        onFocus={(e) => { if (isMobile) e.target.blur(); }}
                                        placeholder="0"
                                        className="w-full text-center text-[32px] font-bold text-foreground border-2 border-primary rounded-xl py-3 focus:outline-none focus:ring-4 focus:ring-primary/10 bg-transparent"
                                    />
                                    {countStatus === 'matching' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#34C759] shadow-sm animate-pulse"></div>}
                                    {countStatus === 'discrepancy' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#FF3B30] shadow-sm animate-pulse"></div>}
                                </div>

                                {/* Custom Numeric Keypad - HIDDEN ON DESKTOP */}
                                <div className="md:hidden">
                                    <NumericKeypad
                                        onKeyPress={(key) => handleCountChange(physicalCount + key)}
                                        onDelete={() => handleCountChange(physicalCount.slice(0, -1))}
                                        onClear={() => handleCountChange('')}
                                        onConfirm={handleConfirmCount}
                                        isConfirmDisabled={physicalCount === '' || isUpdating}
                                    />
                                </div>

                                {/* Desktop Confirm Button */}
                                <div className="hidden md:block">
                                    <button
                                        onClick={handleConfirmCount}
                                        disabled={physicalCount === ''}
                                        className={`w-full py-2.5 rounded-xl font-bold text-[14px] shadow-sm transition-all active:scale-[0.98] ${physicalCount === ''
                                            ? 'bg-[#F2F2F7] text-[#C7C7CC] cursor-not-allowed'
                                            : 'bg-[#007AFF] text-white hover:bg-[#007AFF]/90 shadow-[#007AFF]/30'
                                            }`}
                                    >
                                        {isUpdating ? 'Saving...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main >
    );
}
