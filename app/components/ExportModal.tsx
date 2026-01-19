'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import toast from 'react-hot-toast'; // or react-hot-toast

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters?: {
        category?: string;
        sortBy?: string;
    };
    availableCategories?: (string | null)[];
}

export default function ExportModal({ isOpen, onClose, initialFilters, availableCategories = [] }: ExportModalProps) {
    const [category, setCategory] = useState(initialFilters?.category || 'all');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [sortBy, setSortBy] = useState(initialFilters?.sortBy === 'stock-desc' ? 'stock' : 'newest'); // Map inventory sort to export sort
    const [isExporting, setIsExporting] = useState(false);

    // Sync with props when opening
    useEffect(() => {
        if (isOpen && initialFilters) {
            setCategory(initialFilters.category || 'all');
            // Check if sortBy maps correctly
            if (initialFilters.sortBy === 'stock-desc') setSortBy('stock');
            else if (initialFilters.sortBy === 'name-asc') setSortBy('name');
            else setSortBy('newest');
        }
    }, [isOpen, initialFilters]);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading('Generating export package...');

        try {
            // Build URL with params
            const params = new URLSearchParams({
                category,
                status,
                dateRange,
                sortBy
            });

            const response = await fetch(`/api/export/indesign?${params.toString()}`);

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Download started!', { id: toastId });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Export failed. Please try again.', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
                    <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-[#1C1C1E] dark:text-white">
                        Export to InDesign
                    </Dialog.Title>
                    <div className="grid gap-4 py-4">

                        {/* Time Range */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-[#1C1C1E] dark:text-gray-300">Time Range</label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'all', label: 'All Time' },
                                    { id: '30d', label: 'Last 30 Days' },
                                    { id: '7d', label: 'Last 7 Days' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDateRange(opt.id)}
                                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${dateRange === opt.id
                                            ? 'bg-[#007AFF] text-white border-[#007AFF]'
                                            : 'bg-white dark:bg-zinc-800 text-[#1C1C1E] dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <CustomSelect
                            label="Look & Feel (Sort Order)"
                            value={sortBy}
                            onValueChange={setSortBy}
                            options={[
                                { value: 'name', label: 'Alphabetical (A-Z)' },
                                { value: 'newest', label: 'Newest First' },
                                { value: 'stock', label: 'Highest Stock First' }
                            ]}
                        />

                        <CustomSelect
                            label="Stock Status"
                            value={status}
                            onValueChange={setStatus}
                            options={[
                                { value: 'all', label: 'Any Status' },
                                { value: 'in-stock', label: 'In Stock' },
                                { value: 'out-of-stock', label: 'Out of Stock' },
                                { value: 'low-stock', label: 'Low Stock' }
                            ]}
                        />

                        <CustomSelect
                            label="Category"
                            value={category}
                            onValueChange={setCategory}
                            options={[
                                { value: 'all', label: 'All Categories' },
                                ...(availableCategories && availableCategories.length > 0 ? availableCategories.map(cat => ({
                                    value: cat || '',
                                    label: cat || 'Uncategorized'
                                })) : [
                                    { value: 'Marmol', label: 'Marmol' },
                                    { value: 'Granito', label: 'Granito' },
                                    { value: 'Cuarzo', label: 'Cuarzo' },
                                    { value: 'Onix', label: 'Onix' },
                                    { value: 'Otros', label: 'Otros' }
                                ])
                            ]}
                        />

                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-[#007AFF] hover:bg-[#007AFF]/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Download Assets'
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// Helper component for Select
function CustomSelect({ label, value, onValueChange, options }: { label: string, value: string, onValueChange: (v: string) => void, options: { value: string, label: string }[] }) {

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300 ml-1">{label}</label>
            <Select.Root value={value} onValueChange={onValueChange}>
                <Select.Trigger className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all cursor-pointer font-medium data-[placeholder]:text-gray-400">
                    <Select.Value>{selectedLabel}</Select.Value>
                    <Select.Icon className="text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content position="popper" className="overflow-hidden bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-[60] w-[var(--radix-select-trigger-width)] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1">
                        <Select.Viewport className="p-1">
                            {options.map((option) => (
                                <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <Select.ItemIndicator>
                                            <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </Select.ItemIndicator>
                                    </span>
                                    <Select.ItemText>{option.label}</Select.ItemText>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </div>
    );
}
