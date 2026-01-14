'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<any>(null);
    const codeReader = useRef(new BrowserMultiFormatReader());

    // UI States
    const [isVideoStarted, setIsVideoStarted] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const startScanner = async () => {
            try {
                // 1. Force Request Permission by asking for a stream FIRST.
                // This triggers the browser prompt on iOS/Android.
                // We request "environment" (back camera) specifically.
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                // 2. Assign stream to video element to verify it works
                // Note: ZXing's decodeFromStream will handle this, but explicit request ensures permission.

                // 3. Now that we have permission, List Devices for the switcher
                try {
                    const allDevices = await navigator.mediaDevices.enumerateDevices();
                    const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
                    if (mounted) setDevices(videoInputs);
                } catch (e) {
                    console.warn("Could not enumerate devices", e);
                }

                // 4. Start Decoding from the stream
                const controls = await codeReader.current.decodeFromStream(
                    stream,
                    videoRef.current!,
                    (result, err) => {
                        if (result) {
                            onScanSuccess(result.getText());
                            controls.stop();
                        }
                    }
                );

                controlsRef.current = controls;
                setIsVideoStarted(true);

            } catch (err: any) {
                console.error("Camera access error:", err);

                let msg = "No se pudo acceder a la cámara.";
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    msg = "Permiso denegado. Habilita la cámara en tu navegador.";
                } else if (err.name === 'NotFoundError') {
                    msg = "No se encontró ninguna cámara.";
                } else if (typeof window !== 'undefined' && !window.isSecureContext) {
                    msg = "Error de seguridad: Necesitas HTTPS para usar la cámara.";
                }

                if (mounted) setError(msg);
            }
        };

        // Delay start slightly to ensure DOM is ready and prevent potential double-init issues
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            mounted = false;
            if (controlsRef.current) {
                controlsRef.current.stop();
            }
        };
    }, [onScanSuccess]);

    // Handle manual camera switch
    const handleDeviceChange = async (newDeviceId: string) => {
        setSelectedDeviceId(newDeviceId);
        if (controlsRef.current) controlsRef.current.stop();

        try {
            const controls = await codeReader.current.decodeFromVideoDevice(
                newDeviceId,
                videoRef.current!,
                (result, err) => {
                    if (result) {
                        onScanSuccess(result.getText());
                        controls.stop();
                    }
                }
            );
            controlsRef.current = controls;
        } catch (e) {
            console.error("Failed to switch", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20">
                <h3 className="text-white font-bold drop-shadow-md">Escanear</h3>
                <button
                    onClick={onClose}
                    className="p-2 bg-black/40 text-white rounded-full backdrop-blur-md"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="relative w-full h-full bg-black">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />

                {/* Guide */}
                {!error && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[80%] aspect-square border-2 border-green-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
                            <div className="absolute top-1/2 w-full h-0.5 bg-red-500/80 animate-pulse"></div>
                            <p className="absolute -bottom-10 w-full text-center text-white text-sm font-medium">Coloca el código aquí</p>
                        </div>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8 text-center z-50">
                        <div>
                            <div className="text-red-500 text-5xl mb-4">📷🚫</div>
                            <p className="text-white text-lg font-bold mb-2">{error}</p>
                            <p className="text-gray-400 text-sm mb-6">Revisa que estés en HTTPS y hayas dado permiso.</p>
                            <button onClick={onClose} className="bg-white text-black px-6 py-2 rounded-full font-bold">Cerrar</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Switcher */}
            {devices.length > 1 && !error && (
                <div className="absolute bottom-8 z-30 w-full flex justify-center">
                    <select
                        onChange={(e) => handleDeviceChange(e.target.value)}
                        value={selectedDeviceId}
                        className="bg-black/60 text-white border border-white/20 rounded-full px-4 py-2 text-sm backdrop-blur-md appearance-none text-center"
                    >
                        <option value="">Cambiar Cámara 📷</option>
                        {devices.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Cámara ${d.deviceId.slice(0, 4)}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
