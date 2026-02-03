'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error('Credenciales inválidas');
            } else {
                toast.success('¡Bienvenido!');
                router.push('/inventory');
                router.refresh();
            }
        } catch (error) {
            toast.error('Ocurrió un error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-zinc-950 font-sans">
            {/* Left Side - Video & Branding */}
            <div className="relative hidden lg:flex lg:w-1/2 min-h-screen overflow-hidden bg-zinc-950">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-95"
                >
                    <source src="/Video.mp4" type="video/mp4" />
                </video>
                {/* Overlay with glass effect branding */}
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/90 via-zinc-950/40 to-transparent" />

                <div className="absolute top-8 left-8 flex items-start gap-3">
                    <Image src="/LOGO.png" alt="Big Maq" width={150} height={50} className="object-contain" priority />
                </div>

                <div className="absolute bottom-24 left-12 max-w-lg space-y-4">
                    <h2 className="text-5xl font-bold text-white leading-tight animate-in slide-in-from-bottom-8 duration-700">
                        Controla En Grande
                    </h2>
                    <p className="text-zinc-300 text-lg animate-in slide-in-from-bottom-6 duration-1000 delay-100">
                        Control total sobre tus piezas, auditorías y órdenes en una sola plataforma unificada.
                    </p>

                    {/* Navigation Dots Simulation */}
                    <div className="flex gap-2 pt-4">
                        <div className="w-8 h-1.5 rounded-full bg-white" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                {/* Mobile Header */}
                <div className="lg:hidden absolute top-6 left-6 flex items-start gap-3">
                    <Image src="/LOGO.png" alt="Big Maq" width={120} height={40} className="object-contain" priority />
                </div>

                <div className="w-full max-w-md space-y-10 animate-in fade-in duration-700">
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            Bienvenido de nuevo
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-base">
                            Ingresa tus credenciales para acceder al sistema BigLink™
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 px-1">
                                Correo electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all text-sm"
                                    placeholder="usuario@dominio.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 px-1">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black dark:accent-white dark:bg-zinc-900 dark:border-zinc-800 transition-all"
                            />
                            <label htmlFor="remember" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                Mantener sesión iniciada
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-zinc-950 text-base font-bold rounded-[14px] shadow-xl shadow-zinc-950/10 dark:shadow-white/5 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Iniciar Sesión"
                            )}
                        </button>
                    </form>

                    <div className="pt-8 text-center">
                        <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            &copy; {new Date().getFullYear()} Big Machines Sa de cv.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
