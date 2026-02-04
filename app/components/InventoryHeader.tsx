'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, SortAsc, Grid3x3, LayoutList, LayoutGrid, Download, Table2, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface InventoryHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';
    onSortChange: (sort: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc') => void;
    viewMode: 'table' | 'grid' | 'compact' | 'excel';
    onViewModeChange: (mode: 'table' | 'grid' | 'compact' | 'excel') => void;
    onExportClick: () => void;
    categories: string[];
    categoryFilter: string;
    onCategoryChange: (category: string) => void;
}

export default function InventoryHeader({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange,
    onExportClick,
    categories,
    categoryFilter,
    onCategoryChange
}: InventoryHeaderProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const sortOptions = [
        { label: 'Mayor Stock', value: 'stock-desc' as const },
        { label: 'Menor Stock', value: 'stock-asc' as const },
        { label: 'Mayor Precio', value: 'price-desc' as const },
        { label: 'Menor Precio', value: 'price-asc' as const },
        { label: 'Nombre A-Z', value: 'name-asc' as const },
        { label: 'Nombre Z-A', value: 'name-desc' as const },
    ];

    const viewOptions = [
        { id: 'table' as const, icon: LayoutList },
        { id: 'compact' as const, icon: Grid3x3 },
        { id: 'grid' as const, icon: LayoutGrid },
    ];

    return (
        <div className="hidden md:block sticky top-0 z-40 bg-[#FAFAFA] dark:bg-zinc-950 pb-4 pt-6">
            <div className="max-w-[1450px] 2xl:max-w-none mx-auto px-4">
                {/* Pill Container - Super Minimal */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-full px-5 py-2.5 border border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-4">

                    {/* Left: Category Selector - NEW */}
                    <div className="relative">
                        <button
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {categoryFilter === 'all' ? 'Categorías' : categoryFilter}
                            </span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isCategoryOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                                <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                                    <div className="p-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {categories.map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => {
                                                    onCategoryChange(category);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${categoryFilter === category
                                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                    }`}
                                            >
                                                {category === 'all' ? 'Todas las Categorías' : category}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800" />

                    {/* Search Bar - Minimal Inline */}
                    <div className="flex-1 max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                                placeholder="Buscar productos..."
                            />
                        </div>
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center gap-3">

                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isSortOpen ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                            >
                                <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Ordenar</span>
                            </button>

                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <div className="p-1.5">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        onSortChange(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${sortBy === option.value
                                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800" />

                        {/* View Toggles */}
                        <div className="hidden lg:flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-full border border-gray-200/50 dark:border-zinc-700/50">
                            {viewOptions.map((view) => (
                                <button
                                    key={view.id}
                                    onClick={() => onViewModeChange(view.id)}
                                    className={`p-1.5 rounded-full transition-all ${viewMode === view.id
                                        ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <view.icon className="w-3.5 h-3.5" />
                                </button>
                            ))}

                            <button
                                onClick={() => router.push('/inventory/spreadsheet')}
                                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                            >
                                <Table2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Action Buttons - Minimal */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onExportClick}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                title="Exportar"
                            >
                                <Download className="w-4 h-4" />
                            </button>

                            {(session?.user as any)?.role === 'admin' && (
                                <button
                                    onClick={() => router.push('/users')}
                                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Usuarios"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                            )}

                            <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800 mx-1" />

                            <button
                                onClick={() => router.push('/inventory/new')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-bold hover:shadow-lg active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nuevo Item</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
