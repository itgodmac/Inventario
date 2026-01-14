'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload';
import toast from 'react-hot-toast';

// Extracted from CSV
const CATEGORIAS = ["Putzmeister", "Schwing", "SANY", "CIFA", "WAM", "Tuberia", "Bombeo de concreto", "Olla Revolvedora", "TRITURADORAS", "Otro"];
const MONTAJE = ["BARRA V-ROCK", "AGITADOR V-ROCK", "SISTEMA DE BOMBEO", "HIDRAULICO", "REDUCTOR", "TANQUE DE AGUA", "TOLVA", "TUBERIA", "Sellos y retenes", "Componentes hidráulicos", "Componentes eléctricos", "Componentes estructurales y de montaje", "Sistema de bombeo de concreto", "SIN ASIGNAR"];
const TIPO = ["ANILLOS METALICOS", "PISTONES", "EMPAQUES", "BALEROS", "ENGRANES", "RODILLOS", "CASQUILLOS", "VALVULAS", "BOMBAS", "MOTORES", "FILTROS", "CABLES", "RELAYS", "TUBOS", "VIBRADORES", "LIMPIEZA", "ACCESORIOS", "TRANSMISIONES", "SIN ASIGNAR", "Sin Asignar"];
const STATUS_OPTIONS = ["In stock", "Falta Ubicar", "borrar", "out-of-stock"];

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    const [formData, setFormData] = useState({
        // Auto-generated
        id: '',
        barcode: '',

        // Names
        nameEn: '',
        nameEs: '',

        // Details
        description: '',
        uvaNombre: '',
        itemCode: '',
        uniCode: '',

        // Classification
        category: 'SIN ASIGNAR',
        montaje: 'SIN ASIGNAR',
        tipo: 'SIN ASIGNAR',
        status: 'In stock',

        // Stock
        stock: '0',

        // Pricing
        priceZG: '',
        priceOth: ''
    });

    // Generate ID and Barcode on mount
    useEffect(() => {
        async function fetchNextId() {
            try {
                const res = await fetch('/api/inventory/next-id');
                const data = await res.json();
                const nextId = data.nextId || '1000';

                // Generate barcode: 750458 + last 5 digits of ID padded
                const idNum = parseInt(nextId);
                const barcodeSuffix = String(idNum).padStart(5, '0').slice(-5);
                const barcode = `750458${barcodeSuffix}`;

                setFormData(prev => ({ ...prev, id: nextId, barcode }));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching next ID:', error);
                // Fallback to random if API fails
                const nextId = String(1000 + Math.floor(Math.random() * 9000));
                const randomDigits = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
                const barcode = `750458${randomDigits}`;
                setFormData(prev => ({ ...prev, id: nextId, barcode }));
                setLoading(false);
            }
        }

        fetchNextId();
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.nameEn || formData.nameEs || 'Unnamed Product',
                nameEn: formData.nameEn,
                nameEs: formData.nameEs,
                description: formData.description,
                uvaNombre: formData.uvaNombre,
                itemCode: formData.itemCode,
                uniCode: formData.uniCode,
                sku: formData.id, // Use generated ID as SKU
                barcode: formData.barcode,
                category: formData.category,
                montaje: formData.montaje,
                tipo: formData.tipo,
                status: formData.status,
                stock: formData.stock,
                priceZG: formData.priceZG,
                priceOth: formData.priceOth,
                image: imageUrl || null
            })
        });

        if (res.ok) {
            const data = await res.json();
            toast.success('Producto creado exitosamente');
            router.push(`/inventory/${data.product.id}`);
        } else {
            toast.error('Error al crear producto');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Generando ID...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/inventory')}
                        className="text-blue-600 hover:text-blue-700 mb-4 text-sm"
                    >
                        ← Cancelar
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Nuevo Producto
                    </h1>
                    <p className="text-sm text-gray-600">
                        Completa la información del producto
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Auto-generated IDs */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Identificadores</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">ID (Secuencial)</label>
                                <input
                                    value={formData.id}
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-700 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Barcode (Editable)</label>
                                <input
                                    value={formData.barcode}
                                    onChange={(e) => handleChange('barcode', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Names */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Nombres</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Nombre Inglés *</label>
                                <input
                                    required
                                    value={formData.nameEn}
                                    onChange={(e) => handleChange('nameEn', e.target.value)}
                                    placeholder="WEAR PLATE DN250 CARBIDE"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Nombre Español</label>
                                <input
                                    value={formData.nameEs}
                                    onChange={(e) => handleChange('nameEs', e.target.value)}
                                    placeholder="ANTIFAZ DN250 CARBURO"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Imagen del Producto</h2>
                        <ImageUpload
                            onUpload={setImageUrl}
                            currentImage={imageUrl}
                            productId={formData.id}
                        />
                    </div>

                    {/* Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Detalles Adicionales</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">UVA Nombre</label>
                                <input
                                    value={formData.uvaNombre}
                                    onChange={(e) => handleChange('uvaNombre', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Item Code</label>
                                <input
                                    value={formData.itemCode}
                                    onChange={(e) => handleChange('itemCode', e.target.value)}
                                    placeholder="10181938"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Uni Code</label>
                                <input
                                    value={formData.uniCode}
                                    onChange={(e) => handleChange('uniCode', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Clasificación</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Categoría</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                >
                                    {CATEGORIAS.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Montaje</label>
                                <select
                                    value={formData.montaje}
                                    onChange={(e) => handleChange('montaje', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                >
                                    {MONTAJE.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => handleChange('tipo', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                >
                                    {TIPO.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Pricing */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Inventario y Precios</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Stock Inicial</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => handleChange('stock', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-right font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Precio Fábrica ($ ZG)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.priceZG}
                                    onChange={(e) => handleChange('priceZG', e.target.value)}
                                    placeholder="120.00"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-right font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Precio Competencia ($ Oth)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.priceOth}
                                    onChange={(e) => handleChange('priceOth', e.target.value)}
                                    placeholder="500.00"
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-right font-mono"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            El precio final ($ Venta) se calculará automáticamente basado en la configuración global.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={() => router.push('/inventory')}
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                        >
                            Crear Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
