'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRealtimeInventory } from '@/app/hooks/useRealtimeInventory';
import toast from 'react-hot-toast';
import { CloudinaryPresets } from '@/lib/cloudinary';
import { ZoomIn, ZoomOut, RotateCcw, Search, Wifi, WifiOff, Save } from 'lucide-react';

// --- TYPES ---
interface CellPosition {
    rowIndex: number;
    columnKey: string;
}

// --- CONFIG ---
const EDITABLE_COLUMNS = [
    { key: 'photoId', label: 'ID', width: 70, editable: false },
    { key: 'sku', label: 'SKU', width: 120, editable: false },
    { key: 'itemCode', label: 'OEM', width: 120, editable: true },
    { key: 'uniCode', label: 'Uni Code', width: 120, editable: true },
    { key: 'nameEs', label: 'Nombre Español', width: 220, editable: true },
    { key: 'nameEn', label: 'Nombre Inglés', width: 220, editable: true },
    // { key: 'barcode', label: 'Barcode', width: 130, editable: true },
    { key: 'category', label: 'Categoría', width: 140, editable: true, type: 'select', autoValues: true },
    { key: 'montaje', label: 'Montaje', width: 140, editable: true, type: 'select', autoValues: true },
    { key: 'tipo', label: 'Tipo', width: 120, editable: true, type: 'select', autoValues: true },
    { key: 'status', label: 'Status', width: 110, editable: true, type: 'select', options: ['available', 'out-of-stock', 'low-stock'] },

    // Financials
    { key: 'priceZG', label: 'ZG (Fab)', width: 90, editable: true, type: 'number' },
    { key: 'priceOth', label: 'OTH (Comp)', width: 90, editable: true, type: 'number' },
    { key: 'priceBM', label: 'BM', width: 90, editable: true, type: 'number' },
    { key: 'ptijDll', label: 'PTIJ (USD)', width: 100, editable: true, type: 'number' },
    { key: 'ptijMxn', label: 'PTIJ (MXN)', width: 100, editable: true, type: 'number' },
    { key: 'vecesG', label: 'Veces G', width: 80, editable: true, type: 'number' },
    { key: 'price', label: 'Venta', width: 100, editable: true, type: 'number' },

    // Inventory
    { key: 'stock', label: 'Sys', width: 70, editable: true, type: 'number' },
    { key: 'physicalStock', label: 'Físico', width: 70, editable: true, type: 'number' },
    { key: 'notes', label: 'Notas', width: 200, editable: true },
];

// --- SUB-COMPONENTS ---

// --- SUB-COMPONENTS ---

