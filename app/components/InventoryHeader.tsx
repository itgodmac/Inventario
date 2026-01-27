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
}

export default function InventoryHeader({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange,
    onExportClick
}: InventoryHeaderProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSortOpen, setIsSortOpen] = useState(false);

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
            <div className="max-w-[1450px] mx-auto px-4">
                {/* Pill Container - Super Minimal */}
                <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-full px-5 py-2.5 border border-gray-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-3">

                    {/* Search Bar - Minimal Inline */}
                    <div className="flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                                placeholder="Buscar..."
                            />
                        </div>
                    </div>

                    {/* Right Side Controls */}
                    <div className="flex items-center gap-3">

                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className={`p-1.5 rounded-full transition-colors ${isSortOpen ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                            >
                                <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800 overflow-hidden z-50">
                                        <div className="p-1">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        onSortChange(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${sortBy === option.value
                                                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
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
                        <div className="w-px h-5 bg-gray-300 dark:bg-zinc-700" />

                        {/* View Toggles */}
                        <div className="hidden lg:flex gap-0.5">
                            {viewOptions.map((view) => (
                                <button
                                    key={view.id}
                                    onClick={() => onViewModeChange(view.id)}
                                    className={`p-1.5 rounded-full transition-colors ${viewMode === view.id
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                                        : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <view.icon className="w-4 h-4" />
                                </button>
                            ))}

                            <button
                                onClick={() => router.push('/inventory/spreadsheet')}
                                className="p-1.5 rounded-full text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Table2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 bg-gray-300 dark:bg-zinc-700" />

                        {/* Action Buttons - Minimal */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onExportClick}
                                className="p-1.5 rounded-full text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                            </button>

                            {(session?.user as any)?.role === 'admin' && (
                                <button
                                    onClick={() => router.push('/users')}
                                    className="p-1.5 rounded-full text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                            )}

                            <div className="w-px h-5 bg-gray-300 dark:bg-zinc-700 mx-1" />

                            <button
                                onClick={() => router.push('/inventory/new')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Nuevo</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
