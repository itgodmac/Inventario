'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    currentImage?: string;
    productId?: string; // Product SKU/ID for naming
}

export default function ImageUpload({ onUpload, currentImage, productId }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(currentImage || '');

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (productId) formData.append('productId', productId);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setPreview(data.url);
                onUpload(data.url);
                toast.success('Imagen subida correctamente');
            } else {
                toast.error('Error al subir imagen');
            }
        } catch (error) {
            toast.error('Error al subir imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onUpload('');
    };

    return (
        <div className="space-y-4">
            {preview ? (
                <div className="relative inline-block">
                    <img
                        src={preview}
                        alt="Product"
                        className="w-64 h-64 object-cover rounded-xl border border-gray-200 shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 shadow-lg"
                    >
                        ✕
                    </button>
                    <button
                        type="button"
                        onClick={() => document.getElementById('file-input')?.click()}
                        className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 shadow-lg"
                    >
                        Cambiar
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !uploading && document.getElementById('file-input')?.click()}
                >
                    {uploading ? (
                        <div className="space-y-2">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm text-blue-600 font-medium">Subiendo imagen...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-blue-600">Click para subir</span> o arrastra aquí
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                        </div>
                    )}
                </div>
            )}

            <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
            />
        </div>
    );
}
