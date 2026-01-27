'use client';

import React, { useState, useRef, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useRealtimeInventory } from '@/app/hooks/useRealtimeInventory';
import { Product } from '@/app/lib/types';
import NumericKeypad from '@/app/components/NumericKeypad';
import Loading from './loading';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import ExportModal from '../components/ExportModal';
import InventoryHeader from '../components/InventoryHeader';
import GradualBlur from '@/app/components/GradualBlur';

const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });

const themes = {
    bigm: { primary: '#007AFF', secondary: '#8E8E93', name: 'Big Machines' },
    mca: { primary: '#1B3A57', secondary: '#9BA5AE', name: 'MCA Corporation' },
    default: { primary: '#1A73E8', secondary: '#5F6368', name: 'RIPODOO' }
};

export default function InventoryClient() {
    const { data: session } = useSession();
    const container = useRef(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Realtime Updates Hook
    const { products, isLoading, error, isConnected, refresh } = useRealtimeInventory();

    const [filteredProductsState, setFilteredProductsState] = useState<Product[]>([]);

    // Calculate unique categories dynamically from products
    const uniqueCategories = useMemo(() => {
        if (!products) return [];
        const categories = new Set(products.map(p => p.category).filter(Boolean));
        return Array.from(categories).sort();
    }, [products]);

    // UI state
    const [showScanner, setShowScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchVisible, setSearchVisible] = useState(false); // Mobile search toggle
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('stock-desc');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid' | 'compact' | 'excel'>('grid');
    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Mobile Product Detail Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [printCopies, setPrintCopies] = useState(1);

    // Sync selectedProduct with realtime updates
    useEffect(() => {
        if (selectedProduct && products) {
            const fresh = products.find(p => p.id === selectedProduct.id);
            if (fresh && fresh !== selectedProduct) {
                setSelectedProduct(fresh);
            }
        }
    }, [products, selectedProduct]);



    // Reset copies and tab when modal opens or product changes
    useEffect(() => {
        setPrintCopies(1);
        setModalTab('info');
        setPhysicalCount('');
        setCountStatus('idle');
    }, [selectedProduct, isModalOpen]);

    // Block body scroll when modal is open (mobile-friendly)
    useEffect(() => {
        if (isModalOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        // Cleanup
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isModalOpen]);

    // Quick Count State
    const [physicalCount, setPhysicalCount] = useState<string>('');
    const [countStatus, setCountStatus] = useState<'idle' | 'matching' | 'discrepancy'>('idle');
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalTab, setModalTab] = useState<'info' | 'count'>('info');

    // Pagination
    const currentPage = Number(searchParams.get('page')) || 1;
    const [itemsPerPage] = useState(30);

    // Removed manual useEffect fetch


    // Pagination Logic
    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()} `, { scroll: false });
    };

    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        // Check if we're on mobile
        const isMobile = window.innerWidth < 768;
        const params = new URLSearchParams(window.location.search);

        if (isMobile) {
            // On mobile, remove page parameter entirely
            if (params.has('page')) {
                params.delete('page');
                router.replace(`${pathname}${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
            }
        } else {
            // On desktop, reset to page 1 when filters change
            if (params.get('page') !== '1') {
                params.set('page', '1');
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }
    }, [searchQuery, categoryFilter, pathname, router]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(product => {
            const term = searchQuery.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(term) ||
                (product.nameEn?.toLowerCase().includes(term)) ||
                (product.sku?.toLowerCase().includes(term)) ||
                (product.barcode && product.barcode.toLowerCase().includes(term)) ||
                (product.photoId && product.photoId.toLowerCase().includes(term)) ||
                (product.category?.toLowerCase().includes(term));
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'stock-asc': return a.stock - b.stock;
                case 'stock-desc': return b.stock - a.stock;
                default: return 0;
            }
        });
    }, [products, searchQuery, categoryFilter, sortBy]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    // Get unique categories from products
    const categories = useMemo(() => {
        if (!products) return ['all'];
        const unique = Array.from(new Set(products.map(p => p.category)));
        return ['all', ...unique];
    }, [products]);

    const getStockColor = (status: string) => {
        switch (status) {
            case 'in-stock': return '#34C759';
            case 'low-stock': return '#FF9500';
            case 'out-of-stock': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    // Get stock badge style using Tailwind classes for Dark Mode support
    const getStockBadgeClass = (stock: number) => {
        if (stock === 0) {
            return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
        }
        if (stock <= 5) {
            return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
        }
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    };

    // Quick Count Handlers  
    const handleCountChange = (val: string) => {
        setPhysicalCount(val);
        if (!selectedProduct) return;

        const count = parseInt(val);
        if (isNaN(count)) {
            setCountStatus('idle');
            return;
        }
        if (count === selectedProduct.stock) {
            setCountStatus('matching');
        } else {
            setCountStatus('discrepancy');
        }
    };

    const handleConfirmCount = async () => {
        if (!physicalCount || !selectedProduct) return;
        setIsUpdating(true);

        const payload = {
            id: selectedProduct.id,
            quantity: parseInt(physicalCount),
            difference: parseInt(physicalCount) - selectedProduct.stock,
            auditor: 'MOBILE'
        };

        try {
            const response = await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                toast.success('Inventario actualizado');
                router.refresh();
                setPhysicalCount('');
                refresh(); // Force re-fetch of data
                // setIsModalOpen(false); // Keep open for continuous workflow
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        } catch (error: any) {
            toast.error(`Error al guardar: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemotePrint = async () => {
        if (!selectedProduct) return;
        const toastId = toast.loading('Enviando a impresiÃ³n...');
        try {
            const res = await fetch('/api/inventory/print-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: selectedProduct.id, copies: printCopies })
            });

            if (res.ok) {
                toast.success('Enviado a EstaciÃ³n de ImpresiÃ³n', { id: toastId });
            } else {
                toast.error('Error al enviar', { id: toastId });
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexiÃ³n', { id: toastId });
        }
    };

    const handleScanSuccess = useCallback(async (code: string) => {
        setShowScanner(false);
        // Products are local state now, instant lookup
        const product = (products || []).find(p =>
            (p.barcode && p.barcode === code) ||
            (p.sku && p.sku === code) ||
            (p.barcode && p.barcode.includes(code))
        );

        if (product) {
            setSelectedProduct(product);
            setIsModalOpen(true);
            toast.success('Producto encontrado');
        } else {
            toast.error(`Producto no encontrado: ${code}`);
        }
    }, [products]);

    // --- Barcode Scanner Keyboard Listener ---
    const bufferRef = useRef('');
    const lastKeyTimeRef = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + F for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setSearchVisible(true);
                // Focus the search input with a slight delay to ensure visibility
                setTimeout(() => {
                    const input = document.querySelector('input[placeholder*="Buscar"], input[placeholder*="Search"]') as HTMLInputElement;
                    input?.focus();
                    input?.select();
                }, 100);
                return;
            }

            // Existing scanner logic...
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const currentTime = Date.now();
            const char = e.key;

            if (currentTime - lastKeyTimeRef.current > 500) {
                bufferRef.current = '';
            }

            lastKeyTimeRef.current = currentTime;

            if (char === 'Enter' || char === 'Tab') {
                if (bufferRef.current.length > 2) {
                    e.preventDefault();
                    console.log('ðŸš€ Scanner Triggered:', bufferRef.current);
                    handleScanSuccess(bufferRef.current);
                    bufferRef.current = '';
                }
            } else if (char.length === 1) {
                bufferRef.current += char;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleScanSuccess]);

    return (
        <main ref={container} className="min-h-screen bg-background pb-24 font-sans selection:bg-primary/20 selection:text-primary">
            {/* MOBILE HEADER - Standard Sticky */}
            <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-zinc-950 transition-all">
                <div className="px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
                    {/* Title and Icon Buttons */}
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-[32px] font-semibold text-foreground">Inventario</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSearchVisible(!searchVisible)}
                                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                            >
                                {searchVisible ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                )}
                            </button>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2v16H3V4zm5 0h2v16H8V4zm5 0h2v16h-2V4zm5 0h3v16h-3V4z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Toggleable Search Bar */}
                    {searchVisible && (
                        <div className="mb-3 animate-in slide-in-from-top duration-200">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-zinc-800 rounded-full focus:outline-none text-foreground placeholder-muted-foreground text-[15px] shadow-sm border border-gray-100 dark:border-zinc-700"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        <svg className="w-5 h-5 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Category Filter Pills */}
                    <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-2 pb-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setCategoryFilter(category || 'all')}
                                    className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-all border border-transparent ${categoryFilter === category
                                        ? 'bg-white text-black shadow-sm'
                                        : 'bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/20'
                                        } `}
                                >
                                    {category === 'all' ? 'Todo' : category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            {/* DESKTOP HEADER - Material Design Component */}
            <InventoryHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onExportClick={() => setIsExportModalOpen(true)}
            />


            {/* ERROR STATE */}
            {error && (
                <div className="text-center py-10">
                    <p className="text-red-500 font-medium">No se pudo cargar el inventario.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white text-[#007AFF] rounded border shadow-sm">Reintentar</button>
                </div>
            )}

            {/* CONTENT */}
            {isLoading && !error ? <Loading /> : (
                <div className="md:max-w-[1400px] md:mx-auto md:px-4 sm:px-6 lg:px-8 md:mt-4 animate-in fade-in duration-500">
                    {/* Excel Sheet View */}
                    {viewMode === 'excel' && (
                        <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-[10px] shadow-xl border border-gray-200 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] relative custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[2500px]">
                                    <thead className="sticky top-0 z-30 bg-[#F2F2F7]/95 dark:bg-zinc-950/95 backdrop-blur shadow-sm">
                                        <tr className="divide-x divide-gray-200 dark:divide-white/10 uppercase font-mono cursor-pointer select-none">
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 sticky left-0 z-40 bg-zinc-100 dark:bg-zinc-900 border-b dark:border-white/10 w-16 text-center">ID</th>
                                            <th onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')} className="px-3 py-2 text-[10px] font-bold text-gray-500 sticky left-16 z-40 bg-zinc-100 dark:bg-zinc-900 border-b dark:border-white/10 min-w-[350px] hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">Nombre EspaÃ±ol</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">OEM (Item Code)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Barcode</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Nombre Eng</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">UVA Nombre</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Categoria</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Rot.</th>
                                            <th onClick={() => setSortBy(sortBy === 'stock-asc' ? 'stock-desc' : 'stock-asc')} className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">Stock</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Sts</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">$ ZG (Fab)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">$ Oth (Com)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">$ BM (Big)</th>
                                            <th onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')} className="px-3 py-2 text-[10px] font-bold text-white border-b border-blue-600 bg-blue-600 hover:bg-blue-700 transition-colors">PVP ($ Venta)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Dolar Ptj</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Pesos Ptj</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Rentab.</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 border-b dark:border-white/10 bg-zinc-50 dark:bg-white/5">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-zinc-900">
                                        {filteredProducts.map((p, idx) => (
                                            <tr
                                                key={p.id}
                                                className={`divide-x divide-gray-100 dark:divide-white/5 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-colors group text-[12px] leading-tight ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-[#FAFAFA] dark:bg-zinc-900/40'}`}
                                                onClick={() => router.push(`/inventory/${p.id}`)}
                                            >
                                                <td className="px-3 py-1 sticky left-0 z-20 bg-inherit font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-white/10 text-center w-16 italic">{p.photoId || '-'}</td>
                                                <td className="px-3 py-1 sticky left-16 z-20 bg-inherit font-medium text-gray-900 dark:text-zinc-100 border-r border-gray-200 dark:border-white/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[350px]" title={p.nameEs || p.name}>
                                                    {searchQuery ? (
                                                        <span dangerouslySetInnerHTML={{
                                                            __html: (p.nameEs || p.name).replace(new RegExp(`(${searchQuery})`, 'gi'), '<mark class="bg-yellow-200 dark:bg-yellow-600/50 rounded-sm">$1</mark>')
                                                        }} />
                                                    ) : (p.nameEs || p.name)}
                                                </td>
                                                <td className="px-3 py-1 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">{p.itemCode}</td>
                                                <td className="px-3 py-1 text-gray-500 dark:text-gray-400 font-mono tracking-tighter">{p.barcode}</td>
                                                <td className="px-3 py-1 text-gray-500 dark:text-gray-400 italic whitespace-nowrap truncate max-w-[200px]">{p.nameEn || '-'}</td>
                                                <td className="px-3 py-1 text-gray-600 dark:text-zinc-400 whitespace-nowrap">{p.uvaNombre || '-'}</td>
                                                <td className="px-3 py-1"><span className="px-1.5 py-0 rounded bg-gray-100 dark:bg-zinc-800 text-[10px] font-semibold border border-gray-200 dark:border-white/5 uppercase">{p.category}</span></td>
                                                <td className="px-3 py-1 text-center font-bold text-gray-600 dark:text-zinc-400">{p.rotacion || '-'}</td>
                                                <td className={`px-3 py-1 text-right font-bold ${p.stock <= 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{p.stock}</td>
                                                <td className="px-3 py-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStockColor(p.status) }}></div>
                                                        <span className="text-[10px] font-bold uppercase opacity-60">{p.status.split('-')[0]}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-1 text-right tabular-nums text-gray-500 bg-black/5 dark:bg-white/5 font-mono text-[11px]">
                                                    {p.priceZG ? `$${p.priceZG.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-1 text-right tabular-nums text-gray-500 bg-black/5 dark:bg-white/5 font-mono text-[11px]">
                                                    {p.priceOth ? `$${p.priceOth.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-1 text-right tabular-nums font-bold text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-900/10 font-mono">
                                                    {p.priceBM ? `$${p.priceBM.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-1 text-right tabular-nums font-black text-white bg-[#007AFF] shadow-inner font-mono text-[13px]">
                                                    ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-1 text-right tabular-nums text-gray-400 font-mono text-[11px]">
                                                    {p.ptijDll ? `$${p.ptijDll.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                                                </td>
                                                <td className="px-3 py-1 text-right tabular-nums text-gray-400 font-mono text-[11px]">
                                                    {p.ptijMxn ? `$${p.ptijMxn.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                                                </td>
                                                <td className={`px-3 py-1 text-center font-black ${p.vecesG > 1 ? 'text-green-600' : 'text-orange-500'}`}>
                                                    {p.vecesG ? p.vecesG.toFixed(2) : '0.00'}
                                                </td>
                                                <td className="px-3 py-1 text-gray-400 italic max-w-xs truncate text-[11px]" title={p.notes || ''}>{p.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <>
                            <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#F2F2F7]/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Product</th>
                                                <th className="text-left px-4 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</th>
                                                <th className="text-left px-4 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                                                <th className="text-right px-4 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock</th>
                                                <th className="text-right px-4 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</th>
                                                <th className="w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                            {paginatedProducts.map((product) => (
                                                <tr key={product.id} className="cursor-pointer hover:bg-[#F2F2F7]/50 dark:hover:bg-white/5 transition-colors group" onClick={() => router.push(`/inventory/${product.id}`)}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-[#F2F2F7] dark:bg-white/10 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-white/5">
                                                                {product.image ? (
                                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[14px] font-medium text-gray-900 dark:text-white">{product.nameEs || product.name}</div>
                                                                {product.nameEn && product.nameEs && (
                                                                    <div className="text-[12px] text-gray-500 dark:text-gray-400">{product.nameEn}</div>
                                                                )}
                                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">{product.sku}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium bg-[#767680]/10 dark:bg-white/10 text-gray-900 dark:text-white">{product.category}</span></td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium border border-gray-200 dark:border-white/10" style={{ backgroundColor: `${getStockColor(product.status)} 20`, color: getStockColor(product.status), borderColor: `${getStockColor(product.status)} 30` }}>
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStockColor(product.status) }}></span>
                                                            {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low Stock' : 'Out'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right"><span className="text-[14px] font-medium text-gray-900 dark:text-white">{product.stock}</span></td>
                                                    <td className="px-4 py-3 text-right"><span className="text-[14px] font-medium text-gray-900 dark:text-white">${product.price.toLocaleString()}</span></td>
                                                    <td className="px-2 py-3"><svg className="w-4 h-4 text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* MOBILE VIEW - Always shown on mobile, independent of viewMode */}
                    <div className="md:hidden relative">
                        <div className="bg-gray-100 dark:bg-zinc-950/50 rounded-xl p-2.5 mt-4 pb-20">
                            {(isLoading || !products || products.length === 0) && filteredProducts.length === 0 ? (
                                // Skeleton Loading State
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-zinc-900 rounded-lg p-2.5 flex items-center mb-2 last:mb-0 shadow-sm border border-transparent dark:border-white/10 animate-pulse"
                                    >
                                        {/* Image Skeleton */}
                                        <div className="w-20 h-20 rounded-[10px] bg-gray-200 dark:bg-zinc-800 mr-2.5 flex-shrink-0" />

                                        <div className="flex-1 min-w-0">
                                            {/* Title Skeleton */}
                                            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
                                            {/* Subtitle Skeleton */}
                                            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2 mb-2" />
                                            {/* Bottom Row Skeleton */}
                                            <div className="flex justify-between items-center">
                                                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
                                                <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded-xl w-20" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setIsModalOpen(true);
                                        }}
                                        className="bg-white dark:bg-zinc-900 rounded-lg p-2.5 flex items-center mb-2 last:mb-0 active:opacity-80 active:scale-[0.99] transition-all text-foreground shadow-sm border border-transparent dark:border-white/10"
                                    >
                                        <img
                                            src={product.image || 'https://placehold.co/80x80.png'}
                                            alt={product.name}
                                            className="w-20 h-20 rounded-[10px] object-cover mr-2.5"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-[5px]">
                                                <h3 className="text-[16px] font-semibold text-card-foreground flex-1 mr-2.5 line-clamp-2">
                                                    {product.nameEs || product.name}
                                                </h3>
                                                <span className="text-[16px] text-card-foreground">
                                                    ${product.price.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </span>
                                            </div>

                                            <p className="text-[14px] text-muted-foreground">
                                                {product.barcode || product.sku}
                                            </p>

                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[14px] text-muted-foreground">
                                                    {product.category || 'N/A'}
                                                </span>
                                                <div className="flex items-center">
                                                    <div
                                                        className={`px-3 h-6 rounded-xl flex items-center justify-center ${getStockBadgeClass(product.stock)}`}
                                                    >
                                                        <span className="text-[12px] font-medium">
                                                            Stock: {product.stock}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : null}
                        </div>

                    </div>

                    {viewMode === 'compact' && (
                        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                    className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 shadow-sm cursor-pointer hover:shadow-md transition-all group flex items-center gap-3 active:scale-[0.98] duration-100 border border-transparent dark:border-white/5"
                                >
                                    <div className="w-14 h-14 rounded-lg bg-[#F2F2F7] dark:bg-zinc-800 flex-shrink-0 overflow-hidden relative">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-tl-md flex items-center justify-center">
                                            <span className={`w - 1.5 h - 1.5 rounded - full block`} style={{ backgroundColor: getStockColor(product.status) }}></span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                        <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight truncate" title={product.nameEs || product.name}>{product.nameEs || product.name}</h3>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">{product.sku}</p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-[12px] font-bold text-gray-900 dark:text-white">${product.price.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Stock: {product.stock}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Grid View - Desktop Only */}
                    {viewMode === 'grid' && (
                        <div className="hidden md:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white dark:bg-zinc-900 rounded-[16px] p-2.5 md:p-3 shadow-sm border border-gray-200 dark:border-white/5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden flex flex-col active:scale-[0.98] duration-100"
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                >
                                    <div className="aspect-square rounded-xl bg-[#F2F2F7] dark:bg-zinc-800 mb-2.5 md:mb-3 overflow-hidden border border-gray-200 dark:border-white/5 relative">
                                        <img
                                            src={product.image || 'https://placehold.co/100x100?text=No+Image'}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`w - 2.5 h - 2.5 rounded - full block border border - white shadow - sm`} style={{ backgroundColor: getStockColor(product.status) }}></span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex-1 flex flex-col">
                                        <h3 className="text-[13px] md:text-[14px] font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 h-[2.5em]">{product.name}</h3>
                                        <p className="text-[11px] md:text-[12px] text-gray-500 dark:text-gray-400 font-medium font-mono truncate">{product.sku}</p>
                                        <div className="flex items-center justify-between pt-2 mt-auto">
                                            <span className="text-[14px] md:text-[15px] font-semibold text-gray-900 dark:text-white">${product.price.toLocaleString()}</span>
                                            <span className="px-1.5 py-0.5 bg-[#767680]/10 dark:bg-white/10 rounded text-[9px] md:text-[10px] font-semibold uppercase text-gray-900 dark:text-white truncate max-w-[60px] md:max-w-[80px]">{product.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && products && products.length > 0 && filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-[#E5E5EA] dark:bg-zinc-800 rounded-full mx-auto flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-[#8E8E93] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <h3 className="text-[20px] font-semibold text-gray-900 dark:text-white">No Results</h3>
                            <p className="text-[15px] text-gray-500 dark:text-gray-400">Try a different search term.</p>
                        </div>
                    )}

                    {/* Pagination Footer - Desktop Only */}
                    {filteredProducts.length > 0 && (
                        <div className="hidden md:flex px-6 py-6 mt-4 flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-white/5">
                            <div className="text-[13px] text-gray-500 dark:text-gray-400">
                                Showing <span className="font-medium text-gray-900 dark:text-white">{startIndex + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{filteredProducts.length}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updatePage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-[13px] font-medium text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                                >
                                    Previous
                                </button>
                                <div className="text-[13px] font-medium text-gray-900 dark:text-white tabular-nums">
                                    Page {currentPage} of {Math.max(1, totalPages)}
                                </div>
                                <button
                                    onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-[13px] font-medium text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Scanner Button (FAB) REMOVED as per user request */}
            <button
                onClick={() => setShowScanner(true)}
                className="hidden md:flex fixed bottom-8 right-8 bg-[#007AFF] text-white rounded-xl shadow-lg shadow-blue-500/30 items-center justify-center gap-2 px-6 py-3 hover:bg-[#0056b3] transition-all hover:scale-105 active:scale-95 z-50"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2v16H3V4zm5 0h2v16H8V4zm5 0h2v16h-2V4zm5 0h3v16h-3V4z" /></svg>
                <span className="font-semibold">Scan Barcode</span>
            </button>

            {/* Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onClose={() => setShowScanner(false)}
                    onScanSuccess={handleScanSuccess}
                />
            )}
            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />
            {/* Mobile Product Detail Modal */}
            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:hidden">
                    {/* Simple Black Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content - Clean & Minimal */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-[90%] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 z-10 w-8 h-8 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Product Image */}
                        <div className="relative mb-5">
                            <img
                                src={selectedProduct.image || 'https://placehold.co/400x400.png'}
                                alt={selectedProduct.name}
                                className="w-full aspect-square rounded-2xl mx-auto object-cover"
                            />
                            {/* Camera Button - Mobile Only */}
                            <button
                                onClick={() => document.getElementById('mobile-photo-input')?.click()}
                                className="absolute bottom-3 right-3 w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            {/* Hidden File Input */}
                            <input
                                id="mobile-photo-input"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={async (e) => {
                                    if (!e.target.files || !e.target.files[0]) return;

                                    const file = e.target.files[0];
                                    const toastId = toast.loading('Subiendo imagen...');

                                    try {
                                        // Upload image
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        formData.append('productId', selectedProduct.sku || selectedProduct.id.toString());

                                        const uploadRes = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData
                                        });

                                        const uploadData = await uploadRes.json();

                                        if (!uploadData.success) {
                                            throw new Error('Error al subir imagen');
                                        }

                                        // Update product with new image
                                        const updateRes = await fetch(`/api/inventory/${selectedProduct.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ image: uploadData.url })
                                        });

                                        if (!updateRes.ok) {
                                            throw new Error('Error al actualizar producto');
                                        }

                                        // Update local state
                                        setSelectedProduct({ ...selectedProduct, image: uploadData.url });
                                        refresh(); // Refresh the product list
                                        toast.success('Imagen actualizada', { id: toastId });
                                    } catch (error: any) {
                                        toast.error(error.message || 'Error al actualizar imagen', { id: toastId });
                                    }

                                    // Reset input
                                    e.target.value = '';
                                }}
                            />
                        </div>

                        {/* Header: Name and Price */}
                        <div className="mb-5">
                            <h2 className="text-[28px] font-bold text-gray-900 dark:text-white leading-tight">
                                {selectedProduct.nameEs || selectedProduct.name}
                            </h2>
                            {selectedProduct.nameEn && selectedProduct.nameEs && (
                                <p className="text-[16px] text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                                    {selectedProduct.nameEn}
                                </p>
                            )}
                            <div className="text-[26px] font-bold text-gray-900 dark:text-white mt-2">
                                ${selectedProduct.price.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {modalTab === 'info' ? (
                            <>
                                {/* Stock Card - Monochrome */}
                                <button
                                    onClick={() => setModalTab('count')}
                                    className="w-full bg-gray-900 dark:bg-white rounded-2xl p-5 mb-3 active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    {/* Tap Indicator */}
                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 dark:bg-black/20 text-white dark:text-black px-3 py-1.5 rounded-full text-[11px] font-semibold">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        <span>Contar</span>
                                    </div>

                                    <div className="flex items-center justify-between text-white dark:text-black">
                                        <div className="text-left flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <span className="text-[13px] font-semibold uppercase tracking-wider opacity-80">Stock Disponible</span>
                                            </div>
                                            <div className="text-[56px] font-bold leading-none tabular-nums mb-2">
                                                {selectedProduct.stock}
                                            </div>
                                            <div className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-white/20 dark:bg-black/20">
                                                {selectedProduct.stock === 0 ? 'Agotado' : selectedProduct.stock <= 5 ? 'Stock Bajo' : 'Disponible'}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Hint */}
                                <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 dark:text-gray-400 text-[13px]">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                    <span>Toca el stock para actualizar el conteo</span>
                                </div>

                                {/* Information List - Monochrome */}
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl overflow-hidden mb-4 border border-gray-200 dark:border-zinc-700">
                                    {/* SKU/OEM */}
                                    {selectedProduct.sku && (
                                        <>
                                            <div className="flex items-center justify-between px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[15px] text-gray-900 dark:text-white">OEM</span>
                                                </div>
                                                <span className="text-[15px] font-semibold text-gray-900 dark:text-white font-mono">
                                                    {selectedProduct.sku}
                                                </span>
                                            </div>
                                            <div className="h-px bg-gray-200 dark:bg-zinc-700 mx-4"></div>
                                        </>
                                    )}

                                    {/* Barcode */}
                                    {selectedProduct.barcode && (
                                        <>
                                            <div className="flex items-center justify-between px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2v16H3V4zm5 0h2v16H8V4zm5 0h2v16h-2V4zm5 0h3v16h-3V4z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[15px] text-gray-900 dark:text-white">CÃ³digo de Barras</span>
                                                </div>
                                                <span className="text-[15px] font-semibold text-gray-900 dark:text-white font-mono">
                                                    {selectedProduct.barcode}
                                                </span>
                                            </div>
                                            <div className="h-px bg-gray-200 dark:bg-zinc-700 mx-4"></div>
                                        </>
                                    )}

                                    {/* Category */}
                                    <div className="flex items-center justify-between px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                            <span className="text-[15px] text-gray-900 dark:text-white">CategorÃ­a</span>
                                        </div>
                                        <span className="text-[15px] font-semibold text-gray-900 dark:text-white">
                                            {selectedProduct.category || 'Sin categorÃ­a'}
                                        </span>
                                    </div>
                                </div>

                                {/* Print Action - Monochrome */}
                                <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 border border-gray-200 dark:border-zinc-700">
                                    <div className="flex items-center gap-3">
                                        {/* Copies Stepper */}
                                        <div className="flex items-center bg-white dark:bg-zinc-700 rounded-full overflow-hidden border border-gray-300 dark:border-zinc-600">
                                            <button
                                                onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                                                className="w-11 h-11 flex items-center justify-center text-gray-900 dark:text-white active:bg-gray-100 dark:active:bg-zinc-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <div className="w-10 flex justify-center text-[17px] font-bold text-gray-900 dark:text-white tabular-nums">
                                                {printCopies}
                                            </div>
                                            <button
                                                onClick={() => setPrintCopies(printCopies + 1)}
                                                className="w-11 h-11 flex items-center justify-center text-gray-900 dark:text-white active:bg-gray-100 dark:active:bg-zinc-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Print Button - Black */}
                                        <button
                                            onClick={handleRemotePrint}
                                            className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black h-11 rounded-full font-semibold text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Imprimir
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Back Button Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <button
                                        onClick={() => setModalTab('info')}
                                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span className="text-[15px] font-semibold">Volver</span>
                                    </button>
                                    <div className="flex-1 text-center">
                                        <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">Actualizar Stock</h3>
                                    </div>
                                    <div className="w-16"></div> {/* Spacer for centering */}
                                </div>

                                {/* Quick Count Interface */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* System Stock */}
                                        <div className="flex flex-col items-center p-4 rounded-xl bg-gray-100 dark:bg-zinc-800">
                                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sistema</span>
                                            <span className="text-[32px] font-bold text-gray-900 dark:text-white">{selectedProduct.stock}</span>
                                        </div>

                                        {/* Physical Count Input */}
                                        <div className="flex flex-col items-center p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-gray-900 dark:border-white relative">
                                            <span className="text-[11px] font-bold text-gray-900 dark:text-white uppercase mb-1">FÃ­sico</span>
                                            <div className="text-[32px] font-bold text-gray-900 dark:text-white leading-none">
                                                {physicalCount || '0'}
                                            </div>
                                            {countStatus === 'matching' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-900 dark:bg-white animate-pulse" />}
                                            {countStatus === 'discrepancy' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-900 dark:bg-white animate-pulse" />}
                                        </div>
                                    </div>

                                    {/* Numeric Keypad */}
                                    <NumericKeypad
                                        onKeyPress={(key) => handleCountChange(physicalCount + key)}
                                        onDelete={() => handleCountChange(physicalCount.slice(0, -1))}
                                        onClear={() => handleCountChange('')}
                                        onConfirm={handleConfirmCount}
                                        isConfirmDisabled={physicalCount === '' || isUpdating}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                initialFilters={{
                    category: categoryFilter,
                    sortBy: sortBy
                }}
                availableCategories={uniqueCategories}
            />
        </main>
    );
}
