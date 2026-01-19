
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PrintLabelBodega from '@/app/components/print/PrintLabelBodega';
import { Product } from '@/app/lib/types';
import { Printer, History, Box, Circle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface PrintJob {
    id: string;
    productId: string;
    product?: Product;
    timestamp: Date;
}

export default function PrintStationPage() {
    const [currentJob, setCurrentJob] = useState<PrintJob | null>(null);
    const [history, setHistory] = useState<PrintJob[]>([]);
    const [status, setStatus] = useState<'idle' | 'fetching' | 'printing' | 'success' | 'error'>('idle');
    const [feedback, setFeedback] = useState('ESPERANDO TRABAJOS...');

    // Interval Ref to prevent overlap
    const isProcessing = useRef(false);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (isProcessing.current || currentJob) return;

            try {
                isProcessing.current = true;
                const res = await fetch('/api/inventory/print-queue');
                const data = await res.json();

                if (data.job) {
                    setStatus('fetching');
                    setFeedback(`PROCESANDO: ${data.job.productId}`);

                    // Fetch product details
                    const prodRes = await fetch(`/api/inventory/${data.job.productId}`);
                    const prodData = await prodRes.json();

                    if (prodData && prodData.product) {
                        const newJob: PrintJob = {
                            id: data.job.id,
                            productId: data.job.productId,
                            product: prodData.product,
                            timestamp: new Date()
                        };

                        setCurrentJob(newJob);
                        setStatus('printing');
                        setFeedback('IMPRIMIENDO ETIQUETA...');

                        // Simulation delay for animation
                        setTimeout(() => {
                            window.print();

                            // Success state
                            setStatus('success');
                            setFeedback('IMPRESIÓN COMPLETADA');

                            // Move to history
                            setHistory(prev => [newJob, ...prev].slice(0, 5));

                            // Wait a bit before next
                            setTimeout(() => {
                                setCurrentJob(null);
                                setStatus('idle');
                                setFeedback('ESPERANDO TRABAJOS...');
                                isProcessing.current = false;
                            }, 2000);
                        }, 1200); // 1.2s of animation before dialog
                    } else {
                        setStatus('error');
                        setFeedback('ERROR: PRODUCTO NO ENCONTRADO');
                        setTimeout(() => { isProcessing.current = false; setStatus('idle'); }, 3000);
                    }
                } else {
                    isProcessing.current = false;
                }
            } catch (e) {
                console.error("Polling error", e);
                isProcessing.current = false;
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentJob]);

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans overflow-hidden selection:bg-blue-500/30">
            {/* INVISIBLE PRINT LAYER */}
            <div className="hidden print:block">
                {currentJob?.product && <PrintLabelBodega product={currentJob.product} />}
            </div>

            {/* SCREEN UI */}
            <div className="print:hidden h-screen flex flex-col p-6 max-w-6xl mx-auto space-y-6">



                <main className="flex-1 grid grid-cols-12 gap-8 py-4">

                    {/* LEFT: Printer Visualization */}
                    <div className="col-span-7 flex flex-col items-center justify-center relative bg-white/5 rounded-3xl border border-white/10 shadow-inner overflow-hidden">

                        {/* Printer Machine Upper Part */}
                        <div className="absolute top-0 w-full h-50 bg-gradient-to-b from-[#1a1a1c] to-[#0a0a0b] border-b-4 border-[#252528] z-20 flex flex-col items-center justify-center">
                            <div className="w-3/4 h-2 bg-black rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] mb-4" />
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-1 ${status === 'printing' ? 'bg-blue-500' : 'bg-white/10'} rounded-full mb-2 transition-colors duration-500`} />
                                    <span className="text-[8px] text-white/20 uppercase font-bold">Cabezales</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-1 ${status === 'printing' ? 'bg-blue-500 animate-pulse' : 'bg-white/10'} rounded-full mb-2 transition-colors duration-500`} />
                                    <span className="text-[8px] text-white/20 uppercase font-bold">Alimentación</span>
                                </div>
                            </div>
                        </div>



                        {/* THE LABEL CANVAS (The Slot - Transparent) */}
                        <div className="relative w-[300px] h-[480px] mt-32 flex justify-center pt-2">
                            <AnimatePresence mode="wait">
                                {currentJob && (
                                    <motion.div
                                        key={currentJob.id}
                                        initial={{ y: -450, opacity: 0 }}
                                        animate={{ y: 10, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        transition={{
                                            y: { ease: "easeInOut", duration: 1 },
                                            opacity: { duration: 1 }
                                        }}
                                        className="absolute top-[30px] rounded-sm overflow-hidden"
                                        style={{ transformOrigin: 'top center' }}
                                    >
                                        <div className="scale-[1] bg-white text-black p-4 w-[280px]">
                                            {currentJob.product && <PrintLabelBodega product={currentJob.product} />}
                                        </div>

                                        {/* Scanline / Printing beam simulation */}
                                        {status === 'printing' && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 h-20 w-full z-10"
                                                animate={{ top: ['0%', '100%'] }}
                                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>


                        </div>

                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />
                    </div>

                    {/* RIGHT: History & Diagnostics */}
                    <div className="col-span-5 flex flex-col space-y-6">

                        {/* Summary Widget */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="text-[10px] text-white/30 uppercase font-bold mb-1">Estado de Cola</div>
                                <div className="text-xl font-bold font-mono">EN ESPERA</div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <div className="text-[10px] text-white/30 uppercase font-bold mb-1">Total Diario</div>
                                <div className="text-xl font-bold font-mono">{history.length + 42} <span className="text-[10px] text-white/20">Unidades</span></div>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-white" />
                                    <h2 className="text-sm font-bold uppercase tracking-tight">Actividad Reciente</h2>
                                </div>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/50">Últimos 5</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                <AnimatePresence initial={false}>
                                    {history.length > 0 ? (
                                        history.map((job, idx) => (
                                            <motion.div
                                                key={job.id}
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 mb-1"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5 overflow-hidden">
                                                    {job.product?.image ? (
                                                        <img src={job.product.image} className="w-full h-full object-cover rounded-md opacity-60" />
                                                    ) : (
                                                        <Box className="w-5 h-5 text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-white/90 truncate uppercase">{job.product?.nameEs || job.product?.name || 'Desconocido'}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-mono text-white/30">{job.productId}</span>
                                                        <span className="text-[8px] bg-green-500/10 text-green-500 px-1 py-0.25 rounded">EXITOSO</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-white/30 font-mono">
                                                        {job.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-white/5 p-12 text-center">
                                            <History className="w-12 h-12 mb-2 opacity-50 text-white" />
                                            <p className="text-[10px] uppercase font-bold tracking-widest">Esperando Registros</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>


                        </div>

                    </div>
                </main>

                {/* Footer Info */}

            </div>
        </div>
    );
}

