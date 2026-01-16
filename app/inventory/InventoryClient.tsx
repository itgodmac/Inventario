'use client';

import React, { useState, useRef, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import useSWR from 'swr';
import { useRealtimeInventory } from '@/app/hooks/useRealtimeInventory';
import { Product } from '@/app/lib/types';
import NumericKeypad from '@/app/components/NumericKeypad';
import Loading from './loading';
import toast from 'react-hot-toast';
import ExportModal from '../components/ExportModal';
import GradualBlur from '@/app/components/GradualBlur';

const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false });

const themes = {
    bigm: { primary: '#007AFF', secondary: '#8E8E93', name: 'Big Machines' },
    mca: { primary: '#1B3A57', secondary: '#9BA5AE', name: 'MCA Corporation' },
    default: { primary: '#1A73E8', secondary: '#5F6368', name: 'RIPODOO' }
};

export default function InventoryClient() {
    const container = useRef(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Realtime Updates Hook
    const { products, isLoading, error, isConnected, refresh } = useRealtimeInventory();

    const [filteredProductsState, setFilteredProductsState] = useState<Product[]>([]);

    // UI state
    const [showScanner, setShowScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchVisible, setSearchVisible] = useState(false); // Mobile search toggle
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('stock-desc');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid' | 'compact'>('grid');
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

    // Reset copies when modal opens or product changes
    useEffect(() => {
        setPrintCopies(1);
    }, [selectedProduct, isModalOpen]);

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
        const params = new URLSearchParams(window.location.search);
        if (params.get('page') !== '1') {
            params.set('page', '1');
            router.replace(`${pathname}?${params.toString()} `, { scroll: false });
        }
    }, [searchQuery, categoryFilter, pathname, router]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(product => {
            const term = searchQuery.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(term) ||
                (product.nameEn?.toLowerCase().includes(term)) ||
                (product.nameEs?.toLowerCase().includes(term)) ||
                (product.sku?.toLowerCase().includes(term)) ||
                (product.barcode && product.barcode.toLowerCase().includes(term)) ||
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
        const toastId = toast.loading('Enviando a impresión...');
        try {
            const res = await fetch('/api/inventory/print-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: selectedProduct.id, copies: printCopies })
            });

            if (res.ok) {
                toast.success('Enviado a Estación de Impresión', { id: toastId });
            } else {
                toast.error('Error al enviar', { id: toastId });
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión', { id: toastId });
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
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            const currentTime = Date.now();
            const char = e.key;

            // Scanner inputs are very fast, but 100ms might be too tight for some systems/scanners.
            // Increased to 500ms to be safe.
            if (currentTime - lastKeyTime > 500) {
                buffer = '';
            }

            lastKeyTime = currentTime;

            // Debug log to see what the scanner is sending
            console.log(`Key: ${char}, Buffer: ${buffer} `);

            if (char === 'Enter' || char === 'Tab') {
                if (buffer.length > 2) {
                    e.preventDefault(); // Prevent default browser action for Enter/Tab
                    console.log('🚀 Scanner Triggered:', buffer);
                    handleScanSuccess(buffer);
                    buffer = '';
                }
            } else if (char.length === 1) {
                // Determine if it's a printable character
                buffer += char;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleScanSuccess]); // Depend on the stable callback

    return (
        <main ref={container} className="min-h-screen bg-background pb-24 font-sans selection:bg-primary/20 selection:text-primary">
            {/* MOBILE HEADER - Odoo Style - Sticky */}
            <div className="md:hidden sticky top-0 z-50">
                <GradualBlur
                    className="absolute top-0 left-0 right-0 pointer-events-none"
                    position="top"
                    height="160px"
                    strength={2}
                    opacity={1}
                    zIndex={-1}
                />
                <div className="px-4 pt-4 pb-3 relative z-10">
                    {/* Title and Icon Buttons */}
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-[32px] font-semibold text-foreground">Inventario</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSearchVisible(!searchVisible)}
                                className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                            >
                                {searchVisible ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                )}
                            </button>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
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
                                        ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
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

            {/* DESKTOP HEADER - Original */}
            <div className="hidden md:block max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                    <div className="relative group w-full md:max-w-md z-20">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#007AFF] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search name, sku, barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-zinc-800 border border-[#3C3C43]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/50 text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] transition-all text-[15px] shadow-sm appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <div className="relative">
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="p-1 hover:bg-[#F2F2F7] rounded-md transition-colors text-[#8E8E93]"
                                    title="Sort"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                                </button>

                                {isSortOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-[#3C3C43]/10 p-1 animate-in fade-in zoom-in-95 duration-100 transform origin-top-right z-50">
                                        <div className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider px-3 py-2">Sort By</div>
                                        <button onClick={() => { setSortBy('stock-desc'); setIsSortOpen(false); }} className={`w - full text - left px - 3 py - 2 rounded - lg text - [13px] ${sortBy === 'stock-desc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'} `}>Highest Stock</button>
                                        <button onClick={() => { setSortBy('stock-asc'); setIsSortOpen(false); }} className={`w - full text - left px - 3 py - 2 rounded - lg text - [13px] ${sortBy === 'stock-asc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'} `}>Lowest Stock</button>
                                        <button onClick={() => { setSortBy('price-desc'); setIsSortOpen(false); }} className={`w - full text - left px - 3 py - 2 rounded - lg text - [13px] ${sortBy === 'price-desc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'} `}>Highest Price</button>
                                        <button onClick={() => { setSortBy('price-asc'); setIsSortOpen(false); }} className={`w - full text - left px - 3 py - 2 rounded - lg text - [13px] ${sortBy === 'price-asc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'} `}>Lowest Price</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-[#3C3C43]/10 dark:border-white/10 p-0.5 flex items-center shadow-sm">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p - 2 rounded - md transition - all hidden md:block ${viewMode === 'table' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'} `}
                                title="List View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`p - 2 rounded - md transition - all ${viewMode === 'compact' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'} `}
                                title="Compact Tile View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><path d="M4 6v12M10 6v12" strokeWidth={1.5} strokeLinecap="round" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p - 2 rounded - md transition - all ${viewMode === 'grid' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'} `}
                                title="Grid View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                        </div>

                        {/* Export Button - Opens Modal */}
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#1C1C1E] dark:text-white border border-[#3C3C43]/20 dark:border-white/20 px-3 py-2 rounded-xl text-[14px] font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95"
                            title="Export options for InDesign"
                        >
                            <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="hidden lg:inline">Export</span>
                        </button>

                        <button
                            onClick={() => router.push('/inventory/new')}
                            className="flex-1 md:flex-none px-4 py-2 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white rounded-xl text-[15px] font-medium shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            <span className="md:inline">New Product</span>
                        </button>
                    </div>
                </div>
            </div>

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
                    {/* Table View */}
                    {viewMode === 'table' && (
                        <>
                            <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border border-[#3C3C43]/5 dark:border-white/5 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#F2F2F7]/50 border-b border-[#3C3C43]/5">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Product</th>
                                                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Category</th>
                                                <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Status</th>
                                                <th className="text-right px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Stock</th>
                                                <th className="text-right px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Price</th>
                                                <th className="w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#3C3C43]/5">
                                            {paginatedProducts.map((product) => (
                                                <tr key={product.id} className="cursor-pointer hover:bg-[#F2F2F7]/50 transition-colors group" onClick={() => router.push(`/inventory/${product.id}`)}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-[#F2F2F7] flex-shrink-0 overflow-hidden border border-[#3C3C43]/5">
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
                                                                <div className="text-[14px] font-medium text-[#1C1C1E]">{product.nameEs || product.name}</div>
                                                                {product.nameEn && product.nameEs && (
                                                                    <div className="text-[12px] text-[#8E8E93]">{product.nameEn}</div>
                                                                )}
                                                                <div className="text-[11px] text-[#8E8E93] font-mono mt-0.5">{product.sku}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium bg-[#767680]/10 text-[#1C1C1E]">{product.category}</span></td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium border border-[#3C3C43]/10" style={{ backgroundColor: `${getStockColor(product.status)} 20`, color: getStockColor(product.status), borderColor: `${getStockColor(product.status)} 30` }}>
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStockColor(product.status) }}></span>
                                                            {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low Stock' : 'Out'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right"><span className="text-[14px] font-medium text-[#1C1C1E]">{product.stock}</span></td>
                                                    <td className="px-4 py-3 text-right"><span className="text-[14px] font-medium text-[#1C1C1E]">${product.price.toLocaleString()}</span></td>
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
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-white dark:bg-zinc-900 rounded-lg p-2.5 flex items-center mb-2 last:mb-0 active:opacity-80 active:scale-[0.99] transition-all text-foreground shadow-sm border border-transparent dark:border-white/10"
                                >
                                    <img
                                        src={product.image || 'https://via.placeholder.com/80'}
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
                            ))}
                        </div>

                    </div>

                    {viewMode === 'compact' && (
                        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                    className="bg-white dark:bg-zinc-900 rounded-xl p-2.5 shadow-sm cursor-pointer hover:shadow-md transition-all group flex items-center gap-3 active:scale-[0.98] duration-100"
                                >
                                    <div className="w-14 h-14 rounded-lg bg-[#F2F2F7] flex-shrink-0 overflow-hidden relative">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover mix-blend-multiply"
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
                                        <h3 className="text-[13px] font-semibold text-[#1C1C1E] leading-tight truncate" title={product.nameEs || product.name}>{product.nameEs || product.name}</h3>
                                        <p className="text-[11px] text-[#8E8E93] font-mono truncate">{product.sku}</p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-[12px] font-bold text-[#1C1C1E]">${product.price.toLocaleString()}</span>
                                            <span className="text-[10px] text-[#8E8E93]">Stock: {product.stock}</span>
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
                                    className="bg-white dark:bg-zinc-900 rounded-[16px] p-2.5 md:p-3 shadow-sm border border-[#3C3C43]/5 dark:border-white/5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden flex flex-col active:scale-[0.98] duration-100"
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                >
                                    <div className="aspect-square rounded-xl bg-[#F2F2F7] mb-2.5 md:mb-3 overflow-hidden border border-[#3C3C43]/5 relative">
                                        <img
                                            src={product.image || 'https://placehold.co/100x100?text=No+Image'}
                                            alt={product.name}
                                            className="w-full h-full object-cover mix-blend-multiply"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`w - 2.5 h - 2.5 rounded - full block border border - white shadow - sm`} style={{ backgroundColor: getStockColor(product.status) }}></span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex-1 flex flex-col">
                                        <h3 className="text-[13px] md:text-[14px] font-semibold text-[#1C1C1E] leading-tight line-clamp-2 h-[2.5em]">{product.name}</h3>
                                        <p className="text-[11px] md:text-[12px] text-[#8E8E93] font-medium font-mono truncate">{product.sku}</p>
                                        <div className="flex items-center justify-between pt-2 mt-auto">
                                            <span className="text-[14px] md:text-[15px] font-semibold text-[#1C1C1E]">${product.price.toLocaleString()}</span>
                                            <span className="px-1.5 py-0.5 bg-[#767680]/10 rounded text-[9px] md:text-[10px] font-semibold uppercase text-[#1C1C1E] truncate max-w-[60px] md:max-w-[80px]">{product.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-[#E5E5EA] rounded-full mx-auto flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <h3 className="text-[20px] font-semibold text-[#1C1C1E]">No Results</h3>
                            <p className="text-[15px] text-[#8E8E93]">Try a different search term.</p>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {filteredProducts.length > 0 && (
                        <div className="px-6 py-6 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#3C3C43]/5">
                            <div className="text-[13px] text-[#8E8E93]">
                                Showing <span className="font-medium text-[#1C1C1E]">{startIndex + 1}</span> to <span className="font-medium text-[#1C1C1E]">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium text-[#1C1C1E]">{filteredProducts.length}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updatePage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-[#3C3C43]/10 text-[13px] font-medium text-[#1C1C1E] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F2F2F7] transition-colors active:scale-95"
                                >
                                    Previous
                                </button>
                                <div className="text-[13px] font-medium text-[#1C1C1E] tabular-nums">
                                    Page {currentPage} of {Math.max(1, totalPages)}
                                </div>
                                <button
                                    onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="px-3 py-1.5 rounded-lg border border-[#3C3C43]/10 text-[13px] font-medium text-[#1C1C1E] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F2F2F7] transition-colors active:scale-95"
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
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content - 90% width like Odoo */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[15px] w-[90%] p-5 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
                        {/* Close Button - 36x36 solid black */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-[15px] top-[15px] z-10 w-9 h-9 bg-foreground rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                        >
                            <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Product Image - 200x200 centered */}
                        <img
                            src={selectedProduct.image || 'https://via.placeholder.com/200'}
                            alt={selectedProduct.name}
                            className="w-[200px] h-[200px] rounded-[10px] mb-5 mx-auto object-cover"
                        />

                        {/* Header: Name and Price side by side */}
                        <div className="flex justify-between items-start w-full mb-2.5">
                            {/* Name - 60% width */}
                            <div className="w-[60%] pr-2.5">
                                <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white leading-7 flex-wrap">
                                    {selectedProduct.nameEs || selectedProduct.name}
                                </h2>
                            </div>
                            {/* Price - 40% width, right aligned */}
                            <div className="w-[40%] flex items-end flex-col">
                                <span className="text-[24px] font-medium text-gray-900 dark:text-white">
                                    ${selectedProduct.price.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setModalTab('info')}
                                className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${modalTab === 'info'
                                    ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                Info
                            </button>
                            <button
                                onClick={() => setModalTab('count')}
                                className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${modalTab === 'count'
                                    ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                Contar
                            </button>
                        </div>

                        {/* Tab Content */}
                        {modalTab === 'info' ? (
                            <>
                                {/* Barcode */}
                                <p className="text-[16px] text-muted-foreground mb-0">
                                    {selectedProduct.barcode || selectedProduct.sku}
                                </p>

                                {/* Bottom row: Measures and Stock */}
                                <div className="flex justify-between items-center w-full mt-1">
                                    <span className="text-[14px] text-gray-900 dark:text-white">
                                        Medidas: {selectedProduct.category || 'N/A'}
                                    </span>
                                    <div
                                        className={`px-3 h-6 rounded-xl flex items-center justify-center ${getStockBadgeClass(selectedProduct.stock)}`}
                                    >
                                        <span className="text-[12px] font-medium">
                                            Stock: {selectedProduct.stock}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {/* Action Button */}
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 shrink-0 h-[52px]">
                                        <button
                                            onClick={() => setPrintCopies(Math.max(1, printCopies - 1))}
                                            className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-zinc-700 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        </button>
                                        <div className="w-8 flex justify-center text-[18px] font-bold text-gray-900 dark:text-white tabular-nums">
                                            {printCopies}
                                        </div>
                                        <button
                                            onClick={() => setPrintCopies(printCopies + 1)}
                                            className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-zinc-700 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleRemotePrint}
                                        className="flex-1 bg-[#007AFF] text-white h-[52px] rounded-xl font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-blue-500/20"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Imprimir
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Quick Count Interface */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* System Stock */}
                                        <div className="flex flex-col items-center p-4 rounded-xl bg-gray-100 dark:bg-zinc-800">
                                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sistema</span>
                                            <span className="text-[32px] font-bold text-gray-900 dark:text-white">{selectedProduct.stock}</span>
                                        </div>

                                        {/* Physical Count Input */}
                                        <div className="flex flex-col items-center p-4 rounded-xl bg-white dark:bg-zinc-800 border-2 border-[#007AFF] relative">
                                            <span className="text-[11px] font-bold text-[#007AFF] uppercase mb-1">Físico</span>
                                            <div className="text-[32px] font-bold text-gray-900 dark:text-white leading-none">
                                                {physicalCount || '0'}
                                            </div>
                                            {countStatus === 'matching' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />}
                                            {countStatus === 'discrepancy' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />}
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
        </main>
    );
}
