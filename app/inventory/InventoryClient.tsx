'use client';

import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { useRealtimeInventory } from '../hooks/useRealtimeInventory';
import { Product } from '../lib/google-sheets';
import Loading from './loading';
import toast from 'react-hot-toast';

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

    // Data State (Managed by SWR now)
    // const [products, setProducts] = useState<Product[]>([]); // Removed local state for products
    // const [isLoading, setIsLoading] = useState(true);
    // const [error, setError] = useState(false);

    // Realtime Updates Hook
    const { products, isLoading, error, isConnected } = useRealtimeInventory();

    const [filteredProductsState, setFilteredProductsState] = useState<Product[]>([]);

    // UI state
    const [showScanner, setShowScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('stock-desc');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid' | 'compact'>('grid');
    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Pagination
    const currentPage = Number(searchParams.get('page')) || 1;
    const [itemsPerPage] = useState(30);

    // Removed manual useEffect fetch


    // Pagination Logic
    const updatePage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [searchQuery, categoryFilter, pathname, router]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.sku?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
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

    const getStockColor = (status: string) => {
        switch (status) {
            case 'in-stock': return '#34C759';
            case 'low-stock': return '#FF9500';
            case 'out-of-stock': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    const handleScanSuccess = async (code: string) => {
        setShowScanner(false);
        // Products are local state now, instant lookup
        const product = (products || []).find(p =>
            (p.barcode && p.barcode === code) ||
            (p.sku && p.sku === code) ||
            (p.barcode && p.barcode.includes(code))
        );

        if (product) {
            router.push(`/inventory/${product.id}`);
            toast.success('Product found!');
        } else {
            toast.error(`Producto no encontrado: ${code}`);
        }
    };

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

            // Scanner inputs are very fast (< 50ms between keys usually)
            // If pause is too long, reset buffer
            if (currentTime - lastKeyTime > 100) {
                buffer = '';
            }

            lastKeyTime = currentTime;

            if (char === 'Enter') {
                if (buffer.length > 2) {
                    // It's likely a barcode scan
                    console.log('Detected Scan:', buffer);
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
    }, [products, router]); // Re-bind if products changes so we have latest list

    return (
        <main ref={container} className="min-h-screen bg-[#F2F2F7] pb-24 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* HEADER SHELL - Renders Instantly */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 mb-4 md:mb-6">
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
                            className="w-full pl-10 pr-12 py-2.5 bg-white border border-[#3C3C43]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/50 text-[#1C1C1E] placeholder-[#8E8E93] transition-all text-[15px] shadow-sm appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <div className="relative">
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    // Removed onBlur for better mobile touch handling
                                    className="p-1 hover:bg-[#F2F2F7] rounded-md transition-colors text-[#8E8E93]"
                                    title="Sort"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                                </button>

                                {isSortOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-[#3C3C43]/10 p-1 animate-in fade-in zoom-in-95 duration-100 transform origin-top-right z-50">
                                        <div className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider px-3 py-2">Sort By</div>
                                        <button onClick={() => { setSortBy('stock-desc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'stock-desc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Highest Stock</button>
                                        <button onClick={() => { setSortBy('stock-asc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'stock-asc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Lowest Stock</button>
                                        <button onClick={() => { setSortBy('price-desc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'price-desc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Highest Price</button>
                                        <button onClick={() => { setSortBy('price-asc'); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'price-asc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Lowest Price</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="bg-white rounded-lg border border-[#3C3C43]/10 p-0.5 flex items-center shadow-sm">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition-all hidden md:block ${viewMode === 'table' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                                title="List View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'compact' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                                title="Compact Tile View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><path d="M4 6v12M10 6v12" strokeWidth={1.5} strokeLinecap="round" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                                title="Grid View"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                        </div>

                        {/* Export Button - Opens Modal */}
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-white hover:bg-gray-50 text-[#1C1C1E] border border-[#3C3C43]/20 px-3 py-2 rounded-xl text-[14px] font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95"
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
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in duration-500">
                    {/* Table View */}
                    {viewMode === 'table' && (
                        <>
                            <div className="hidden md:block bg-white rounded-[10px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
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
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium border border-[#3C3C43]/10" style={{ backgroundColor: `${getStockColor(product.status)}20`, color: getStockColor(product.status), borderColor: `${getStockColor(product.status)}30` }}>
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

                            <div className="md:hidden grid grid-cols-1 gap-3">
                                {paginatedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => router.push(`/inventory/${product.id}`)}
                                        className="bg-white rounded-xl p-3 shadow-sm border border-[#3C3C43]/5 flex items-center gap-3 active:scale-[0.98] transition-transform"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-[#F2F2F7] flex-shrink-0 overflow-hidden border border-[#3C3C43]/5">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-[14px] font-medium text-[#1C1C1E] truncate pr-2">{product.nameEs || product.name}</h3>
                                                <span className="text-[14px] font-semibold text-[#1C1C1E]">${product.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-[12px] text-[#8E8E93] font-mono">{product.sku}</p>
                                                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md`} style={{ color: getStockColor(product.status), backgroundColor: `${getStockColor(product.status)}15` }}>
                                                    {product.stock} in stock
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {viewMode === 'compact' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                    className="bg-white rounded-xl p-2.5 shadow-sm border border-[#3C3C43]/5 cursor-pointer hover:border-[#007AFF]/30 hover:shadow-md transition-all group flex items-center gap-3 active:scale-[0.98] duration-100"
                                >
                                    <div className="w-14 h-14 rounded-lg bg-[#F2F2F7] flex-shrink-0 overflow-hidden border border-[#3C3C43]/5 relative">
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
                                            <span className={`w-1.5 h-1.5 rounded-full block`} style={{ backgroundColor: getStockColor(product.status) }}></span>
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

                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-[16px] p-2.5 md:p-3 shadow-sm border border-[#3C3C43]/5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden flex flex-col active:scale-[0.98] duration-100"
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                >
                                    <div className="aspect-square rounded-xl bg-[#F2F2F7] mb-2.5 md:mb-3 overflow-hidden border border-[#3C3C43]/5 relative">
                                        <img
                                            src={product.image || 'https://placehold.co/100x100?text=No+Image'}
                                            alt={product.name}
                                            className="w-full h-full object-cover mix-blend-multiply"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`w-2.5 h-2.5 rounded-full block border border-white shadow-sm`} style={{ backgroundColor: getStockColor(product.status) }}></span>
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

            {/* Scanner Button (FAB) */}
            <button
                onClick={() => setShowScanner(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-[#007AFF] text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-[#0056b3] transition-all hover:scale-110 active:scale-95 z-50 md:hidden"
                title="Scan Barcode"
            >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </button>
            <button
                onClick={() => setShowScanner(true)}
                className="hidden md:flex fixed bottom-8 right-8 bg-[#007AFF] text-white rounded-xl shadow-lg shadow-blue-500/30 items-center justify-center gap-2 px-6 py-3 hover:bg-[#0056b3] transition-all hover:scale-105 active:scale-95 z-50"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
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
        </main>
    );
}