const COLOR_PALETTE = [
    { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' },
    { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300' },
    { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
    { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300' },
    { bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-700 dark:text-lime-300' },
    { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
    { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300' },
    { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300' },
    { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-300' },
    { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
    { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300' },
    { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300' },
    { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' },
    { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
    { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300' },
    { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300' },
];

const getValueTheme = (value: string, colKey: string) => {
    if (!value) return { bg: 'bg-transparent', text: 'text-gray-400' };

    if (colKey === 'status') {
        const lowerVal = String(value).toLowerCase();
        // Explicit strict checks for known statuses
        if (lowerVal === 'available' || lowerVal === 'in stock') return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' };
        if (lowerVal === 'out-of-stock' || lowerVal === 'out of stock' || lowerVal === 'agotado') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' };
        if (lowerVal === 'low-stock' || lowerVal === 'low stock') return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' };
        // If not matched, fall through to hash logic below so it's not gray
    }

    // Deterministic hash for other columns OR unknown status values
    let hash = 0;
    const str = String(value);
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
};

const SelectionOverlay = memo(({ selectedCell, isEditing, editValue, onSave, onConfirm, onRevert, onKeyDown, onEditValueChange, uniqueValues, containerRef, imgSizeRef }: any) => {
    const [localValue, setLocalValue] = useState(editValue);
    const overlayRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Combine all options: empty, fixed options, and unique values
    const allOptions = useMemo(() => {
        if (!selectedCell || !isEditing) return [];
        const col = EDITABLE_COLUMNS.find(c => c.key === selectedCell.columnKey);
        if (!col || col.type !== 'select') return [];

        const opts = [
            ...(col.options || []),
            ...(col.autoValues && uniqueValues[col.key] ? uniqueValues[col.key] : [])
        ];
        // Deduplicate
        return Array.from(new Set(opts));
    }, [selectedCell, isEditing, uniqueValues]);

    useEffect(() => { setLocalValue(editValue); }, [editValue]);

    useEffect(() => {
        if (!selectedCell || !containerRef.current || !overlayRef.current) return;

        // Find the cell in the DOM to get its coordinates
        const cellId = `cell-${selectedCell.rowIndex}-${selectedCell.columnKey}`;
        const cellDom = containerRef.current.querySelector(`#${cellId}`) as HTMLElement;
        if (!cellDom) return;

        const overlay = overlayRef.current;
        overlay.style.width = `${cellDom.offsetWidth}px`;
        overlay.style.height = `${cellDom.offsetHeight}px`;
        overlay.style.top = `${cellDom.offsetTop}px`;
        overlay.style.left = `${cellDom.offsetLeft}px`;
        overlay.style.display = 'block';

        // AUTO-SCROLL LOGIC
        const container = containerRef.current;
        const scrollPadding = 40;
        const headerHeight = 40;

        const cellTop = cellDom.offsetTop;
        const cellBottom = cellTop + cellDom.offsetHeight;
        const cellLeft = cellDom.offsetLeft;
        const cellRight = cellLeft + cellDom.offsetWidth;

        const viewportTop = container.scrollTop + headerHeight;
        const viewportBottom = container.scrollTop + container.clientHeight;
        const viewportLeft = container.scrollLeft + 40 + (imgSizeRef.current + 16);
        const viewportRight = container.scrollLeft + container.clientWidth;

        if (cellTop < viewportTop) container.scrollTop = cellTop - headerHeight - scrollPadding;
        else if (cellBottom > viewportBottom) container.scrollTop = cellBottom - container.clientHeight + scrollPadding;

        if (cellLeft < viewportLeft) container.scrollLeft = cellLeft - 40 - (imgSizeRef.current + 16) - scrollPadding;
        else if (cellRight > viewportRight) container.scrollLeft = cellRight - container.clientWidth + scrollPadding;

        if (isEditing) {
            setTimeout(() => {
                inputRef.current?.focus();
                // For custom select, we focus the container to capture keys
                if (!inputRef.current) overlayRef.current?.focus();
            }, 0);
        }
    }, [selectedCell, isEditing, containerRef]); // imgSizeRef excluded intentionally

    if (!selectedCell) return null;

    const column = EDITABLE_COLUMNS.find(c => c.key === selectedCell.columnKey);
    if (!column) return null;

    const theme = getValueTheme(localValue, column.key);

    return (
        <div
            ref={overlayRef}
            tabIndex={isEditing && column.type === 'select' ? 0 : -1}  // Make focusable for select interaction
            className={`absolute z-50 ring-2 ring-blue-500 bg-blue-50/10 outline-none ${!isEditing ? 'pointer-events-none' : ''}`}
            style={{ display: 'none' }}
            onKeyDown={(e) => {
                if (column.type === 'select') {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedIndex(prev => Math.min(prev + 1, allOptions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedIndex(prev => Math.max(prev - 1, 0));
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = allOptions[selectedIndex];
                        if (val !== undefined) onConfirm(val);
                        else onConfirm(localValue);
                    } else if (e.key === 'Escape') {
                        onRevert();
                    } else if (e.key === 'Tab') {
                        e.preventDefault();
                        const val = allOptions[selectedIndex];
                        // Tab acts as confirm + move. We delegate to parent keyDown but ensure value is passed.
                        onKeyDown(e, selectedCell.rowIndex, selectedCell.columnKey, false, true, val ?? localValue);
                    } else {
                        // Forward other keys (Ctrl+V, Ctrl+C, Delete, etc)
                        onKeyDown(e, selectedCell.rowIndex, selectedCell.columnKey);
                    }
                } else {
                    // For non-select columns in "Navigation Mode" (overlay focused but not editing input yet)
                    onKeyDown(e, selectedCell.rowIndex, selectedCell.columnKey);
                }
            }}
            onBlur={(e) => {
                // If focus moved outside, revert (cancel) because we want explicit selection via Click or Enter for selects
                // to avoid accidental changes while scrolling/tabbing if not committed.
                if (column.type === 'select' && !e.currentTarget.contains(e.relatedTarget)) {
                    onRevert();
                }
            }}
        >
            {isEditing && column.editable && (
                <div className="w-full h-full relative">
                    {column.type === 'select' ? (
                        <div className="absolute top-0 left-0 min-w-[200px] max-h-[300px] overflow-y-auto bg-white dark:bg-zinc-800 shadow-2xl rounded-md border border-gray-200 dark:border-zinc-700 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-75">
                            {allOptions.length === 0 && <div className="p-2 text-xs text-gray-400">No options</div>}
                            {allOptions.map((opt, idx) => {
                                const optTheme = getValueTheme(opt, column.key);
                                return (
                                    <div
                                        key={opt}
                                        className={`px-3 py-2 text-xs cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-100 dark:hover:bg-zinc-700
                                        ${localValue === opt ? 'bg-gray-50 dark:bg-white/5 font-bold' : ''}
                                        ${selectedIndex === idx ? 'bg-gray-50 dark:bg-white/5' : ''}
                                    `}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLocalValue(opt);
                                            onConfirm(opt);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <span className={`px-2 py-0.5 rounded-full ${optTheme.bg} ${optTheme.text}`}>
                                            {opt || '-'}
                                        </span>
                                    </div>
                                )
                            })}

                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type={column.type === 'number' ? 'number' : 'text'}
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            onBlur={() => onSave(localValue)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onKeyDown(e, selectedCell.rowIndex, selectedCell.columnKey, true, false, localValue);
                                else if (e.key === 'Tab') onKeyDown(e, selectedCell.rowIndex, selectedCell.columnKey, false, true, localValue);
                                else if (e.key === 'Escape') onRevert();
                            }}
                            className={`w-full h-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white outline-none px-3 text-[12px] ${column.type === 'number' ? 'text-right' : ''}`}
                        />
                    )}
                </div>
            )
            }
        </div >
    );
});
SelectionOverlay.displayName = 'SelectionOverlay';

const Row = memo(({ product, rowIndex, isPending, onSelect }: any) => {
    // Zebra striping logic
    const isEven = rowIndex % 2 === 0;
    const baseRowClass = product.isPhantom
        ? 'bg-yellow-50/30 dark:bg-yellow-500/5'
        : isEven
            ? 'bg-white dark:bg-zinc-950'
            : 'bg-gray-50/50 dark:bg-zinc-900/50';

    return (
        <tr
            className={`group hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors ${baseRowClass}`}
            style={{ opacity: isPending ? 0.6 : 1 }}
        >
            <td className={`sticky left-0 ${baseRowClass} group-hover:bg-blue-50/30 dark:group-hover:bg-blue-500/5 px-3 py-1.5 text-[10px] text-gray-400 border-b border-gray-100 dark:border-white/5 font-mono z-20 w-[40px] text-center select-none`}>
                {product.isPhantom ? '+' : rowIndex + 1}
            </td>

            <td className={`sticky left-[40px] ${baseRowClass} group-hover:bg-blue-50/30 dark:group-hover:bg-blue-500/5 border-b border-gray-100 dark:border-white/5 z-20 p-1`} style={{ width: 'calc(var(--img-size) + 16px)', minWidth: 'calc(var(--img-size) + 16px)' }}>
                {!product.isPhantom && (
                    <div className="relative group/img" style={{ width: 'var(--img-size)', height: 'var(--img-size)', margin: '0 auto' }}>
                        {product.image ? (
                            <img src={CloudinaryPresets.thumbnail(product.image)} alt="" className="w-full h-full object-cover rounded-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-sm ring-1 ring-black/5 dark:ring-white/10">
                                <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-zinc-700" />
                            </div>
                        )}
                        <Link href={`/inventory/${product.photoId}`} target="_blank" className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <svg className="w-3 h-3 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </Link>
                    </div>
                )}
            </td>

            {EDITABLE_COLUMNS.map((column) => {
                const value = (product as any)[column.key];
                const displayValue = column.type === 'number' && value != null
                    ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : (value || '');

                const isSelect = column.type === 'select';
                const theme = isSelect ? getValueTheme(String(value), column.key) : null;
                const cellClass = theme
                    ? `${theme.bg} ${theme.text}`
                    : '';

                return (
                    <td
                        key={column.key}
                        id={`cell-${rowIndex}-${column.key}`}
                        onClick={() => onSelect(product.id, column.key, value, column.type === 'select', 'click')}
                        onDoubleClick={() => onSelect(product.id, column.key, value, true, 'doubleclick')}
                        style={{ fontSize: 'var(--font-size)' }}
                        className={`px-3 py-1.5 border-b border-gray-100 dark:border-white/5 relative outline-none truncate select-none hover:bg-blue-50/10 dark:hover:bg-blue-500/5 cursor-pointer ${column.type === 'number' ? 'text-right font-mono tabular-nums' : 'text-left'} ${cellClass}`}
                    >
                        {isSelect && value ? (
                            <span className={`px-2 py-0.5 rounded-full inline-block truncate max-w-full ${theme?.bg} ${theme?.text}`}>
                                {displayValue}
                            </span>
                        ) : (
                            displayValue
                        )}
                        {isSelect && <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] opacity-20">▼</span>}
                    </td>
                );
            })}
        </tr>
    );
});
Row.displayName = 'Row';

// --- MAIN PAGE ---

export default function SpreadsheetPage() {
    const { products: dbProducts, isLoading, isConnected, refresh, updateProduct } = useRealtimeInventory();

    const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editStartMode, setEditStartMode] = useState<'click' | 'doubleclick' | 'type'>('click');

    const [editValue, setEditValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    // Use Ref for zoom to avoid re-renders (Performance Critical)
    const zoomRef = useRef(32);
    const [pendingSaves, setPendingSaves] = useState(new Set<string>());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Direct DOM manipulation for instant zoom without React reconciliation
    const handleZoom = useCallback((delta: number | 'reset') => {
        if (!tableContainerRef.current) return;

        let newSize;
        if (delta === 'reset') newSize = 32;
        else newSize = Math.max(20, Math.min(120, zoomRef.current + delta));

        zoomRef.current = newSize;

        // Update CSS variables directly
        tableContainerRef.current.style.setProperty('--img-size', `${newSize}px`);
        tableContainerRef.current.style.setProperty('--font-size', `${Math.max(11, 11 + (newSize - 32) / 6)}px`);
    }, []);

    // CRITICAL: Ref-based state for callback stability
    const stateRef = useRef({
        selectedCell,
        selectedProductId,
        editValue,
        processedProducts: [] as any[],
        isEditing,
        phantomData: {} as any,
        history: [] as { id: string; col: string; val: any }[]
    });

    const uniqueValues = useMemo(() => {
        if (!dbProducts) return { category: [], montaje: [], tipo: [] };
        const extractUnique = (key: string) => Array.from(new Set(dbProducts.map(p => (p as any)[key]).filter(Boolean))).sort();
        return { category: extractUnique('category') as string[], montaje: extractUnique('montaje') as string[], tipo: extractUnique('tipo') as string[] };
    }, [dbProducts]);

    const [phantomData, setPhantomData] = useState<any>({});
    const [optimisticValues, setOptimisticValues] = useState<Record<string, any>>({}); // ID -> { key: value }

    const fetchNextIds = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/next-id');
            const data = await res.json();
            if (data.status === 'success') {
                setPhantomData((prev: any) => ({ ...prev, barcode: data.nextBarcode, photoId: data.nextPhotoId }));
            }
        } catch (e) { console.error("Failed to fetch next IDs", e); }
    }, []);

    useEffect(() => { fetchNextIds(); }, [fetchNextIds]);

    const processedProducts = useMemo(() => {
        let result = dbProducts ? [...dbProducts] : [];

        // 1. Apply Optimistic Updates
        if (Object.keys(optimisticValues).length > 0) {
            result = result.map(p => {
                if (optimisticValues[p.id]) {
                    return { ...p, ...optimisticValues[p.id] };
                }
                return p;
            });
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(product =>
                ['sku', 'nameEs', 'nameEn', 'category', 'barcode', 'itemCode', 'uniCode', 'montaje', 'tipo', 'status'].some(key => {
                    const val = (product as any)[key];
                    return val && String(val).toLowerCase().includes(query);
                })
            );
        }


        if (sortConfig) {
            result.sort((a, b) => {
                const valA = (a as any)[sortConfig.key];
                const valB = (b as any)[sortConfig.key];
                if (valA === valB) return 0;
                if (valA == null) return 1;
                if (valB == null) return -1;
                const compare = valA < valB ? -1 : 1;
                return sortConfig.direction === 'asc' ? compare : -compare;
            });
        } else {
            // Stable sort by SKU -> Name -> ID
            result.sort((a, b) => {
                const skuRes = (a.sku || '').localeCompare(b.sku || '');
                if (skuRes !== 0) return skuRes;
                const nameRes = (a.nameEs || a.name || '').localeCompare(b.nameEs || b.name || '');
                if (nameRes !== 0) return nameRes;
                return (a.id || '').localeCompare(b.id || '');
            });
        }

        const phantomRow = {
            id: 'new-phantom',
            ...phantomData,
            status: phantomData.status || 'available',
            isPhantom: true
        };
        return [phantomRow, ...result];
    }, [dbProducts, searchQuery, sortConfig, phantomData, optimisticValues]);

    const [history, setHistory] = useState<{ id: string; col: string; val: any }[]>([]);

    // SELECTION RECONCILIATION: Keep selection locked to the same product when list changes
    useEffect(() => {
        if (!selectedCell || !selectedProductId) return;

        const newIndex = processedProducts.findIndex(p => p.id === selectedProductId);

        if (newIndex !== -1 && newIndex !== selectedCell.rowIndex) {
            // Product moved to a different index, update selection to follow it
            setSelectedCell(prev => prev ? { ...prev, rowIndex: newIndex } : null);
        } else if (newIndex === -1) {
            // Product no longer in filtered list, clear selection
            setSelectedCell(null);
            setSelectedProductId(null);
        }
    }, [processedProducts, selectedProductId]); // Removed selectedCell to prevent loops

    useEffect(() => {
        stateRef.current = { selectedCell, selectedProductId, editValue, processedProducts, isEditing, phantomData, history };
    }, [selectedCell, selectedProductId, editValue, processedProducts, isEditing, phantomData, history]);

    const commitSave = useCallback(async (cell: CellPosition, value: any, addToHistory = true) => {
        const { processedProducts: prods, phantomData: pData, selectedProductId: currentSelectedId } = stateRef.current;

        // CRITICAL FIX: Lookup product by ID to avoid rowIndex instability during sorts/filters
        let product: any;
        if (currentSelectedId) {
            product = prods.find(p => p.id === currentSelectedId);
            if (!product) {
                console.warn('commitSave: Selected product not found in current view:', currentSelectedId);
                toast.error('Producto no encontrado. Puede estar filtrado.');
                return;
            }
        } else {
            // Fallback for legacy calls without product ID tracking
            product = prods[cell.rowIndex];
            if (!product) {
                console.warn('commitSave: No product at rowIndex', cell.rowIndex);
                return;
            }
        }

        const column = EDITABLE_COLUMNS.find(col => col.key === cell.columnKey);
        if (!column || !column.editable) return;

        const newValue = column.type === 'number' ? parseFloat(value) || 0 : value;

        if (product.id === 'new-phantom') {
            const updatedPhantom = { ...pData, [cell.columnKey]: newValue };
            setPhantomData(updatedPhantom);
            if (updatedPhantom.sku || updatedPhantom.nameEs || updatedPhantom.nameEn) {
                try {
                    setPendingSaves(prev => new Set(prev).add('new-phantom'));
                    const res = await fetch('/api/inventory/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedPhantom) });
                    const data = await res.json();
                    if (data.status === 'success') {
                        toast.success('Producto Creado');
                        await refresh();
                        setPhantomData({});
                        fetchNextIds();
                    }
                } catch (e) { console.error(e); }
                finally { setPendingSaves(prev => { const n = new Set(prev); n.delete('new-phantom'); return n; }); }
            }
            return;
        }

        if ((product as any)[cell.columnKey] === newValue) return;

        // HISTORY TRACKING
        if (addToHistory) {
            setHistory(prev => [...prev, { id: product.id, col: cell.columnKey, val: (product as any)[cell.columnKey] }]);
        }

        // OPTIMISTIC UPDATE START
        setOptimisticValues(prev => ({
            ...prev,
            [product.id]: { ...(prev[product.id] || {}), [cell.columnKey]: newValue }
        }));
        // OPTIMISTIC UPDATE END

        setPendingSaves(prev => new Set(prev).add(product.id));
        try {
            const res = await fetch('/api/inventory/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, [cell.columnKey]: newValue }) });
            const data = await res.json();

            if (data.status === 'success' && data.product) {
                // Update local cache efficiently without full re-fetch
                updateProduct(product.id, data.product);
            } else {
                throw new Error(data.message || 'Update failed');
            }

            // Clear optimistic value after successful save
            setOptimisticValues(prev => {
                const next = { ...prev };
                if (next[product.id]) {
                    delete next[product.id][cell.columnKey];
                    if (Object.keys(next[product.id]).length === 0) delete next[product.id];
                }
                return next;
            });
        } catch (error) {
            toast.error('Error al guardar');
            // Revert optimistic on error
            setOptimisticValues(prev => {
                const next = { ...prev };
                if (next[product.id]) {
                    delete next[product.id][cell.columnKey];
                    if (Object.keys(next[product.id]).length === 0) delete next[product.id];
                }
                return next;
            });
        }
        finally { setPendingSaves(prev => { const n = new Set(prev); n.delete(product.id); return n; }); }
    }, [fetchNextIds, updateProduct, selectedProductId]); // Added selectedProductId dependency

    const revertEdit = useCallback(() => {
        const { selectedCell: sel, processedProducts: prods } = stateRef.current;
        if (!sel) return;
        const product = prods[sel.rowIndex];
        if (product) setEditValue((product as any)[sel.columnKey] ?? '');
        setIsEditing(false);
    }, []);

    const handleUndo = useCallback(() => {
        const { history, processedProducts: prods } = stateRef.current;
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];
        const targetRowIndex = prods.findIndex(p => p.id === lastAction.id);

        if (targetRowIndex !== -1) {
            commitSave({ rowIndex: targetRowIndex, columnKey: lastAction.col }, lastAction.val, false);
            setHistory(prev => prev.slice(0, -1));
            toast.success('Deshacer');
        }
    }, [commitSave]);

    const handleSelect = useCallback((productId: string, columnKey: string, currentValue: any, startEditing = false, mode: 'click' | 'doubleclick' | 'type' = 'click') => {
        const prods = stateRef.current.processedProducts;
        const rowIndex = prods.findIndex(p => p.id === productId);

        if (rowIndex === -1) {
            console.warn('handleSelect: Product not found:', productId);
            return;
        }

        const product = prods[rowIndex];
        setSelectedCell({ rowIndex, columnKey });
        setSelectedProductId(productId);
        setEditValue(currentValue ?? '');
        setIsEditing(startEditing);
        if (startEditing) setEditStartMode(mode);
    }, []);

    const handleSaveAndMove = useCallback((direction: 'down' | 'right', committedValue?: any) => {
        const { selectedCell: sel, editValue: eVal, processedProducts: prods } = stateRef.current;
        if (!sel) return;

        const finalValue = committedValue !== undefined ? committedValue : eVal;
        commitSave(sel, finalValue);

        setIsEditing(false);
        const currentColumnIndex = EDITABLE_COLUMNS.findIndex(col => col.key === sel.columnKey);
        let nextRow = sel.rowIndex + (direction === 'down' ? 1 : 0);
        let nextCol = currentColumnIndex + (direction === 'right' ? 1 : 0);

        if (nextRow >= prods.length) nextRow = prods.length - 1;
        if (nextCol >= EDITABLE_COLUMNS.length) nextCol = EDITABLE_COLUMNS.length - 1;

        const nextColumn = EDITABLE_COLUMNS[nextCol];
        const nextProduct = prods[nextRow];
        setSelectedCell({ rowIndex: nextRow, columnKey: nextColumn.key });
        setEditValue((nextProduct as any)[nextColumn.key] ?? '');
    }, [commitSave]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnKey: string, forceCommit = false, forceTab = false, committedValue?: any) => {
        if (forceCommit) { handleSaveAndMove('down', committedValue); return; }
        if (forceTab) { handleSaveAndMove('right', committedValue); return; }

        const moveSelection = (rowDelta: number, colDelta: number) => {
            const { processedProducts: prods } = stateRef.current;
            e.preventDefault();
            const currentColumnIndex = EDITABLE_COLUMNS.findIndex(col => col.key === columnKey);
            let nextRow = Math.min(Math.max(0, rowIndex + rowDelta), prods.length - 1);
            let nextCol = Math.min(Math.max(0, currentColumnIndex + colDelta), EDITABLE_COLUMNS.length - 1);
            const nextColumn = EDITABLE_COLUMNS[nextCol];
            setSelectedCell({ rowIndex: nextRow, columnKey: nextColumn.key });
            setEditValue((prods[nextRow] as any)[nextColumn.key] ?? '');
        };

        if (e.key === 'ArrowUp') moveSelection(-1, 0);
        else if (e.key === 'ArrowDown') moveSelection(1, 0);
        else if (e.key === 'ArrowLeft') moveSelection(0, -1);
        else if (e.key === 'ArrowRight') moveSelection(0, 1);
        else if (e.key === 'Enter') { e.preventDefault(); moveSelection(1, 0); }
        else if (e.key === 'F2') {
            const col = EDITABLE_COLUMNS.find(c => c.key === columnKey);
            if (col?.editable) { setIsEditing(true); setEditStartMode('doubleclick'); }
        }
        // UNDO (Ctrl+Z / Cmd+Z)
        else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        }
        // DELETE (Delete / Backspace)
        else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            const col = EDITABLE_COLUMNS.find(c => c.key === columnKey);
            if (col?.editable) {
                commitSave({ rowIndex, columnKey }, '', true); // Clear and add to history
                toast.success('Borrado');
            }
        }
        // COPY (Ctrl+C / Cmd+C)
        else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            const { processedProducts: prods } = stateRef.current;
            const product = prods[rowIndex];
            const val = (product as any)[columnKey];
            if (val != null) {
                navigator.clipboard.writeText(String(val));
                toast.success('Copiado');
            }
        }
        // CUT (Ctrl+X / Cmd+X)
        else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
            e.preventDefault();
            const { processedProducts: prods } = stateRef.current;
            const product = prods[rowIndex];
            const col = EDITABLE_COLUMNS.find(c => c.key === columnKey);
            if (col?.editable) {
                const val = (product as any)[columnKey];
                if (val != null) navigator.clipboard.writeText(String(val));
                commitSave({ rowIndex, columnKey }, '', true); // Save empty string and add to history
                toast.success('Cortado');
            }
        }
        // PASTE (Ctrl+V / Cmd+V)
        else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            const { processedProducts: prods } = stateRef.current;
            const col = EDITABLE_COLUMNS.find(c => c.key === columnKey);
            if (col?.editable) {
                navigator.clipboard.readText().then(text => {
                    if (text) {
                        commitSave({ rowIndex, columnKey }, text.trim()); // Trim whitespace
                        toast.success('Pegado');
                    }
                }).catch(err => toast.error('Error al pegar'));
            }
        }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const { isEditing: isEd } = stateRef.current;
            if (isEd) return;
            const col = EDITABLE_COLUMNS.find(c => c.key === columnKey);
            if (col?.editable && col.type !== 'select') { setIsEditing(true); setEditStartMode('type'); setEditValue(e.key); }
        }
    }, [handleSaveAndMove, commitSave, handleUndo]);

    const tableContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className="h-screen flex flex-col bg-white dark:bg-zinc-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden"
            onKeyDown={(e) => {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
                const { selectedCell: sel, isEditing: isEd } = stateRef.current;
                if (!sel) return;
                if (!isEd) handleKeyDown(e as any, sel.rowIndex, sel.columnKey);
            }}
            tabIndex={0}
        >
            <div className="flex-none px-6 py-4 flex items-center justify-between z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-6">
                    <Link href="/inventory" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </Link>
                    <div>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{processedProducts.length - 1} PRODUCTOS</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filtrar..."
                            className="w-64 pl-9 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-900 rounded-md border-transparent focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-2" />

                    <div className="flex bg-gray-100 dark:bg-zinc-900 rounded-md p-0.5">
                        <button onClick={() => handleZoom(-8)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm text-gray-500"><ZoomOut className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleZoom('reset')} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm text-gray-500"><RotateCcw className="w-3 h-3" /></button>
                        <button onClick={() => handleZoom(8)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm text-gray-500"><ZoomIn className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {pendingSaves.size > 0 ? 'SAVING...' : ''}
                    </div>
                </div>
            </div>

            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto relative custom-scrollbar"
                // Initial styles
                style={{
                    '--img-size': '32px',
                    '--font-size': '11px'
                } as React.CSSProperties}
            >
                <div className="relative">
                    <SelectionOverlay
                        selectedCell={selectedCell}
                        isEditing={isEditing}
                        editValue={editValue}
                        onSave={(val: any) => commitSave(selectedCell!, val)}
                        onConfirm={(val: any) => { commitSave(selectedCell!, val); setIsEditing(false); }}
                        onRevert={revertEdit}
                        onKeyDown={handleKeyDown}
                        uniqueValues={uniqueValues}
                        containerRef={tableContainerRef}
                        imgSizeRef={zoomRef}
                    />
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-30 bg-white dark:bg-zinc-950">
                            <tr>
                                <th className="sticky left-0 top-0 z-40 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-white/10 px-3 py-2 w-[40px]" />
                                <th className="sticky left-[40px] top-0 z-40 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-white/10 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left" style={{ minWidth: 'calc(var(--img-size) + 16px)' }}>Img</th>
                                {EDITABLE_COLUMNS.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => setSortConfig({ key: col.key, direction: sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                        className="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left border-b border-gray-200 dark:border-white/10 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none whitespace-nowrap"
                                        style={{ width: col.width, minWidth: col.width }}
                                    >
                                        <div className={`flex items-center gap-1 ${col.type === 'number' ? 'justify-end' : ''}`}>
                                            {col.label}
                                            {sortConfig?.key === col.key && <span className="text-blue-500 text-[9px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-950">
                            {isLoading && processedProducts.length === 1 ? (
                                <tr><td colSpan={EDITABLE_COLUMNS.length + 2} className="py-20 text-center text-gray-400 text-sm">Loading dataset...</td></tr>
                            ) : (
                                processedProducts.map((product, rowIndex) => (
                                    <Row
                                        key={product.id}
                                        product={product}
                                        rowIndex={rowIndex}
                                        isPending={pendingSaves.has(product.id)}
                                        onSelect={handleSelect}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex-none bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/5 py-2 px-6 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <div className="flex gap-4">
                    <span><kbd className="font-sans border border-gray-200 dark:border-white/10 rounded px-1">↵</kbd> Edit</span>
                    <span><kbd className="font-sans border border-gray-200 dark:border-white/10 rounded px-1">Tab</kbd> Next</span>
                    <span><kbd className="font-sans border border-gray-200 dark:border-white/10 rounded px-1">Esc</kbd> Cancel</span>
                </div>
                <div />
            </div>
        </div>
    );
}
