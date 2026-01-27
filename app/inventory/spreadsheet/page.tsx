'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRealtimeInventory } from '@/app/hooks/useRealtimeInventory';
import toast from 'react-hot-toast';

// --- TYPES ---
interface CellPosition {
    rowIndex: number;
    columnKey: string;
}

// --- CONFIG ---
const EDITABLE_COLUMNS = [
    { key: 'photoId', label: 'Photo ID', width: 80, editable: false },
    { key: 'sku', label: 'SKU', width: 120, editable: false },
    { key: 'nameEs', label: 'Nombre Español', width: 250, editable: true },
    { key: 'nameEn', label: 'Nombre Inglés', width: 250, editable: true },
    { key: 'barcode', label: 'Barcode', width: 130, editable: true },
    { key: 'category', label: 'Categoría', width: 140, editable: true, type: 'select', autoValues: true },
    { key: 'montaje', label: 'Montaje', width: 140, editable: true, type: 'select', autoValues: true },
    { key: 'tipo', label: 'Tipo', width: 120, editable: true, type: 'select', autoValues: true },
    { key: 'status', label: 'Status', width: 120, editable: true, type: 'select', options: ['available', 'out-of-stock', 'low-stock'] },

    // Precios y Costos
    { key: 'priceZG', label: '$ ZG (Fab)', width: 90, editable: true, type: 'number' },
    { key: 'priceOth', label: '$ OTH (Comp)', width: 90, editable: true, type: 'number' },
    { key: 'priceBM', label: '$ BM', width: 90, editable: true, type: 'number' },
    { key: 'ptijDll', label: '$ PTIJ (USD)', width: 100, editable: true, type: 'number' },
    { key: 'ptijMxn', label: '$ PTIJ (MXN)', width: 100, editable: true, type: 'number' },
    { key: 'vecesG', label: 'Veces G', width: 80, editable: true, type: 'number' },

    { key: 'price', label: '$ Venta', width: 100, editable: true, type: 'number' },

    // Stocks
    { key: 'stock', label: 'Stock Sist.', width: 90, editable: true, type: 'number' },
    { key: 'physicalStock', label: 'Stock Físico', width: 100, editable: true, type: 'number' },

    { key: 'notes', label: 'Notas', width: 200, editable: true },
];

// --- SUB-COMPONENTS ---

