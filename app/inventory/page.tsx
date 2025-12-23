'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../components/DashboardHeader';

// Theme configurations
const themes = {
    bigm: {
        primary: '#007AFF', // iOS Blue
        secondary: '#8E8E93',
        name: 'Big Machines',
    },
    mca: {
        primary: '#1B3A57',
        secondary: '#9BA5AE',
        name: 'MCA Corporation',
    },
    default: {
        primary: '#1A73E8',
        secondary: '#5F6368',
        name: 'RIPODOO',
    }
};

// Sample product data
import { inventoryData } from './data';

const sampleProducts = inventoryData;

export default function InventoryPage() {
    const container = useRef(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [currentTheme] = useState(themes.bigm);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('stock-desc');
    const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');
    const [products] = useState(sampleProducts);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(24); // Divisible by 2, 3, 4 for grid layouts

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.itemCode && product.itemCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

    const getStockColor = (status: string) => {
        switch (status) {
            case 'in-stock': return '#34C759'; // Apple Green
            case 'low-stock': return '#FF9500'; // Apple Orange
            case 'out-of-stock': return '#FF3B30'; // Apple Red
            default: return '#8E8E93';
        }
    };

    return (
        <main ref={container} className="min-h-screen bg-[#F2F2F7] pb-20 font-sans selection:bg-blue-100 selection:text-blue-900">
            <DashboardHeader appName="Inventory" />

            {/* Local Search & Filter (Apple/Odoo style) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="relative group w-full md:max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#007AFF] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#3C3C43]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/50 text-[#1C1C1E] placeholder-[#8E8E93] transition-all text-[15px] shadow-sm"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">

                            {/* Sort Dropdown */}
                            <div className="relative group/sort">
                                <button className="p-1 hover:bg-[#F2F2F7] rounded-md transition-colors text-[#8E8E93]" title="Sort">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-[#3C3C43]/10 p-1 opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover/sort:scale-100">
                                    <div className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider px-3 py-2">Sort By</div>
                                    <button onClick={() => setSortBy('stock-desc')} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'stock-desc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Highest Stock</button>
                                    <button onClick={() => setSortBy('stock-asc')} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'stock-asc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Lowest Stock</button>
                                    <div className="h-px bg-[#3C3C43]/10 my-1"></div>
                                    <button onClick={() => setSortBy('price-desc')} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'price-desc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Highest Price</button>
                                    <button onClick={() => setSortBy('price-asc')} className={`w-full text-left px-3 py-2 rounded-lg text-[13px] ${sortBy === 'price-asc' ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'}`}>Lowest Price</button>
                                </div>
                            </div>

                            <button className="p-1 hover:bg-[#F2F2F7] rounded-md transition-colors text-[#8E8E93]" title="Filter">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-lg border border-[#3C3C43]/10 p-0.5 flex items-center shadow-sm">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            </button>
                        </div>
                        <button className="px-4 py-2 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white rounded-xl text-[15px] font-medium shadow-sm transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            New
                        </button>
                    </div>
                </div>

                {/* Active Filters / Breadcrumb Area (Optional) */}
            </div>

            {/* Content Content - iOS Grouped Inset Style */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                <div ref={contentRef}>
                    {/* Table View (Grouped Inset) */}
                    {viewMode === 'table' && (
                        <div className="bg-white rounded-[10px] shadow-sm border border-[#3C3C43]/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F2F2F7]/50 border-b border-[#3C3C43]/5">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">ID</th>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Code</th>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Barcode</th>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Nombre Esp</th>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Nombre Eng</th>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Category</th>
                                            <th className="text-left px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Status</th>
                                            <th className="text-right px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Stock</th>
                                            <th className="text-right px-4 py-3 text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Price</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#3C3C43]/5">
                                        {paginatedProducts.map((product) => (
                                            <tr
                                                key={product.id}
                                                className="cursor-pointer hover:bg-[#F2F2F7]/50 transition-colors group"
                                                onClick={() => router.push(`/inventory/${product.id}`)}
                                            >
                                                <td className="px-4 py-3 text-[13px] text-[#8E8E93] font-mono">
                                                    {product.id}
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-[#1C1C1E] font-mono">
                                                    {product.itemCode || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-[13px] text-[#8E8E93] font-mono">
                                                    {product.barcode || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[#F2F2F7] flex-shrink-0 overflow-hidden border border-[#3C3C43]/5">
                                                            {product.image ? (
                                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[#C7C7CC]">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-medium text-[#1C1C1E] leading-snug line-clamp-2 max-w-[200px]" title={product.nameEs}>{product.nameEs || product.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-[13px] text-[#5A5A5F] line-clamp-2 max-w-[200px]" title={product.nameEn}>
                                                        {product.nameEn || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium bg-[#767680]/10 text-[#1C1C1E]">
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium border border-[#3C3C43]/10"
                                                        style={{
                                                            backgroundColor: `${getStockColor(product.status)}20`,
                                                            color: getStockColor(product.status),
                                                            borderColor: `${getStockColor(product.status)}30`
                                                        }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStockColor(product.status) }}></span>
                                                        {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-[14px] font-medium text-[#1C1C1E]">{product.stock}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-[14px] font-medium text-[#1C1C1E]">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <svg className="w-4 h-4 text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-[20px] p-4 shadow-sm border border-[#3C3C43]/5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                                    onClick={() => router.push(`/inventory/${product.id}`)}
                                >
                                    <div className="aspect-square rounded-2xl bg-[#F2F2F7] mb-4 overflow-hidden border border-[#3C3C43]/5 relative">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`w-3 h-3 rounded-full block border-2 border-white shadow-sm`} style={{ backgroundColor: getStockColor(product.status) }}></span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-[17px] font-semibold text-[#1C1C1E] leading-tight truncate">{product.name}</h3>
                                        <p className="text-[13px] text-[#8E8E93] font-medium">{product.sku}</p>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-[17px] font-semibold text-[#1C1C1E]">${product.price.toLocaleString()}</span>
                                            <span className="px-2 py-1 bg-[#767680]/10 rounded-lg text-[11px] font-semibold uppercase text-[#1C1C1E]">{product.category}</span>
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
                </div>
            </div>

            {/* Footer Info */}
            {/* Pagination Footer */}
            <div className="max-w-7xl mx-auto px-6 py-6 mt-4 flex items-center justify-between border-t border-[#3C3C43]/5">
                <div className="text-[13px] text-[#8E8E93]">
                    Showing <span className="font-medium text-[#1C1C1E]">{filteredProducts.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-[#1C1C1E]">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium text-[#1C1C1E]">{filteredProducts.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-[#3C3C43]/10 text-[13px] font-medium text-[#1C1C1E] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F2F2F7] transition-colors"
                    >
                        Previous
                    </button>
                    <div className="text-[13px] font-medium text-[#1C1C1E] tabular-nums">
                        Page {currentPage} of {Math.max(1, totalPages)}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 rounded-lg border border-[#3C3C43]/10 text-[13px] font-medium text-[#1C1C1E] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F2F2F7] transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </main>
    );
}
