'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import toast from 'react-hot-toast'; // or react-hot-toast

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [isExporting, setIsExporting] = useState(false);

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
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
                    <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-[#1C1C1E]">
                        Export to InDesign
                    </Dialog.Title>
                    <div className="grid gap-4 py-4">

                        {/* Time Range */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Time Range</label>
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
                                                : 'bg-white text-[#1C1C1E] border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Look & Feel (Sort Order)</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name">Alphabetical (A-Z)</option>
                                <option value="newest">Newest First</option>
                                <option value="stock">Highest Stock First</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Stock Status</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="all">Any Status</option>
                                <option value="in-stock">In Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                                <option value="low-stock">Low Stock</option>
                            </select>
                        </div>

                        {/* Category Filter - Hardcoded for simplicity, could be dynamic */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-[#1C1C1E]">Category</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="Marmol">Marmol</option>
                                <option value="Granito">Granito</option>
                                <option value="Cuarzo">Cuarzo</option>
                                <option value="Onix">Onix</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
