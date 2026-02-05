import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export interface Product {
    id: string;
    name: string;
    nameEn: string | null;
    nameEs: string | null;
    sku: string | null;
    barcode: string | null;
    itemCode: string | null;
    photoId: string | null;
    category: string | null;
    stock: number;
    price: number;
    priceZG?: number;
    priceOth?: number;
    status: string;
    image: string | null;
    description: string | null;
}

export interface Theme {
    primary: string;
    secondary: string;
    name: string;
}

export function useProductDetail(product: Product) {
    const router = useRouter();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'sales' | 'purchase' | 'inventory' | 'accounting'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [isFavorite, setIsFavorite] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: product.name,
        nameEs: product.nameEs || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        price: product.price,
        category: product.category || '',
        stock: product.stock,
        status: product.status,
        priceZG: product.priceZG || 0,
        priceOth: product.priceOth || 0,
        image: product.image || ''
    });

    // Sync form
    useEffect(() => {
        if (!isEditing) {
            setFormData({
                name: product.name,
                nameEs: product.nameEs || '',
                sku: product.sku || '',
                barcode: product.barcode || '',
                price: product.price,
                category: product.category || '',
                stock: product.stock,
                status: product.status,
                priceZG: product.priceZG || 0,
                priceOth: product.priceOth || 0,
                image: product.image || ''
            });
        }
    }, [product, isEditing]);

    // Logs
    const [stockLogs, setStockLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!product.id) return;
            setLogsLoading(true);
            try {
                // Use product.id (UUID) instead of photoId for querying logs
                const res = await fetch(`/api/inventory/${product.id}/logs`);
                const data = await res.json();
                setStockLogs(data.logs || []);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLogsLoading(false);
            }
        };
        fetchLogs();
    }, [product.id]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/inventory/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to update');
            toast.success('Producto actualizado correctamente');
            setIsEditing(false);
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/inventory/${product.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Producto eliminado');
            router.push('/inventory');
            router.refresh();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // Inventory Count
    const [physicalCount, setPhysicalCount] = useState<string>('');
    const [countStatus, setCountStatus] = useState<'idle' | 'matching' | 'discrepancy'>('idle');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleCountChange = (val: string) => {
        setPhysicalCount(val);
        const count = parseInt(val);
        if (isNaN(count)) {
            setCountStatus('idle');
            return;
        }
        if (count === product.stock) {
            setCountStatus('matching');
        } else {
            setCountStatus('discrepancy');
        }
    };

    const handleConfirmCount = async () => {
        if (!physicalCount) return;
        setIsUpdating(true);

        const payload = {
            id: product.id,
            quantity: parseInt(physicalCount),
            difference: parseInt(physicalCount) - product.stock,
            auditor: session?.user?.name || session?.user?.email || 'DESKTOP_USER'
        };

        try {
            const response = await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                toast.success('Inventario actualizado');
                router.refresh();
                setPhysicalCount('');

                // Refresh logs manually using product.id
                const res = await fetch(`/api/inventory/${product.id}/logs`);
                const logsData = await res.json();
                setStockLogs(logsData.logs || []);
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        } catch (error: any) {
            toast.error(`Error al guardar: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        activeTab, setActiveTab,
        isEditing, setIsEditing,
        isFavorite, setIsFavorite,
        formData, handleChange,
        handleSave, handleDelete,
        stockLogs, logsLoading,
        physicalCount, handleCountChange,
        countStatus,
        inputRef,
        isUpdating, handleConfirmCount
    };
}
