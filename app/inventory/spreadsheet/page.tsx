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
    { key: 'nameEs', label: 'Nombre Español', width: 220, editable: true },
    { key: 'nameEn', label: 'Nombre Inglés', width: 220, editable: true },
    { key: 'barcode', label: 'Barcode', width: 130, editable: true },
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

const SelectionOverlay = memo(({ selectedCell, isEditing, editValue, onSave, onRevert, onKeyDown, onEditValueChange, uniqueValues, containerRef, imgSize }: any) => {
    const [localValue, setLocalValue] = useState(editValue);
    const overlayRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

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

        // AUTO-SCROLL LOGIC: Ensure cell is in viewport of the container
        const container = containerRef.current;
        const scrollPadding = 40; // Maintain some visibility around the cell
        const headerHeight = 40; // Approximate height of sticky header to avoid overlap

        const cellTop = cellDom.offsetTop;
        const cellBottom = cellTop + cellDom.offsetHeight;
        const cellLeft = cellDom.offsetLeft;
        const cellRight = cellLeft + cellDom.offsetWidth;

        const viewportTop = container.scrollTop + headerHeight;
        const viewportBottom = container.scrollTop + container.clientHeight;
        const viewportLeft = container.scrollLeft + 40 + (imgSize + 16); // Account for sticky index + image col
        const viewportRight = container.scrollLeft + container.clientWidth;

        // Vertical scroll
        if (cellTop < viewportTop) {
            container.scrollTop = cellTop - headerHeight - scrollPadding;
        } else if (cellBottom > viewportBottom) {
            container.scrollTop = cellBottom - container.clientHeight + scrollPadding;
        }

        // Horizontal scroll
        if (cellLeft < viewportLeft) {
            container.scrollLeft = cellLeft - 40 - (imgSize + 16) - scrollPadding;
        } else if (cellRight > viewportRight) {
            container.scrollLeft = cellRight - container.clientWidth + scrollPadding;
        }

        if (isEditing) {
            setTimeout(() => {
                inputRef.current?.focus();
                selectRef.current?.focus();
            }, 0);
        }
    }, [selectedCell, isEditing, containerRef, imgSize]);

    if (!selectedCell) return null;

    const column = EDITABLE_COLUMNS.find(c => c.key === selectedCell.columnKey);
    if (!column) return null;

    return (
        <div
            ref={overlayRef}
            className={`absolute pointer-events-none z-30 ring-2 ring-blue-500 bg-blue-50/10`}
            style={{ display: 'none' }}
        >
            {isEditing && column.editable && (
                <div className="w-full h-full pointer-events-auto bg-white dark:bg-zinc-800">
                    {column.type === 'select' ? (
                        <select
                            ref={selectRef}
                            value={localValue}
                            onChange={(e) => { setLocalValue(e.target.value); if (column.key === 'status') onSave(e.target.value); }}
                            onBlur={() => onSave(localValue)}
                            className="w-full h-full bg-transparent outline-none px-3 text-[12px] appearance-none"
                        >
                            <option value="">-</option>
                            {column.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            {column.autoValues && uniqueValues[column.key]?.map((val: string) => <option key={val} value={val}>{val}</option>)}
                        </select>
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
                            className={`w-full h-full bg-transparent outline-none px-3 text-[12px] ${column.type === 'number' ? 'text-right' : ''}`}
                        />
                    )}
                </div>
            )}
        </div>
    );
});
SelectionOverlay.displayName = 'SelectionOverlay';

