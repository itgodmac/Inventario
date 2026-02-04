'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRealtimeInventory } from '@/app/hooks/useRealtimeInventory';
import toast from 'react-hot-toast';
import { CloudinaryPresets } from '@/lib/cloudinary';

interface ImageCandidate {
    url: string;
    filename: string;
    relativePath?: string;
}

interface ProductCandidate {
    id: string;
    sku: string;
    photoId: string | null;
    nameEn: string | null;
    nameEs: string | null;
    category: string | null;
    barcode: string | null;
    currentImage: string | null;
    candidateImages: ImageCandidate[];
}

export default function ReconcilePage() {
    const router = useRouter();

    // Realtime connection to database
    const { products: dbProducts, isLoading, isConnected, refresh } = useRealtimeInventory();

    const [scannedCandidates, setScannedCandidates] = useState<Map<string, ImageCandidate[]>>(new Map());
    const [unmatchedImages, setUnmatchedImages] = useState<ImageCandidate[]>([]);
    const [scanning, setScanning] = useState(false);
    const [imagePath, setImagePath] = useState('\\\\MCA-S\\mk\\2_BM\\0_BMat\\08_PYM\\Catalogo actualizado DIC2025\\Imagenes de productos');
    const [uploadingForProduct, setUploadingForProduct] = useState<string | null>(null);

    // Drag and Drop state
    const [draggingImage, setDraggingImage] = useState<ImageCandidate | null>(null);

    // Track edited names and SKU for each product
    const [editedNames, setEditedNames] = useState<Map<string, { nameEn: string; nameEs: string }>>(new Map());
    const [editedSkus, setEditedSkus] = useState<Map<string, string>>(new Map());
    // Search filter
    const [searchQuery, setSearchQuery] = useState('');

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        productId: string;
        imageUrl: string;
        filename: string;
        currentImage: string | null;
        productName: string;
    } | null>(null);

    // Merge DB products with scanned candidates, filtering out products that already have images
    // If there is a search query, we show ALL matching products even if they have no candidates
    const productsWithCandidates = useMemo(() => {
        if (!dbProducts) return [];

        let results: (ProductCandidate & { relevance: number })[] = [];
        const query = searchQuery.toLowerCase().trim();

        // If we haven't scanned yet and there's no search, show nothing or instructions
        if (scannedCandidates.size === 0 && !query) return [];

        for (const product of dbProducts) {
            // Already has image? Skip unless specifically searching for it.
            if (product.image && !query) continue;

            const candidates = scannedCandidates.get(product.id) || [];

            let relevance = 0;
            if (query) {
                const sku = product.sku?.toLowerCase() || '';
                const photoId = product.photoId?.toLowerCase() || '';
                const nameEs = product.nameEs?.toLowerCase() || '';
                const nameEn = product.nameEn?.toLowerCase() || '';
                const category = product.category?.toLowerCase() || '';
                const barcode = product.barcode?.toLowerCase() || '';

                if (sku === query || photoId === query) relevance = 100;
                else if (sku.startsWith(query) || photoId.startsWith(query)) relevance = 80;
                else if (nameEs.includes(query) || nameEn.includes(query)) relevance = 50;
                else if (sku.includes(query) || photoId.includes(query)) relevance = 40;
                else if (category.includes(query) || barcode.includes(query)) relevance = 20;
            }

            if (relevance > 0 || (candidates.length > 0 && !query)) {
                results.push({
                    id: product.id,
                    sku: product.sku || '',
                    photoId: product.photoId,
                    nameEn: product.nameEn,
                    nameEs: product.nameEs,
                    category: product.category,
                    barcode: product.barcode,
                    currentImage: product.image,
                    candidateImages: candidates,
                    relevance,
                } as any);
            }
        }

        // Sort by photoId (ID), then by relevance, then by candidates count
        return (results as any).sort((a: any, b: any) => {
            // Primary sort: by photoId (ID)
            const aId = a.photoId || '';
            const bId = b.photoId || '';
            if (aId !== bId) return aId.localeCompare(bId);

            // Secondary sort: by relevance
            if (b.relevance !== a.relevance) return b.relevance - a.relevance;

            // Tertiary sort: by candidates count
            return b.candidateImages.length - a.candidateImages.length;
        });
    }, [dbProducts, scannedCandidates, searchQuery]);

    // Filter products by search query (Simplified since the logic is now in productsWithCandidates)
    const filteredProducts = productsWithCandidates;

    // Group products by category
    const productsByCategory = useMemo(() => {
        const grouped = new Map<string, ProductCandidate[]>();
        const query = searchQuery.toLowerCase().trim();

        for (const product of filteredProducts) {
            let category = product.category || 'SIN CATEGORÍA';

            // If it's a very strong match, put it in a special "COINCIDENCIAS EXACTAS" category at the top
            if (query && (product as any).relevance >= 80) {
                category = '⭐ COINCIDENCIAS EXACTAS';
            }

            if (!grouped.has(category)) {
                grouped.set(category, []);
            }
            grouped.get(category)!.push(product);
        }

        // Sort categories: "Exact Matches" first, then alphabetically
        return new Map([...grouped.entries()].sort((a, b) => {
            if (a[0].startsWith('⭐')) return -1;
            if (b[0].startsWith('⭐')) return 1;
            return a[0].localeCompare(b[0]);
        }));
    }, [filteredProducts, searchQuery]);

    const handleScanImages = useCallback(async () => {
        if (!imagePath.trim()) {
            alert('Por favor ingresa la ruta de la carpeta de imágenes');
            return;
        }

        setScanning(true);
        try {
            const res = await fetch('/api/inventory/reconcile/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagePath }),
            });
            const data = await res.json();

            if (data.success) {
                // Store candidates in a Map for efficient lookup
                const candidatesMap = new Map<string, ImageCandidate[]>();

                data.products.forEach((p: ProductCandidate) => {
                    candidatesMap.set(p.id, p.candidateImages);
                });

                setScannedCandidates(candidatesMap);
                setUnmatchedImages(data.unmatchedImages || []);
                toast.success(`Escaneo completado. ${data.products.length} productos encontrados y ${data.unmatchedImages?.length || 0} imágenes sin asignar.`);
            } else {
                toast.error(data.error || 'Error al escanear');
            }
        } catch (error) {
            console.error('Error scanning:', error);
            toast.error('Error al escanear imágenes');
        } finally {
            setScanning(false);
        }
    }, [imagePath]);

    const handleSelectImage = useCallback((productId: string, imageUrl: string, filename: string, currentImage: string | null, productName: string) => {
        setConfirmModal({ productId, imageUrl, filename, currentImage, productName });
    }, []);

    const handleSaveNames = useCallback(async (productId: string) => {
        const editedName = editedNames.get(productId);
        const editedSku = editedSkus.get(productId);

        if (!editedName && editedSku === undefined) {
            toast.error('No hay cambios para guardar');
            return;
        }

        const toastId = toast.loading('Guardando cambios...');

        try {
            let namesSuccess = true;
            let skuSuccess = true;

            // Update names if edited
            if (editedName) {
                const namesRes = await fetch('/api/inventory/reconcile/update-names', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, ...editedName }),
                });
                const namesData = await namesRes.json();
                namesSuccess = namesData.success;
                if (!namesSuccess) {
                    console.error('Error updating names:', namesData);
                }
            }

            // Update SKU if edited
            if (editedSku !== undefined) {
                const product = dbProducts?.find(p => p.id === productId);
                if (!product) {
                    throw new Error('Producto no encontrado');
                }

                console.log('Updating SKU:', { productId, oldSku: product.sku, newSku: editedSku });

                const skuRes = await fetch(`/api/inventory/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: product.name || product.nameEn || 'Unnamed',
                        nameEn: product.nameEn,
                        nameEs: product.nameEs,
                        sku: editedSku,
                        barcode: product.barcode,
                        itemCode: product.itemCode,
                        category: product.category,
                        stock: product.stock,
                        status: product.status,
                        priceZG: product.priceZG || 0,
                        priceOth: product.priceOth || 0,
                        image: product.image,
                    }),
                });

                const skuData = await skuRes.json();
                console.log('SKU update response:', skuData);

                if (skuData.status !== 'success') {
                    skuSuccess = false;
                    const errorMsg = skuData.message || skuData.error || JSON.stringify(skuData);
                    console.error('Error updating SKU:', errorMsg);

                    // Check if it's a duplicate SKU error
                    if (errorMsg.includes('Unique constraint failed') && errorMsg.includes('sku')) {
                        toast.error(`El SKU "${editedSku}" ya existe en otro producto`, { id: toastId });
                        return;
                    }
                }
            }

            if (!namesSuccess || !skuSuccess) {
                toast.error('Error al guardar algunos cambios', { id: toastId });
                return;
            }

            // Clear edited states only if successful
            setEditedNames(prev => {
                const newMap = new Map(prev);
                newMap.delete(productId);
                return newMap;
            });
            setEditedSkus(prev => {
                const newMap = new Map(prev);
                newMap.delete(productId);
                return newMap;
            });

            await refresh();
            toast.success('Cambios guardados correctamente', { id: toastId });
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error(`Error al guardar cambios: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
        }
    }, [refresh, editedNames, editedSkus, dbProducts]);

    const handleConfirmImage = useCallback(async () => {
        if (!confirmModal) return;

        const { productId, imageUrl, filename } = confirmModal;
        setConfirmModal(null);

        const toastId = toast.loading('Guardando imagen...');

        try {
            // First, save any edited names
            const edited = editedNames.get(productId);
            if (edited) {
                await fetch('/api/inventory/reconcile/update-names', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, ...edited }),
                });
            }

            // Then confirm the image
            const res = await fetch('/api/inventory/reconcile/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, imageUrl }),
            });

            const data = await res.json();
            if (data.success) {
                // Remove from edited names and SKUs
                setEditedNames(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(productId);
                    return newMap;
                });
                setEditedSkus(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(productId);
                    return newMap;
                });

                // Force refresh to get updated data
                await refresh();
                toast.success('Imagen confirmada y actualizada', { id: toastId });
            } else {
                toast.error('Error al confirmar imagen', { id: toastId });
            }
        } catch (error) {
            console.error('Error confirming image:', error);
            toast.error('Error al confirmar imagen', { id: toastId });
        }
    }, [refresh, editedNames, confirmModal]);

    const handleNameChange = useCallback((productId: string, field: 'nameEn' | 'nameEs', value: string) => {
        setEditedNames(prev => {
            const newMap = new Map(prev);
            // Find the product to get its current values
            const product = dbProducts?.find(p => p.id === productId);
            const current = newMap.get(productId) || {
                nameEn: product?.nameEn ?? '',
                nameEs: product?.nameEs ?? ''
            };
            newMap.set(productId, { ...current, [field]: value });
            return newMap;
        });
    }, [dbProducts]);

    const handleSkuChange = useCallback((productId: string, value: string) => {
        setEditedSkus(prev => {
            const newMap = new Map(prev);
            newMap.set(productId, value);
            return newMap;
        });
    }, []);

    const handleCancelEdit = useCallback((productId: string) => {
        setEditedNames(prev => {
            const newMap = new Map(prev);
            newMap.delete(productId);
            return newMap;
        });
        setEditedSkus(prev => {
            const newMap = new Map(prev);
            newMap.delete(productId);
            return newMap;
        });
    }, []);

    const handleDirectUpload = useCallback(async (productId: string, file: File) => {
        if (!file) return;

        setUploadingForProduct(productId);
        const toastId = toast.loading('Subiendo imagen a Cloudinary...');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('productId', productId);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                // Now confirm this URL for the product
                const confirmRes = await fetch('/api/inventory/reconcile/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, imageUrl: data.url }),
                });

                const confirmData = await confirmRes.json();
                if (confirmData.success) {
                    await refresh();
                    toast.success('Imagen subida y asignada Correctamente', { id: toastId });
                } else {
                    toast.error('Error al asignar la imagen subida', { id: toastId });
                }
            } else {
                toast.error(data.error || 'Error al subir imagen', { id: toastId });
            }
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Error al subir imagen', { id: toastId });
        } finally {
            setUploadingForProduct(null);
        }
    }, [refresh]);

    const onDropLocalFile = useCallback((e: React.DragEvent, productId: string) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleDirectUpload(productId, file);
        }
    }, [handleDirectUpload]);

    const onDropCandidate = useCallback((e: React.DragEvent, product: ProductCandidate) => {
        e.preventDefault();
        if (draggingImage) {
            handleSelectImage(
                product.id,
                draggingImage.url,
                draggingImage.filename,
                product.currentImage,
                product.nameEs || product.nameEn || 'Sin nombre'
            );
            setDraggingImage(null);
        }
    }, [draggingImage, handleSelectImage]);

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-zinc-950">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/inventory" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reconciliación de Imágenes</h1>
                            </div>
                        </div>

                        {/* Connection status */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[12px] text-gray-500 dark:text-gray-400">
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-6">
                {/* Scanner Controls */}
                <div className="bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border border-gray-200 dark:border-white/5 p-6 mb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                                Ruta de la Carpeta de Imágenes
                            </label>
                            <input
                                type="text"
                                value={imagePath}
                                onChange={(e) => setImagePath(e.target.value)}
                                placeholder="Ejemplo: \\\\MCA-S\\mk\\2_BM\\NUEVAS_FOTOS"
                                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-white/10 text-[14px]"
                            />

                        </div>

                        <button
                            onClick={handleScanImages}
                            disabled={scanning || !imagePath.trim()}
                            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {scanning ? 'Escaneando...' : 'Escanear y Buscar Coincidencias'}
                        </button>
                    </div>
                </div>

                {/* Search Filter */}
                {scannedCandidates.size > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border border-gray-200 dark:border-white/5 p-6 mb-6">
                        <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                            Buscar Productos
                        </label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por SKU, nombre, categoría o código de barras..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-white/10 text-[14px]"
                            />
                        </div>
                        {searchQuery && (
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
                                Mostrando {filteredProducts.length} de {productsWithCandidates.length} productos
                            </p>
                        )}
                    </div>
                )}

                {/* Results by Category */}
                {productsByCategory.size > 0 ? (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Mostrando <strong>{productsWithCandidates.length}</strong> producto(s) en <strong>{productsByCategory.size}</strong> categoría(s)
                            </div>
                            <button
                                onClick={() => refresh()}
                                className="text-[12px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                            >
                                Actualizar
                            </button>
                        </div>

                        {/* Categories */}
                        {Array.from(productsByCategory.entries()).map(([category, products]) => (
                            <div key={category} className="mb-8">
                                {/* Category Header */}
                                <div className="mb-4 flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                        {category}
                                    </h2>
                                    <span className="px-2 py-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md text-[12px] font-semibold">
                                        {products.length}
                                    </span>
                                </div>

                                {/* Products Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-4">
                                    {products.map((product) => {
                                        const edited = editedNames.get(product.id);
                                        const currentNameEn = edited?.nameEn ?? product.nameEn ?? '';
                                        const currentNameEs = edited?.nameEs ?? product.nameEs ?? '';

                                        return (
                                            <div
                                                key={product.id}
                                                className={`bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border-2 overflow-hidden transition-all duration-200 ${uploadingForProduct === product.id
                                                    ? 'border-blue-500 scale-[1.01] shadow-lg opacity-80'
                                                    : 'border-gray-200 dark:border-white/5'
                                                    }`}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onDrop={(e) => {
                                                    // Handle both local files and candidate images
                                                    if (e.dataTransfer.files.length > 0) {
                                                        onDropLocalFile(e, product.id);
                                                    } else {
                                                        onDropCandidate(e, product);
                                                    }
                                                }}
                                            >
                                                {/* Product Header - Two Column Layout */}
                                                <div className="p-4 bg-[#F2F2F7]/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 relative">
                                                    {uploadingForProduct === product.id && (
                                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400">Subiendo...</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Left Column: Current Image */}
                                                        <div className="flex flex-col">
                                                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex justify-between">
                                                                <span>Imagen Actual</span>
                                                                <label className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold normal-case">
                                                                    Subir Nueva
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleDirectUpload(product.id, file);
                                                                        }}
                                                                    />
                                                                </label>
                                                            </p>
                                                            <div className="aspect-square rounded-lg overflow-hidden bg-[#F2F2F7] dark:bg-zinc-800 border-2 border-gray-200 dark:border-white/10 group relative">
                                                                {product.currentImage ? (
                                                                    <img
                                                                        src={CloudinaryPresets.small(product.currentImage)}
                                                                        alt="Imagen actual"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                                                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                        <p className="text-[10px] text-gray-400">Arrastra una imagen aquí</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right Column: Product Info */}
                                                        <div className="flex flex-col space-y-3">
                                                            {/* Read-only fields */}
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                        ID
                                                                    </label>
                                                                    <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 text-[13px] border border-gray-200 dark:border-white/5">
                                                                        {product.photoId || 'N/A'}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                        SKU
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={editedSkus.get(product.id) ?? product.sku}
                                                                        onChange={(e) => handleSkuChange(product.id, e.target.value)}
                                                                        placeholder="SKU"
                                                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-white/10 text-[13px] focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Barcode (read-only) if available */}
                                                            {product.barcode && (
                                                                <div>
                                                                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                        Barcode
                                                                    </label>
                                                                    <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-gray-300 text-[13px] border border-gray-200 dark:border-white/5">
                                                                        {product.barcode}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Editable Names */}
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                    Nombre Español
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={currentNameEs}
                                                                    onChange={(e) => handleNameChange(product.id, 'nameEs', e.target.value)}
                                                                    placeholder="Nombre en español"
                                                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-white/10 text-[13px] focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                                                    Nombre Inglés
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={currentNameEn}
                                                                    onChange={(e) => handleNameChange(product.id, 'nameEn', e.target.value)}
                                                                    placeholder="English name"
                                                                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-white/10 text-[13px] focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Candidate Images */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                            Imágenes Candidatas ({product.candidateImages.length}):
                                                        </p>
                                                        {(editedNames.has(product.id) || editedSkus.has(product.id)) && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleCancelEdit(product.id)}
                                                                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSaveNames(product.id)}
                                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                                                >
                                                                    Guardar Cambios
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mb-3 p-3 bg-transparent border-0">
                                                        {/* Removed tip message */}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {product.candidateImages.map((candidate, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                                                                draggable
                                                                onDragStart={() => setDraggingImage(candidate)}
                                                                onDragEnd={() => setDraggingImage(null)}
                                                                onClick={() => handleSelectImage(product.id, candidate.url, candidate.filename, product.currentImage, product.nameEs || product.nameEn || 'Sin nombre')}
                                                            >
                                                                <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-800">
                                                                    <div className="w-20 h-20 flex-shrink-0 bg-[#F2F2F7] dark:bg-zinc-700 rounded overflow-hidden">
                                                                        <img
                                                                            src={candidate.url}
                                                                            alt={candidate.filename}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">
                                                                            {candidate.filename}
                                                                        </p>
                                                                        {candidate.relativePath && (
                                                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate" title={candidate.relativePath}>
                                                                                {candidate.relativePath}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                                                                            Click para confirmar
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : scannedCandidates.size > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border border-gray-200 dark:border-white/5 p-20 text-center">
                        <svg className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            ¡Todo listo!
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                            Todos los productos con candidatos ya tienen imágenes asignadas o no hay coincidencias pendientes.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-[10px] shadow-sm border border-gray-200 dark:border-white/5 p-20 text-center">
                        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">
                            Ingresa una ruta y presiona "Escanear" para comenzar la conciliación.
                        </p>
                    </div>
                )}

                {/* Unmatched Images Pool (Banco de Imágenes) */}
                {unmatchedImages.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                Banco de Imágenes Sin Asignar
                            </h2>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold">
                                {unmatchedImages.length} archivos
                            </span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-[12px] shadow-md border border-gray-200 dark:border-white/5 p-6">
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Arrastra y suelta cualquiera de estas imágenes sobre un producto de arriba para asignarla manualmente.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {unmatchedImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group cursor-pointer bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                                        draggable
                                        onDragStart={() => setDraggingImage(img)}
                                        onDragEnd={() => setDraggingImage(null)}
                                    >
                                        <div className="aspect-square">
                                            <img
                                                src={img.url}
                                                alt={img.filename}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
                                            <p className="text-[10px] font-medium text-gray-900 dark:text-white truncate" title={img.filename}>
                                                {img.filename}
                                            </p>
                                        </div>
                                        {/* Hover overlay hint */}
                                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <div className="bg-blue-600 text-white p-1 rounded-full">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-[12px] shadow-2xl border border-gray-200 dark:border-white/10 max-w-2xl w-full overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Confirmar Imagen
                            </h3>
                            <p className="text-[14px] text-gray-600 dark:text-gray-400 mb-4">
                                {confirmModal.productName}
                            </p>

                            {/* Image Comparison */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Current Image */}
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Imagen Actual
                                    </p>
                                    <div className="aspect-square bg-[#F2F2F7] dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                                        {confirmModal.currentImage ? (
                                            <img
                                                src={confirmModal.currentImage.includes('cloudinary') ? CloudinaryPresets.medium(confirmModal.currentImage) : confirmModal.currentImage}
                                                alt="Current"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* New Image */}
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Nueva Imagen
                                    </p>
                                    <div className="aspect-square bg-[#F2F2F7] dark:bg-zinc-800 rounded-lg overflow-hidden border-2 border-blue-500 dark:border-blue-400">
                                        <img
                                            src={confirmModal.imageUrl}
                                            alt="New"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#F2F2F7] dark:bg-zinc-800 rounded-lg p-3">
                                <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate">
                                    {confirmModal.filename}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white rounded-lg text-[14px] font-semibold hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmImage}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