// Memoized Cell Component
const Cell = memo(({
    value,
    column,
    isSelected,
    isEditing,
    rowIndex,
    onSave, // Trigger save
    onRevert, // Trigger cancel/revert
    onSelect,
    onKeyDown,
    onEditValueChange,
    globalEditValue,
    uniqueValues,
    editStartMode // 'click', 'type', 'doubleclick' -> To decide auto-select behavior
}: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const cellRef = useRef<HTMLTableDataCellElement>(null);

    // Focus management logic
    useEffect(() => {
        if (isSelected) {
            if (isEditing) {
                // Focus Logic for Edit Mode
                if (column.type === 'select') {
                    selectRef.current?.focus();
                } else if (inputRef.current) {
                    inputRef.current.focus();
                    // BEHAVIORAL LOGIC:
                    // If start mode was 'click' -> Select All text (replace mode)
                    // If start mode was 'doubleclick' -> Cursor at end (append mode) - Browser default usually
                    // If start mode was 'type' -> Value was replaced already, usually cursor at end.

                    if (editStartMode === 'click') {
                        inputRef.current.select();
                    }
                }
            } else {
                // Focus Logic for Nav Mode
                cellRef.current?.focus();
            }
        }
    }, [isSelected, isEditing, column.type, editStartMode]);

    const displayValue = column.type === 'number' && value != null
        ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : (value || '');

    // RENDER LOGIC

    // Select editing logic
    if (isSelected && isEditing && column.editable && column.type === 'select') {
        const currentValue = isEditing ? globalEditValue : (value || '');
        return (
            <td className="px-4 py-1.5 border-b border-r border-gray-200 dark:border-white/10 relative p-0 ring-2 ring-blue-500 ring-inset z-10 bg-white dark:bg-zinc-800">
                <select
                    ref={selectRef}
                    value={currentValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onBlur={() => onSave()}
                    onKeyDown={(e) => {
                        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                            e.preventDefault();
                            onKeyDown(e, rowIndex, column.key);
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            onKeyDown(e, rowIndex, column.key, true);
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            onRevert();
                        }
                    }}
                    className="w-full h-full bg-transparent outline-none appearance-none px-4 text-[13px] text-gray-900 dark:text-gray-200"
                >
                    <option value="">-</option>
                    {column.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    {column.autoValues && uniqueValues[column.key]?.map((val: string) => <option key={val} value={val}>{val}</option>)}
                </select>
            </td>
        );
    }

    // Input editing logic
    if (isSelected && isEditing && column.editable) {
        return (
            <td className="px-4 py-1.5 border-b border-r border-gray-200 dark:border-white/10 relative p-0 ring-2 ring-blue-500 ring-inset z-10 bg-white dark:bg-zinc-800">
                <input
                    ref={inputRef}
                    type={column.type === 'number' ? 'number' : 'text'}
                    value={globalEditValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onBlur={() => onSave()}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            onRevert();
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            onKeyDown(e, rowIndex, column.key, true);
                        } else if (e.key === 'Tab') {
                            e.preventDefault();
                            onKeyDown(e, rowIndex, column.key, false, true);
                        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            // Prevent number increment and navigate
                            e.preventDefault();
                            onKeyDown(e, rowIndex, column.key);
                        }
                    }}
                    className="w-full h-full bg-transparent outline-none px-4 text-[13px] font-medium text-gray-900 dark:text-white"
                    step={column.type === 'number' ? '0.01' : undefined}
                />
            </td>
        );
    }

    return (
        <td
            ref={cellRef}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(rowIndex, column.key, value, column.type === 'select', 'click')}
            onDoubleClick={() => onSelect(rowIndex, column.key, value, true, 'doubleclick')}
            onKeyDown={(e) => isSelected ? onKeyDown(e, rowIndex, column.key) : undefined}
            className={`px-4 py-1.5 text-[13px] border-b border-r border-gray-200 dark:border-white/10 relative outline-none truncate select-none
                ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10 bg-blue-50/50 dark:bg-blue-900/20' : ''}
                ${!column.editable ? 'text-gray-500 bg-gray-50/50 dark:bg-white/5' : 'text-gray-700 dark:text-gray-200'}
                ${column.type === 'number' ? 'text-right font-mono' : ''}
            `}
        >
            {displayValue}
        </td>
    );
}, (prev, next) => {
    // Re-render check
    const isEditingPropsChanged = prev.isSelected !== next.isSelected || prev.isEditing !== next.isEditing || prev.value !== next.value;
    const isFocusedSelect = next.isSelected && next.column.type === 'select';

    if ((next.isEditing || isFocusedSelect) && prev.globalEditValue !== next.globalEditValue) return false;
    if (isEditingPropsChanged) return false;

    return true;
});

Cell.displayName = 'Cell';

