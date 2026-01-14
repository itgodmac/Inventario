'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Setting {
    key: string;
    value: number;
    description: string | null;
}

const settingsConfig = [
    {
        key: 'PRICE_L1_COMP_FACTOR',
        label: 'Factor Competencia (L1)',
        description: 'Multiplicador vs precio competencia (0.96 = 4% más barato)',
        format: (v: number) => `${v} (${((1 - v) * 100).toFixed(1)}% desc.)`
    },
    {
        key: 'PRICE_Q1_IMPORT_FACTOR',
        label: 'Factor Importación (Q1)',
        description: 'Costo de importación/flete sobre precio fábrica',
        format: (v: number) => `${v} (${(v * 100).toFixed(1)}%)`
    },
    {
        key: 'PRICE_S1_EXCHANGE_COST',
        label: 'Tipo Cambio Costo (S1)',
        description: 'MXN/USD para calcular costos',
        format: (v: number) => `$${v.toFixed(2)} MXN`
    },
    {
        key: 'PRICE_I1_EXCHANGE_SALE',
        label: 'Tipo Cambio Venta (I1)',
        description: 'MXN/USD para precio final al público',
        format: (v: number) => `$${v.toFixed(2)} MXN`
    },
    {
        key: 'PRICE_O1_EXTRA_FACTOR',
        label: 'Factor Extra (O1)',
        description: 'Factor adicional de importación',
        format: (v: number) => `${v}`
    }
];

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            });
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => prev.map(s =>
            s.key === key ? { ...s, value: parseFloat(value) || 0 } : s
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            });

            if (res.ok) {
                toast.success('Configuración actualizada correctamente');
                router.refresh();
            } else {
                toast.error('Error al guardar la configuración');
            }
        } catch (error) {
            toast.error('Error: ' + error);
        } finally {
            setSaving(false);
        }
    };

    const handleRecalculate = async () => {
        if (!confirm('⚠️ Esto actualizará TODOS los precios. ¿Continuar?')) {
            return;
        }

        setRecalculating(true);
        try {
            const res = await fetch('/api/settings/recalculate', {
                method: 'POST'
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                router.refresh();
            } else {
                toast.error('Error: ' + data.error);
            }
        } catch (error) {
            toast.error('Error: ' + error);
        } finally {
            setRecalculating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/inventory')}
                        className="text-blue-600 hover:text-blue-700 mb-4 text-sm"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Configuración de Precios
                    </h1>
                    <p className="text-sm text-gray-600">
                        Factores globales para cálculo automático
                    </p>
                </div>

                {/* Warning */}
                <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <p className="text-sm text-orange-800">
                        <strong>Importante:</strong> Después de guardar, usa "Recalcular Precios" para actualizar productos existentes.
                    </p>
                </div>

                {/* Settings */}
                <div className="space-y-4 mb-8">
                    {settingsConfig.map(config => {
                        const setting = settings.find(s => s.key === config.key);
                        const currentValue = setting?.value ?? 0;

                        return (
                            <div key={config.key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            {config.label}
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            {config.description}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-xs text-gray-500 mb-1">Actual</div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {config.format(currentValue)}
                                        </div>
                                    </div>
                                </div>

                                <input
                                    type="number"
                                    step="0.01"
                                    value={currentValue}
                                    onChange={(e) => handleChange(config.key, e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-right font-mono"
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Preview */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        📊 Ejemplo de Cálculo
                    </h3>
                    <div className="space-y-1 text-xs text-blue-800">
                        {(() => {
                            const L1 = settings.find(s => s.key === 'PRICE_L1_COMP_FACTOR')?.value ?? 0.96;
                            const I1 = settings.find(s => s.key === 'PRICE_I1_EXCHANGE_SALE')?.value ?? 18.5;

                            const exampleOth = 215;
                            const exampleBM = exampleOth * L1;
                            const exampleVenta = exampleBM * I1;

                            return (
                                <>
                                    <p>Competencia: <strong>${exampleOth} USD</strong></p>
                                    <p>Tu precio: <strong>${exampleBM.toFixed(2)} USD</strong> (competencia × {L1})</p>
                                    <p>Final: <strong>${exampleVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong> (× {I1})</p>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleRecalculate}
                        disabled={recalculating}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${recalculating
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                            }`}
                    >
                        {recalculating ? 'Recalculando...' : '🔄 Recalcular Precios'}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${saving
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                    >
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
}
