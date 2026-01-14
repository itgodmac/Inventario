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
    const controlsRef = useRef<any>(null); // IScannerControls
    const codeReader = useRef(new BrowserMultiFormatReader());

    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const initScanner = async () => {
            try {
                // Use standard browser API instead of static library method
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter((d: MediaDeviceInfo) => d.kind === 'videoinput');

                if (mounted) {
                    setVideoInputDevices(videoDevices);
                    // Select back camera if available
                    const backCamera = videoDevices.find((d: MediaDeviceInfo) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                    if (backCamera) {
                        setSelectedDeviceId(backCamera.deviceId);
                    } else if (videoDevices.length > 0) {
                        setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId);
                    }
                }
            } catch (err) {
                console.error("Error listing devices", err);
                if (mounted) setError("Could not access cameras");
            }
        };

        if (typeof window !== 'undefined') {
            initScanner();
        }

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedDeviceId || !videoRef.current) return;

        // Reset any existing reader
        // @ts-ignore - Some versions might not have reset on instance or it behaves differently, but we try clean up
        // codeReader.current.reset(); 

        const startDecoding = async () => {
            try {
                // Using decodeFromVideoDevice from @zxing/browser returns Promise<IScannerControls>
                const controls = await codeReader.current.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current!,
                    (result, err) => {
                        if (result) {
                            onScanSuccess(result.getText());
                            // Stop scanning after success
                            controls.stop();
                        }
                        // Ignore NotFoundException (no code in frame)
                        if (err && !(err instanceof NotFoundException)) {
                            // console.warn(err);
                        }
                    }
                );
                controlsRef.current = controls;
            } catch (err) {
                console.error("Error starting decoder", err);
                setError("Failed to start scanner");
            }
        };

        startDecoding();

        return () => {
            // Cleanup on unmount or device change
            if (controlsRef.current) {
                controlsRef.current.stop();
            }
        };
    }, [selectedDeviceId, onScanSuccess]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div className="text-white">
                    <h3 className="font-bold text-lg">ZXing Scanner</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Viewport */}
            <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                />

                {/* Visual Guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-[150px] border-2 border-green-500/80 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        {/* Laser Scan Line */}
                        <div className="absolute top-1/2 w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                    </div>
                </div>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 text-center text-white z-30">
                        <div>
                            <p className="text-red-400 font-bold mb-2">Error</p>
                            <p>{error}</p>
                            <button onClick={onClose} className="mt-4 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium">Close</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Controls */}
            <div className="absolute bottom-0 w-full p-6 bg-black/80 backdrop-blur-md pb-8 z-20">
                {videoInputDevices.length > 1 && (
                    <div className="flex justify-center">
                        <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="bg-white/10 text-white text-sm py-2 px-4 rounded-lg border border-white/10 outline-none focus:border-green-500"
                        >
                            {videoInputDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <p className="text-center text-white/40 text-xs mt-4">Powered by ZXing</p>
            </div>
        </div>
    );
}