const Row = memo(({ product, rowIndex, imgSize, isPending, onSelect }: any) => {
    return (
        <tr
            className={`group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${product.isPhantom ? 'bg-yellow-50/30 dark:bg-yellow-500/5' : ''}`}
            style={{ opacity: isPending ? 0.6 : 1 }}
        >
            <td className="sticky left-0 bg-white group-hover:bg-gray-50 dark:bg-zinc-900 dark:group-hover:bg-zinc-900 px-3 py-1.5 text-[10px] text-gray-400 border-b border-gray-100 dark:border-white/5 font-mono z-20 w-[40px] text-center select-none">
                {product.isPhantom ? '+' : rowIndex + 1}
            </td>

            <td className="sticky left-[40px] bg-white group-hover:bg-gray-50 dark:bg-zinc-900 dark:group-hover:bg-zinc-900 border-b border-gray-100 dark:border-white/5 z-20 p-1" style={{ width: imgSize + 16, minWidth: imgSize + 16 }}>
                {!product.isPhantom && (
                    <div className="relative group/img" style={{ width: imgSize, height: imgSize, margin: '0 auto' }}>
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

                return (
                    <td
                        key={column.key}
                        id={`cell-${rowIndex}-${column.key}`}
                        onClick={() => onSelect(rowIndex, column.key, value, false, 'click')}
                        onDoubleClick={() => onSelect(rowIndex, column.key, value, true, 'doubleclick')}
                        className={`px-3 py-1.5 text-[12px] border-b border-gray-100 dark:border-white/5 relative outline-none truncate select-none hover:bg-blue-50/10 dark:hover:bg-blue-500/5 cursor-pointer ${column.type === 'number' ? 'text-right font-mono tabular-nums' : 'text-left'}`}
                    >
                        {displayValue}
                    </td>
                );
            })}
        </tr>
    );
}, (prev, next) => {
    return prev.product === next.product && prev.isPending === next.isPending && prev.imgSize === next.imgSize;
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
    const [imgSize, setImgSize] = useState(32);
    const [pendingSaves, setPendingSaves] = useState(new Set<string>());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // CRITICAL: Ref-based state for callback stability
    const stateRef = useRef({ selectedCell, editValue, processedProducts: [] as any[], isEditing, phantomData: {} as any });

    const uniqueValues = useMemo(() => {
        if (!dbProducts) return { category: [], montaje: [], tipo: [] };
        const extractUnique = (key: string) => Array.from(new Set(dbProducts.map(p => (p as any)[key]).filter(Boolean))).sort();
        return { category: extractUnique('category') as string[], montaje: extractUnique('montaje') as string[], tipo: extractUnique('tipo') as string[] };
    }, [dbProducts]);

    const [phantomData, setPhantomData] = useState<any>({});
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
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(product =>
                ['sku', 'nameEs', 'nameEn', 'category', 'barcode'].some(key => {
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
            result.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
        }

        const phantomRow = {
            id: 'new-phantom',
            ...phantomData,
            status: phantomData.status || 'available',
            isPhantom: true
        };
        return [phantomRow, ...result];
    }, [dbProducts, searchQuery, sortConfig, phantomData]);

    useEffect(() => {
        stateRef.current = { selectedCell, editValue, processedProducts, isEditing, phantomData };
    }, [selectedCell, editValue, processedProducts, isEditing, phantomData]);

    const commitSave = useCallback(async (cell: CellPosition, value: any) => {
        const { processedProducts: prods, phantomData: pData } = stateRef.current;
        const product = prods[cell.rowIndex];
        if (!product) return;
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

        setPendingSaves(prev => new Set(prev).add(product.id));
        try {
            await fetch('/api/inventory/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, [cell.columnKey]: newValue }) });
            await refresh();
        } catch (error) { toast.error('Error al guardar'); }
        finally { setPendingSaves(prev => { const n = new Set(prev); n.delete(product.id); return n; }); }
    }, [refresh, fetchNextIds]);

    const revertEdit = useCallback(() => {
        const { selectedCell: sel, processedProducts: prods } = stateRef.current;
        if (!sel) return;
        const product = prods[sel.rowIndex];
        if (product) setEditValue((product as any)[sel.columnKey] ?? '');
        setIsEditing(false);
    }, []);

    const handleSelect = useCallback((rowIndex: number, columnKey: string, currentValue: any, startEditing = false, mode: 'click' | 'doubleclick' | 'type' = 'click') => {
        setSelectedCell({ rowIndex, columnKey });
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
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const { isEditing: isEd } = stateRef.current;
            if (isEd) return;
            const col = EDITABLE_COLUMNS.find(c => c.key === columnKey);
            if (col?.editable && col.type !== 'select') { setIsEditing(true); setEditStartMode('type'); setEditValue(e.key); }
        }
    }, [handleSaveAndMove]);

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
                        <button onClick={() => setImgSize(s => Math.max(20, s - 8))} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm text-gray-500"><ZoomOut className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setImgSize(32)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm text-gray-500"><RotateCcw className="w-3 h-3" /></button>
                        <button onClick={() => setImgSize(s => Math.min(120, s + 8))} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded shadow-sm text-gray-500"><ZoomIn className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {pendingSaves.size > 0 ? 'SAVING...' : ''}
                    </div>
                </div>
            </div>

            <div
                ref={tableContainerRef}
                className="flex-1 overflow-auto relative custom-scrollbar"
            >
                <div className="relative">
                    <SelectionOverlay
                        selectedCell={selectedCell}
                        isEditing={isEditing}
                        editValue={editValue}
                        onSave={(val: any) => commitSave(selectedCell!, val)}
                        onRevert={revertEdit}
                        onKeyDown={handleKeyDown}
                        uniqueValues={uniqueValues}
                        containerRef={tableContainerRef}
                        imgSize={imgSize}
                    />
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-30 bg-white dark:bg-zinc-950">
                            <tr>
                                <th className="sticky left-0 top-0 z-40 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-white/10 px-3 py-2 w-[40px]" />
                                <th className="sticky left-[40px] top-0 z-40 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-white/10 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left" style={{ minWidth: imgSize + 16 }}>Img</th>
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
                                        imgSize={imgSize}
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
