'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ImageUpload from '@/app/components/ImageUpload';
import { Product, Theme, useProductDetail } from '@/hooks/useProductDetail';
import { Toaster } from 'react-hot-toast';
import { CloudinaryPresets } from '@/lib/cloudinary';
import { canEdit, canCount } from '@/lib/permissions';

interface Props {
    product: Product;
    currentTheme: Theme;
}

export default function ProductDetailDesktop({ product, currentTheme }: Props) {
    const { data: session } = useSession();
    const userCanEdit = canEdit(session);
    const userCanCount = canCount(session);

    const {
        activeTab, setActiveTab,
        isEditing, setIsEditing,
        isFavorite,
        formData, handleChange,
        handleSave, handleDelete,
        stockLogs, logsLoading,
        physicalCount, handleCountChange,
        countStatus,
        inputRef,
        isUpdating, handleConfirmCount
    } = useProductDetail(product);

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white flex font-sans selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
            <Toaster position="bottom-right" />

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/50 flex-shrink-0 flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-border">
                    <Link href="/inventory" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-bold text-lg">
                        <span>← Inventory</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { id: 'general', label: 'General Information' },
                        { id: 'attributes', label: 'Technical Attributes' },
                        { id: 'sales', label: 'Sales & Orders' },
                        { id: 'purchase', label: 'Purchasing' },
                        { id: 'inventory', label: 'Inventory & Logistics' },
                        { id: 'accounting', label: 'Accounting' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                    <div className="bg-gray-100/50 dark:bg-zinc-900/50 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">System Status</div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-900 dark:text-white">Stock</span>
                            <span className={`font-mono font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{product.stock}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto w-full">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {product.category || 'Uncategorized'}
                                </span>
                                {isFavorite && <span className="text-amber-500 text-lg">★</span>}
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                                {isEditing ? 'Editing Product' : (product.nameEs || product.name)}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                                <span>SKU: <span className="text-gray-900 dark:text-white">{product.sku}</span></span>
                                {product.barcode && <span>Barcode: <span className="text-gray-900 dark:text-white">{product.barcode}</span></span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                                Print Labels
                            </button>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                    Edit Product
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-bold hover:bg-destructive/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Image & Key Stats */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-xl p-4 shadow-sm">
                                <div className="aspect-square bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden mb-4 relative">
                                    {isEditing ? (
                                        <ImageUpload
                                            onUpload={(url) => handleChange('image', url)}
                                            currentImage={formData.image}
                                            productId={product.sku || product.id}
                                        />
                                    ) : product.image ? (
                                        <img src={CloudinaryPresets.medium(product.image)} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-400">No Image</div>
                                    )}
                                </div>
                            </div>

                            {/* Desktop Quick Count - Only for users with count permission */}
                            {userCanCount && (
                                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span> Quick Inventory
                                    </h3>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Current Stock</span>
                                        <span className="text-xl font-mono font-bold">{product.stock}</span>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <input
                                            ref={inputRef}
                                            type="number"
                                            placeholder="Physical Qty"
                                            value={physicalCount}
                                            onChange={(e) => handleCountChange(e.target.value)}
                                            className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button
                                            onClick={handleConfirmCount}
                                            disabled={!physicalCount || isUpdating}
                                            className="bg-[#007AFF] text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 hover:bg-[#007AFF]/90 transition-colors"
                                        >
                                            {isUpdating ? 'Saving...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Dynamic Tabs Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Basic Info Card */}
                                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-foreground mb-6 pb-2 border-b border-border">Basic Information</h3>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground block mb-2">Name (Español)</label>
                                                {isEditing ? (
                                                    <input value={formData.nameEs || ''} onChange={(e) => handleChange('nameEs', e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                                                ) : (
                                                    <div className="text-foreground font-medium">{product.nameEs || product.name}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground block mb-2">Name (English)</label>
                                                {isEditing ? (
                                                    <input value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                                                ) : (
                                                    <div className="text-foreground font-medium">{product.nameEn || product.name}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground block mb-2">Category</label>
                                                {isEditing ? (
                                                    <input value={formData.category || ''} onChange={(e) => handleChange('category', e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                                                ) : (
                                                    <div className="text-foreground">{product.category}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground block mb-2">Type</label>
                                                <div className="text-foreground">Storable Product</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing & Barcode */}
                                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold text-foreground mb-6 pb-2 border-b border-border">Pricing & Identifiers</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground block mb-2">Barcode</label>
                                                {isEditing ? (
                                                    <input value={formData.barcode || ''} onChange={(e) => handleChange('barcode', e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2 font-mono" />
                                                ) : (
                                                    <div className="text-foreground font-mono">{product.barcode || '-'}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground block mb-2">Internal SKU</label>
                                                {isEditing ? (
                                                    <input value={formData.sku || ''} onChange={(e) => handleChange('sku', e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2 font-mono" />
                                                ) : (
                                                    <div className="text-foreground font-mono">{product.sku}</div>
                                                )}
                                            </div>

                                            <div className="col-span-2 pt-4 border-t border-dashed border-gray-200 dark:border-white/5 mt-2">
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Cost Price ($ ZG)</label>
                                                        {isEditing ? (
                                                            <input type="number" value={formData.priceZG || 0} onChange={(e) => handleChange('priceZG', e.target.value)} className="block w-32 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/5 rounded px-2 py-1" />
                                                        ) : (
                                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">${(product.priceZG || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Sales Price</label>
                                                        <div className="text-2xl font-bold text-[#007AFF]">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Simple Stock Log Table */}
                                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Stock Movement History</h3>
                                        </div>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-100/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-white/5">
                                                <tr>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-6 py-3">Change</th>
                                                    <th className="px-6 py-3">New Qty</th>
                                                    <th className="px-6 py-3">Auditor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                                {stockLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-3">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</td>
                                                        <td className={`px-6 py-3 font-semibold ${log.difference > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {log.difference > 0 ? '+' : ''}{log.difference}
                                                        </td>
                                                        <td className="px-6 py-3 font-mono">{log.newQuantity}</td>
                                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{log.auditor}</td>
                                                    </tr>
                                                ))}
                                                {stockLogs.length === 0 && (
                                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No history found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {isEditing && (
                                        <div className="pt-8 border-t border-border">
                                            <button onClick={handleDelete} className="text-destructive hover:underline text-sm font-medium">
                                                Delete this product permanently
                                            </button>
                                        </div>
                                    )}

                                </div>
                            )}

                            {activeTab !== 'general' && (
                                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground">
                                    <p>Module {activeTab} is currently read-only in this view.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
