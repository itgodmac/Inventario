'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload';
import toast from 'react-hot-toast';

// Constants (Keep existing ones)
const CATEGORIAS = ["Putzmeister", "Schwing", "SANY", "CIFA", "WAM", "Tuberia", "Bombeo de concreto", "Olla Revolvedora", "TRITURADORAS", "Otro"];
const MONTAJE = ["BARRA V-ROCK", "AGITADOR V-ROCK", "SISTEMA DE BOMBEO", "HIDRAULICO", "REDUCTOR", "TANQUE DE AGUA", "TOLVA", "TUBERIA", "Sellos y retenes", "Componentes hidráulicos", "Componentes eléctricos", "Componentes estructurales y de montaje", "Sistema de bombeo de concreto", "SIN ASIGNAR"];
const TIPO = ["ANILLOS METALICOS", "PISTONES", "EMPAQUES", "BALEROS", "ENGRANES", "RODILLOS", "CASQUILLOS", "VALVULAS", "BOMBAS", "MOTORES", "FILTROS", "CABLES", "RELAYS", "TUBOS", "VIBRADORES", "LIMPIEZA", "ACCESORIOS", "TRANSMISIONES", "SIN ASIGNAR", "Sin Asignar"];
const STATUS_OPTIONS = ["In stock", "Falta Ubicar", "borrar", "out-of-stock"];

function NewProductContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const duplicateFrom = searchParams.get('duplicate_from');

    const [loading, setLoading] = useState(true);
    const [fetchingSource, setFetchingSource] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    // Initial State
    const [formData, setFormData] = useState({
        id: '',
        barcode: '',
        nameEn: '',
        nameEs: '',
        description: '',
        uvaNombre: '',
        itemCode: '',
        uniCode: '',
        category: 'SIN ASIGNAR',
        montaje: 'SIN ASIGNAR',
        tipo: 'SIN ASIGNAR',
        status: 'In stock',
        stock: '0',
        priceZG: '',
        priceOth: ''
    });

    // 1. Fetch Source Product if duplicating
    useEffect(() => {
        if (!duplicateFrom) return;

        async function fetchSource() {
            setFetchingSource(true);
            try {
                const res = await fetch(`/api/inventory/${duplicateFrom}`);
                const data = await res.json();
                if (data.status === 'success' && (data.rawProduct || data.product)) {
                    // Use rawProduct if available to get REAL data, avoiding the print-layout swaps
                    const p = data.rawProduct || data.product;

                    // Pre-fill form with source data (excluding unique IDs/Stock)
                    setFormData(prev => ({
                        ...prev,
                        // Fix mappings: Prioritize nameEn, fall back to name ONLY if it's different from Spanish name
                        nameEn: p.nameEn || (p.name !== p.nameEs ? p.name : '') || '',
                        nameEs: p.nameEs || '',
                        description: p.description || '',
                        uvaNombre: p.uvaNombre || '',
                        itemCode: p.itemCode || '',
                        uniCode: p.uniCode || '',
                        category: p.category || 'SIN ASIGNAR',
                        montaje: p.montaje || 'SIN ASIGNAR',
                        tipo: p.tipo || 'SIN ASIGNAR',
                        status: p.status || 'In stock',

                        // Convert numeric to string for inputs
                        priceZG: p.priceZG?.toString() || '',
                        priceOth: p.priceOth?.toString() || '',

                        // Stock starts at 0 for new products
                        stock: '0'
                    }));

                    if (p.image) setImageUrl(p.image);
                    toast.success('Datos cargados del producto original');
                }
            } catch (error) {
                console.error('Error fetching source product:', error);
                toast.error('Error al duplicar producto');
            } finally {
                setFetchingSource(false);
            }
        }
        fetchSource();
    }, [duplicateFrom]);

    // 2. Fetch Next ID for the NEW product (Always runs)
    useEffect(() => {
        async function fetchNextId() {
            if (fetchingSource) return; // Wait until source is fetched to avoid state clashes? No, they are independent fields.

            try {
                const res = await fetch('/api/inventory/next-id');
                const data = await res.json();
                const nextId = data.nextPhotoId || '1000';

                // Generate barcode
                const idNum = parseInt(nextId);
                const barcodeSuffix = String(idNum).padStart(5, '0').slice(-5);
                const barcode = `750458${barcodeSuffix}`;

                setFormData(prev => ({ ...prev, id: nextId, barcode }));
            } catch (error) {
                console.error('Error fetching next ID:', error);
                // Fallback
                const nextId = String(1000 + Math.floor(Math.random() * 9000));
                const barcode = `750458${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
                setFormData(prev => ({ ...prev, id: nextId, barcode }));
            } finally {
                setLoading(false);
            }
        }
        fetchNextId();
    }, [fetchingSource]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                name: formData.nameEn || formData.nameEs || 'Unnamed Product', // Fallback name
                sku: formData.id, // ID is SKU
                photoId: formData.id,
                image: imageUrl || null
            })
        });

        if (res.ok) {
            const data = await res.json();
            toast.success('Producto creado exitosamente');
            router.push(`/inventory/${data.product.photoId}`);
        } else {
            toast.error('Error al crear producto');
        }
    };

    if (loading || fetchingSource) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-gray-500">Preparando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/inventory')}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800"></div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {duplicateFrom ? 'Duplicate Product' : 'New Product'}
                        </h1>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                        disabled={loading}
                    >
                        Save Product
                    </button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Main Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Section: Names */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Product Information</h2>
                            <div className="grid gap-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">English Name <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        value={formData.nameEn}
                                        onChange={(e) => handleChange('nameEn', e.target.value)}
                                        placeholder="e.g. WEAR PLATE DN250"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Spanish Name</label>
                                    <input
                                        value={formData.nameEs}
                                        onChange={(e) => handleChange('nameEs', e.target.value)}
                                        placeholder="e.g. PLACA DE DESGASTE"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        {/* Section: Details */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Item Code (OEM)</label>
                                    <input
                                        value={formData.itemCode}
                                        onChange={(e) => handleChange('itemCode', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">UVA Reference</label>
                                    <input
                                        value={formData.uvaNombre}
                                        onChange={(e) => handleChange('uvaNombre', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Uni Code</label>
                                    <input
                                        value={formData.uniCode}
                                        onChange={(e) => handleChange('uniCode', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        {/* Section: Pricing */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Pricing</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Factory Price ($ ZG)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.priceZG}
                                            onChange={(e) => handleChange('priceZG', e.target.value)}
                                            className="w-full pl-7 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-gray-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">Competitor Price ($ Oth)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.priceOth}
                                            onChange={(e) => handleChange('priceOth', e.target.value)}
                                            className="w-full pl-7 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-gray-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN - Sidebar */}
                    <div className="space-y-6">

                        {/* Status Card */}
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status & ID</h3>

                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1">Product Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-blue-500"
                                >
                                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1">Initial Stock</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => handleChange('stock', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm font-mono outline-none focus:border-blue-500"
                                    placeholder="0"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-500 mb-1">Generated ID</label>
                                    <div className="px-3 py-2 bg-gray-100 dark:bg-zinc-800/50 rounded-lg text-sm font-mono text-gray-600 dark:text-gray-400 border border-transparent">
                                        {formData.id}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-500 mb-1">Barcode</label>
                                    <input
                                        value={formData.barcode}
                                        onChange={(e) => handleChange('barcode', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm font-mono outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Classification Card */}
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Classification</h3>

                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-blue-500"
                                >
                                    {CATEGORIAS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1">Mounting</label>
                                <select
                                    value={formData.montaje}
                                    onChange={(e) => handleChange('montaje', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-blue-500"
                                >
                                    {MONTAJE.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => handleChange('tipo', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-blue-500"
                                >
                                    {TIPO.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Image Card */}
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product Image</h3>
                            <ImageUpload
                                onUpload={setImageUrl}
                                currentImage={imageUrl}
                                productId={formData.id}
                            />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default function NewProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">Loading...</div>}>
            <NewProductContent />
        </Suspense>
    );
}