const Row = memo(({ product, rowIndex, selectedColKey, isEditing, globalEditValue, onSelect, onSave, onRevert, onEditValueChange, onKeyDown, uniqueValues, isPending, editStartMode }: any) => {
    return (
        <tr
            className={`hover:bg-blue-50/10 dark:hover:bg-blue-900/5 transition-colors ${product.isPhantom ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}
            style={{ opacity: isPending ? 0.6 : 1 }}
        >
            <td className="sticky left-0 bg-white dark:bg-zinc-900 px-4 py-2 text-[12px] text-gray-400 dark:text-gray-500 border-b border-r border-gray-200 dark:border-white/10 font-mono z-20 w-[50px] text-center">
                {product.isPhantom ? '+' : rowIndex}
            </td>
            <td className="sticky left-[50px] bg-white dark:bg-zinc-900 px-2 py-2 border-b border-r border-gray-200 dark:border-white/10 z-20 w-[40px] text-center">
                {!product.isPhantom && (
                    <Link
                        href={`/inventory/${product.id}`}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-700 flex justify-center"
                        tabIndex={-1}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                )}
            </td>
            {EDITABLE_COLUMNS.map((column) => (
                <Cell
                    key={column.key}
                    column={column}
                    value={(product as any)[column.key]}
                    rowIndex={rowIndex}
                    isSelected={selectedColKey === column.key}
                    isEditing={isEditing}
                    globalEditValue={globalEditValue}
                    onSelect={onSelect}
                    onSave={onSave}
                    onRevert={onRevert}
                    onEditValueChange={onEditValueChange}
                    onKeyDown={onKeyDown}
                    uniqueValues={uniqueValues}
                    editStartMode={editStartMode}
                />
            ))}
        </tr>
    );
}, (prev, next) => {
    if (prev.product !== next.product) return false;
    if (prev.isPending !== next.isPending) return false;
    if (prev.selectedColKey !== next.selectedColKey) return false;

    if (next.selectedColKey !== null) {
        if (prev.isEditing !== next.isEditing) return false;
        if (prev.globalEditValue !== next.globalEditValue) return false;
        if (prev.editStartMode !== next.editStartMode) return false;
    }

    return true;
});

Row.displayName = 'Row';


// --- MAIN PAGE ---

export default function SpreadsheetPage() {
    const { products: dbProducts, isLoading, isConnected, refresh } = useRealtimeInventory();

    const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editStartMode, setEditStartMode] = useState<'click' | 'doubleclick' | 'type'>('click');

    const [editValue, setEditValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingSaves, setPendingSaves] = useState(new Set<string>());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const uniqueValues = useMemo(() => {
        if (!dbProducts) return { category: [], montaje: [], tipo: [] };

        const extractUnique = (key: string) =>
            Array.from(new Set(dbProducts.map(p => (p as any)[key]).filter(Boolean))).sort();

        return {
            category: extractUnique('category') as string[],
            montaje: extractUnique('montaje') as string[],
            tipo: extractUnique('tipo') as string[]
        };
    }, [dbProducts]);

    // PHANTOM ROW STATE
    const [phantomData, setPhantomData] = useState<any>({});

    const fetchNextIds = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/next-id');
            const data = await res.json();
            if (data.status === 'success') {
                setPhantomData((prev: any) => ({
                    ...prev,
                    barcode: data.nextBarcode,
                    photoId: data.nextPhotoId,
                }));
            }
        } catch (e) {
            console.error("Failed to fetch next IDs", e);
        }
    }, []);

    // Initial Fetch of IDs
    useEffect(() => {
        fetchNextIds();
    }, [fetchNextIds]);

    const processedProducts = useMemo(() => {
        // Base list from DB
        let result = dbProducts ? [...dbProducts] : [];

        // 1. FILTER
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(product => {
                return (
                    product.sku?.toLowerCase().includes(query) ||
                    product.nameEs?.toLowerCase().includes(query) ||
                    product.nameEn?.toLowerCase().includes(query) ||
                    product.category?.toLowerCase().includes(query) ||
                    product.barcode?.toLowerCase().includes(query)
                );
            });
        }

        // 2. SORT
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
            // Default stable sort by SKU
            result.sort((a, b) => {
                const valA = a.sku || '';
                const valB = b.sku || '';
                return valA.localeCompare(valB);
            });
        }

        // 3. PREPEND PHANTOM ROW (Always at top, Row 0)
        // Only if not searching? Or always? Usually always visible is better for quick add.
        const phantomRow = {
            id: 'new-phantom',
            sku: phantomData.sku || '',
            nameEs: phantomData.nameEs || '',
            nameEn: phantomData.nameEn || '',
            barcode: phantomData.barcode || '',
            category: phantomData.category || '',
            montaje: phantomData.montaje || '',
            tipo: phantomData.tipo || '',
            status: phantomData.status || 'available',
            priceZG: phantomData.priceZG || 0,
            priceOth: phantomData.priceOth || 0,
            priceBM: phantomData.priceBM || 0,
            ptijDll: phantomData.ptijDll || 0,
            ptijMxn: phantomData.ptijMxn || 0,
            vecesG: phantomData.vecesG || 0,
            price: phantomData.price || 0,
            stock: phantomData.stock || 0,
            physicalStock: phantomData.physicalStock || 0,
            photoId: phantomData.photoId || '',
            notes: phantomData.notes || '',
            isPhantom: true // Flag for UI styling if needed
        };

        return [phantomRow, ...result];

    }, [dbProducts, searchQuery, sortConfig, phantomData]);

    const commitSave = useCallback(async (cell: CellPosition, value: any) => {
        const product = processedProducts[cell.rowIndex];
        if (!product) return;

        const column = EDITABLE_COLUMNS.find(col => col.key === cell.columnKey);
        if (!column || !column.editable) return;

        // PHANTOM ROW LOGIC
        if (product.id === 'new-phantom') {
            // Update local phantom state first
            const newValue = column.type === 'number' ? parseFloat(value) || 0 : value;
            const updatedPhantom = { ...phantomData, [cell.columnKey]: newValue };
            setPhantomData(updatedPhantom);

            // Check if we have enough data to create? 
            // Strategy: Create immediately if Name/SKU is entered? 
            // Or assume user fills cell by cell and we only create on row exit?
            // "Spreadsheet behavior": usually saves line by line.
            // Let's try: Create immediately if critical field (SKU or Name) has content.
            // BUT, if we create immediately, the row "jumps" to invalid while typing other fields if we clear it.
            // BETTER: Update local state. Only CREATE if specific trigger? 
            // No, standard `commitSave` triggers on Blur/Enter. So just try to create on every save.

            if (updatedPhantom.sku || updatedPhantom.nameEs || updatedPhantom.nameEn) {
                try {
                    setPendingSaves(prev => new Set(prev).add('new-phantom'));
                    const res = await fetch('/api/inventory/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedPhantom),
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        toast.success('Producto Creado');
                        await refresh();
                        setPhantomData({}); // Reset phantom row for next entry
                        fetchNextIds(); // Refetch next IDs for the new empty row
                    }
                } catch (e) {
                    // Silent fail if incomplete, just wait for more data
                    console.error(e);
                } finally {
                    setPendingSaves(prev => {
                        const newSet = new Set(prev);
                        newSet.delete('new-phantom');
                        return newSet;
                    });
                }
            }
            return;
        }

        // EXISTING PRODUCT LOGIC
        const currentValue = (product as any)[cell.columnKey];
        const newValue = column.type === 'number' ? parseFloat(value) || 0 : value;

        if (currentValue === newValue) return;

        setPendingSaves(prev => new Set(prev).add(product.id));

        try {
            await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: product.id, [cell.columnKey]: newValue }),
            });
            await refresh();
            toast.success('Guardado', { duration: 800, position: 'bottom-right', id: 'save-success' });
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setPendingSaves(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }
    }, [processedProducts, refresh, phantomData]);

    const revertEdit = useCallback(() => {
        if (!selectedCell) return;
        const product = processedProducts[selectedCell.rowIndex];
        if (product) {
            const originalValue = (product as any)[selectedCell.columnKey];
            setEditValue(originalValue ?? '');
        }
        setIsEditing(false);
    }, [selectedCell, processedProducts]);

    const handleSelect = useCallback((rowIndex: number, columnKey: string, currentValue: any, startEditing = false, mode: 'click' | 'doubleclick' | 'type' = 'click') => {
        setSelectedCell({ rowIndex, columnKey });
        setEditValue(currentValue ?? '');
        setIsEditing(startEditing);
        if (startEditing) {
            setEditStartMode(mode);
        }
    }, []);

    const handleEditValueChange = useCallback((val: string) => {
        setEditValue(val);
    }, []);

    const handleSort = useCallback((key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const handleSaveAndMove = useCallback((direction: 'down' | 'right') => {
        if (!selectedCell) return;
        commitSave(selectedCell, editValue);
        setIsEditing(false); // Exit edit mode

        // Calculate next position
        const rowDelta = direction === 'down' ? 1 : 0;
        const colDelta = direction === 'right' ? 1 : 0;

        const currentColumnIndex = EDITABLE_COLUMNS.findIndex(col => col.key === selectedCell.columnKey);
        let nextRow = selectedCell.rowIndex + rowDelta;
        let nextCol = currentColumnIndex + colDelta;

        if (nextRow >= processedProducts.length) nextRow = processedProducts.length - 1;
        if (nextCol >= EDITABLE_COLUMNS.length) nextCol = EDITABLE_COLUMNS.length - 1;

        const nextColumn = EDITABLE_COLUMNS[nextCol];
        const nextProduct = processedProducts[nextRow];
        const nextValue = (nextProduct as any)[nextColumn.key];

        setSelectedCell({ rowIndex: nextRow, columnKey: nextColumn.key });
        setEditValue(nextValue ?? '');
    }, [selectedCell, editValue, processedProducts, commitSave]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnKey: string, forceCommit = false, forceTab = false) => {

        if (forceCommit) {
            handleSaveAndMove('down');
            return;
        }
        if (forceTab) {
            handleSaveAndMove('right');
            return;
        }

        const moveSelection = (rowDelta: number, colDelta: number) => {
            e.preventDefault();
            const currentColumnIndex = EDITABLE_COLUMNS.findIndex(col => col.key === columnKey);
            let nextRow = rowIndex + rowDelta;
            let nextCol = currentColumnIndex + colDelta;

            if (nextRow < 0) nextRow = 0;
            if (nextRow >= processedProducts.length) nextRow = processedProducts.length - 1;
            if (nextCol < 0) nextCol = 0;
            if (nextCol >= EDITABLE_COLUMNS.length) nextCol = EDITABLE_COLUMNS.length - 1;

            const nextColumn = EDITABLE_COLUMNS[nextCol];
            const nextProduct = processedProducts[nextRow];
            const nextValue = (nextProduct as any)[nextColumn.key];

            setSelectedCell({ rowIndex: nextRow, columnKey: nextColumn.key });
            setEditValue(nextValue ?? '');
        };

        if (e.key === 'ArrowUp') moveSelection(-1, 0);
        else if (e.key === 'ArrowDown') moveSelection(1, 0);
        else if (e.key === 'ArrowLeft') moveSelection(0, -1);
        else if (e.key === 'ArrowRight') moveSelection(0, 1);
        else if (e.key === 'Enter') {
            e.preventDefault();
            moveSelection(1, 0);
        }
        else if (e.key === 'F2') {
            e.preventDefault();
            const column = EDITABLE_COLUMNS.find(col => col.key === columnKey);
            if (column?.editable) {
                setIsEditing(true);
                setEditStartMode('doubleclick'); // F2 behaves like doubleclick (append)
            }
        }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditing) {
            // Quick Type
            const column = EDITABLE_COLUMNS.find(col => col.key === columnKey);
            if (column?.editable && column.type !== 'select') {
                setIsEditing(true);
                setEditStartMode('type');
                setEditValue(e.key);
            }
        }
    }, [processedProducts, isEditing, handleSaveAndMove]);

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-zinc-950 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="flex-none bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 z-30">
                <div className="px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/inventory" className="text-blue-600 dark:text-blue-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Editor Maestro</h1>
                    </div>
                    {/* ... Status and counts ... */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">
                            {isConnected ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-9 pr-4 py-1.5 rounded-md bg-white dark:bg-zinc-800 text-sm border border-gray-300 dark:border-white/10"
                        />
                    </div>
                    <div className="text-[12px] text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                        {processedProducts.length} items
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 relative" ref={tableContainerRef}>
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[#F2F2F7] dark:bg-zinc-800 z-30 shadow-sm ring-1 ring-black/5">
                        <tr>
                            <th className="sticky left-0 bg-[#F2F2F7] dark:bg-zinc-800 px-4 py-2 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-r border-gray-200 dark:border-white/10 w-[50px] z-40">#</th>
                            <th className="sticky left-[50px] bg-[#F2F2F7] dark:bg-zinc-800 px-2 py-2 border-b border-r border-gray-200 dark:border-white/10 w-[40px] z-40"></th>
                            {EDITABLE_COLUMNS.map((column) => (
                                <th
                                    key={column.key}
                                    onClick={() => handleSort(column.key)}
                                    className="px-4 py-2 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-white/10 whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 select-none"
                                    style={{ width: column.width, minWidth: column.width }}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.label}
                                        {sortConfig?.key === column.key && (
                                            <span className="text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                        {column.editable && <span className="text-gray-300/50 text-[10px] ml-auto">✎</span>}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && processedProducts.length === 0 ? (
                            <tr><td colSpan={EDITABLE_COLUMNS.length + 1} className="p-10 text-center">Cargando...</td></tr>
                        ) : (
                            processedProducts.map((product, rowIndex) => (
                                <Row
                                    key={product.id}
                                    product={product}
                                    rowIndex={rowIndex}
                                    selectedColKey={selectedCell?.rowIndex === rowIndex ? selectedCell.columnKey : null}
                                    isEditing={isEditing}
                                    editStartMode={editStartMode}
                                    globalEditValue={editValue}
                                    onSelect={handleSelect}
                                    onSave={() => commitSave(selectedCell!, editValue)}
                                    onRevert={revertEdit}
                                    onEditValueChange={handleEditValueChange}
                                    onKeyDown={(e: any) => {
                                        if (isEditing) {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSaveAndMove('down');
                                            } else if (e.key === 'Tab') {
                                                e.preventDefault();
                                                handleSaveAndMove('right');
                                            } else if (e.key === 'Escape') {
                                                e.preventDefault();
                                                revertEdit();
                                            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                                // Allow navigation if the cell explicitly bubbled the event (like Selects)
                                                handleKeyDown(e, rowIndex, selectedCell?.columnKey || '');
                                            }
                                        } else {
                                            handleKeyDown(e, rowIndex, selectedCell?.columnKey || '');
                                        }
                                    }}
                                    uniqueValues={uniqueValues}
                                    isPending={pendingSaves.has(product.id)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex-none bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-white/5 py-2 px-4 text-[11px] text-gray-500 flex justify-between items-center z-30">
                <div className="flex gap-4">
                    <span><strong>Flechas:</strong> Mover</span>
                    <span><strong>Click / Teclas:</strong> Editar</span>
                    <span><strong>Esc:</strong> Cancelar</span>
                </div>
                <div>
                    {pendingSaves.size > 0 ? 'Guardando...' : 'Listo'}
                </div>
            </div>
        </div>
    );
}
