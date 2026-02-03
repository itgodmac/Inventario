'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';
import { HiOutlineGlobeAlt } from 'react-icons/hi';
import { Barcode, Printer, Activity, RefreshCw } from 'lucide-react';
import './landing.css';

gsap.registerPlugin(ScrollTrigger);

// Datos de preview alineados con la app real: name, sku, category, stock, price, status
const PREVIEW_PRODUCTS = [
    { name: 'Pistón de Entrega 230', sku: '725660', category: 'Schwing', stock: 12, price: 42800, status: 'in-stock' as const },
    { name: 'Codo 90° Reforzado', sku: 'CI-90-2', category: 'Cifa', stock: 3, price: 18500, status: 'low-stock' as const },
    { name: 'Válvula S Completa', sku: 'PM-2234', category: 'Putzmeister', stock: 0, price: 9200, status: 'out-of-stock' as const },
    { name: 'Kit Sellos Hidráulicos', sku: 'MK-SEL-X', category: 'Mack', stock: 45, price: 3200, status: 'in-stock' as const },
    { name: 'Filtro Aire Heavy', sku: 'KW-FA-10', category: 'Kenworth', stock: 8, price: 2100, status: 'in-stock' as const },
    { name: 'Camisa 11" Cromada', sku: '723341', category: 'Schwing', stock: 2, price: 15600, status: 'low-stock' as const },
    { name: 'Sensor Presión Pro', sku: 'CI-SEN-P', category: 'CIFA', stock: 15, price: 8900, status: 'in-stock' as const },
    { name: 'Aceite Hidráulico G2', sku: 'GLO-OIL', category: 'Global', stock: 120, price: 450, status: 'in-stock' as const },
];

const PREVIEW_MOBILE = PREVIEW_PRODUCTS.slice(0, 5);
const PREVIEW_CATEGORIES = ['Todo', 'Schwing', 'Cifa', 'Putzmeister', 'Mack', 'Kenworth'];

function getStockColor(status: string) {
    switch (status) {
        case 'in-stock': return '#34C759';
        case 'low-stock': return '#FF9500';
        case 'out-of-stock': return '#FF3B30';
        default: return '#8E8E93';
    }
}

function getStockBadgeClass(stock: number) {
    if (stock === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (stock <= 5) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
}

export default function Home() {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

        tl.from('.nav-item', {
            y: -20,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
        })
            .from('.hero-title span', {
                y: 100,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
            }, '-=0.4')
            .from('.hero-subtitle', {
                y: 20,
                opacity: 0,
                duration: 0.8,
            }, '-=0.6')
            .from('.hero-cta', {
                y: 20,
                opacity: 0,
                duration: 0.8,
            }, '-=0.6')
            .from('.hero-visual', {
                scale: 0.9,
                opacity: 0,
                duration: 1.2,
            }, '-=0.8');


        gsap.to('.blob', {
            x: 'random(-40, 40)',
            y: 'random(-40, 40)',
            duration: 'random(3, 6)',
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: 0.3
        });
    }, { scope: container });

    return (
        <main ref={container} className="min-h-screen bg-[#050505] text-white selection:bg-[#99C221]/30 selection:text-[#99C221] overflow-x-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-[#99C221]/10 blur-[120px] rounded-full blob pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-[#4D4D4D]/20 blur-[100px] rounded-full blob pointer-events-none" />
            <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-[#99C221]/5 blur-[100px] rounded-full blob pointer-events-none" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    <div className="nav-item">
                        <Image src="/LOGO.png" alt="BigMaq" width={140} height={47} className="object-contain brightness-0 invert" />
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 nav-item">
                        <a href="#features" className="px-5 py-2 text-xs font-semibold text-gray-400 hover:text-[#99C221] transition-colors">Características</a>
                        <a href="#workflow" className="px-5 py-2 text-xs font-semibold text-gray-400 hover:text-[#99C221] transition-colors">Proceso</a>
                        <Link href="/login" className="px-6 py-2 bg-[#99C221] text-black rounded-full text-xs font-bold hover:bg-[#88AD1D] transition-all shadow-lg active:scale-95 duration-100 ml-2">
                            Acceder
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-6">
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="hero-title inline-block mb-8">
                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter flex flex-col items-center leading-[0.9]">
                            <span className="block mb-2">GESTIÓN</span>
                            <span className="text-gradient block">INTELIGENTE</span>
                        </h1>
                    </div>

                    <div className="hero-subtitle mb-12">
                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
                            Infraestructura tecnológica de alto rendimiento para el control de inventarios masivos.
                            Potencia tu operación con la precisión de <span className="text-[#99C221] font-bold">BigLink™</span>.
                        </p>
                    </div>

                    <div className="hero-cta flex justify-center items-center">
                        <Link href="/login" className="group px-12 py-5 bg-[#99C221] text-black rounded-full font-bold text-xl hover:shadow-[0_0_40px_rgba(153,194,33,0.4)] transition-all flex items-center gap-3 active:scale-95 duration-100">
                            Acceder al Sistema
                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Hero Visual - Misma composición en móvil y escritorio: canvas fijo escalado en móvil */}
                <div className="hero-visual mt-32 w-full max-w-7xl mx-auto relative px-4 flex justify-center">
                    {/* Altura incrementada para evitar cortes: en móvil 450px, en desktop 750px */}
                    <div className="relative h-[450px] md:h-[750px] w-full flex justify-center">
                        {/* Canvas fijo 960×650: en móvil escalado 0.5 y centrado = misma composición que desktop */}
                        <div className="absolute left-1/2 top-0 w-[960px] h-[650px] -translate-x-1/2 scale-[0.5] md:scale-100 origin-top">
                            <div className="relative w-full h-full">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#99C221]/10 blur-[120px] rounded-full pointer-events-none" />

                                {/* Desktop Mockup - misma posición en móvil y desktop */}
                                <div className="absolute top-0 right-0 w-[85%] aspect-[16/10] bg-[#0A0A0A] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden animate-float-slow ring-1 ring-white/5">
                                    <div className="h-10 bg-[#141414] border-b border-white/5 flex items-center px-4 gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                                        </div>
                                        <div className="mx-auto w-48 md:w-80 h-6 bg-black/40 border border-white/5 rounded-md flex items-center justify-center text-[10px] text-gray-500 font-medium font-mono">
                                            https://biglink.cloud/inventory
                                        </div>
                                    </div>

                                    <div className="p-0 flex flex-col h-full bg-zinc-950">
                                        {/* Header = mismo diseño que InventoryHeader (pill, búsqueda, ordenar, vistas, export, Nuevo) */}
                                        <div className="px-4 pt-4 pb-3">
                                            <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-full px-5 py-2.5 border border-zinc-800/50 flex items-center justify-between gap-3">
                                                <div className="flex-1 max-w-[200px] md:max-w-[280px] relative">
                                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    <span className="block w-full pl-9 pr-3 py-1.5 bg-transparent text-sm text-zinc-400">Buscar...</span>
                                                </div>
                                                <div className="w-px h-5 bg-zinc-700" />
                                                <div className="flex gap-0.5">
                                                    {[0, 1, 2].map((i) => (
                                                        <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 2 ? 'bg-white text-black' : 'bg-zinc-800'}`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="w-px h-5 bg-zinc-700" />
                                                <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </span>
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-full text-xs font-medium">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Nuevo
                                                </span>
                                            </div>
                                        </div>

                                        {/* Grid = mismo diseño que InventoryClient grid view */}
                                        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-hidden flex-1 min-h-0">
                                            {PREVIEW_PRODUCTS.map((p) => (
                                                <div
                                                    key={p.sku}
                                                    className="bg-zinc-900 rounded-[16px] p-2.5 md:p-3 shadow-sm border border-white/5 flex flex-col overflow-hidden"
                                                >
                                                    <div className="aspect-square rounded-xl bg-zinc-800 mb-2.5 md:mb-3 overflow-hidden border border-white/5 relative">
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                        </div>
                                                        <div className="absolute top-2 right-2">
                                                            <span className="w-2.5 h-2.5 rounded-full block border border-white shadow-sm" style={{ backgroundColor: getStockColor(p.status) }} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 flex-1 flex flex-col">
                                                        <h3 className="text-[13px] md:text-[14px] font-semibold text-white leading-tight line-clamp-2 h-[2.5em]">{p.name}</h3>
                                                        <p className="text-[11px] md:text-[12px] text-gray-500 font-medium font-mono truncate">{p.sku}</p>
                                                        <div className="flex items-center justify-between pt-2 mt-auto">
                                                            <span className="text-[14px] md:text-[15px] font-semibold text-white">${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] md:text-[10px] font-semibold uppercase text-white truncate max-w-[60px] md:max-w-[80px]">{p.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Mockup - misma posición en móvil y escritorio (desplazado más al centro) */}
                                <div className="absolute -bottom-12 left-32 md:left-48 w-64 aspect-[9/19] bg-zinc-950 rounded-[3rem] border-[8px] border-zinc-800 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden animate-float-slow-reverse ring-2 ring-white/10 z-30">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-zinc-900 rounded-b-2xl z-40" />

                                    <div className="h-full flex flex-col bg-zinc-950 dark overflow-hidden">
                                        {/* Contenedor escalado 50% para que el contenido "real" quepa en el marco */}
                                        <div className="flex-1 min-h-0 overflow-hidden flex justify-center">
                                            <div className="w-[200%] scale-50 origin-top flex flex-col min-h-[200%]">
                                                {/* Header = mismo que InventoryClient mobile */}
                                                <div className="px-4 pb-3 pt-10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h1 className="text-[32px] font-semibold text-white">Inventario</h1>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                            </div>
                                                            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2v16H3V4zm5 0h2v16H8V4zm5 0h2v16h-2V4zm5 0h3v16h-3V4z" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                                                        {PREVIEW_CATEGORIES.slice(0, 5).map((cat, i) => (
                                                            <span key={cat} className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap ${i === 0 ? 'bg-white text-black shadow-sm' : 'bg-white/10 text-white/80'}`}>
                                                                {cat}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Lista = mismo diseño que InventoryClient mobile list */}
                                                <div className="flex-1 mx-2 rounded-xl p-2.5 bg-zinc-950/50 overflow-hidden mb-6">
                                                    {PREVIEW_MOBILE.map((p) => (
                                                        <div
                                                            key={p.sku}
                                                            className="bg-zinc-900 rounded-lg p-2.5 flex items-center mb-2 last:mb-0 shadow-sm border border-white/10"
                                                        >
                                                            <div className="w-20 h-20 rounded-[10px] bg-zinc-800 flex-shrink-0 overflow-hidden mr-2.5 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-center mb-[5px]">
                                                                    <h3 className="text-[16px] font-semibold text-white flex-1 mr-2.5 line-clamp-2">{p.name}</h3>
                                                                    <span className="text-[16px] text-white">${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <p className="text-[14px] text-zinc-400">{p.sku}</p>
                                                                <div className="flex justify-between items-center mt-1">
                                                                    <span className="text-[14px] text-zinc-400">{p.category}</span>
                                                                    <div className={`px-3 h-6 rounded-xl flex items-center justify-center ${getStockBadgeClass(p.stock)}`}>
                                                                        <span className="text-[12px] font-medium">Stock: {p.stock}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners / Logos Section */}
            <section className="py-20 border-y border-white/5 bg-white/2 overflow-hidden pause-on-hover">
                <div className="animate-marquee gap-20 px-10">
                    {['SCHWING', 'PUTZMEISTER'].map((name, i) => (
                        <div key={i} className="text-3xl font-black text-gray-800 hover:text-[#99C221]/40 transition-colors cursor-default tracking-tighter">
                            {name}
                        </div>
                    ))}
                    {['SCHWING', 'PUTZMEISTER'].map((name, i) => (
                        <div key={`dup-${i}`} className="text-3xl font-black text-gray-800 hover:text-[#99C221]/40 transition-colors cursor-default tracking-tighter">
                            {name}
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works / Workflow */}
            <section id="workflow" className="py-40 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">El Ecosistema BigLink</h2>
                        <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
                            Tres pilares fundamentales diseñados para la sincronización perfecta de tu inventario.
                        </p>
                    </div>

                    <div className="workflow-steps grid md:grid-cols-3 gap-12 lg:gap-20">
                        {[
                            { step: '01', title: 'Auditoría Maestro', desc: 'Sincronización táctil optimizada para reconciliación de stock físico vs digital en tiempo real.' },
                            { step: '02', title: 'Sincronización Real', desc: 'Los datos viajan por nuestra red BigLink™ para actualización instantánea en todos tus dispositivos.' },
                            { step: '03', title: 'Activos de Venta', desc: 'Generación automatizada de recursos para InDesign y exportación nativa de catálogos comerciales.' }
                        ].map((item, i) => (
                            <div key={i} className="workflow-step flex flex-col group">
                                <span className="text-8xl font-black text-white/5 group-hover:text-[#99C221]/20 transition-colors duration-500 mb-[-2rem] ml-[-1rem]">{item.step}</span>
                                <h3 className="text-2xl font-bold mb-6 text-white group-hover:text-[#99C221] transition-colors">{item.title}</h3>
                                <p className="text-gray-400 text-lg leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Expanded Grid */}
            <section id="features" className="py-40 px-6 bg-gradient-to-b from-transparent to-[#99C221]/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-bold mb-8">Potencia tu infraestructura</h2>
                            <p className="text-gray-400 text-xl leading-relaxed mb-12">
                                No es solo una lista de productos. Es una consola de comando centralizada para tu imperio logístico.
                            </p>
                            <ul className="space-y-6">
                                {['Identificación por Código de Barras', 'Impresión de Etiquetas Térmicas', 'Auditoría Maestro en Tiempo Real', 'Automatización de Catálogos (InDesign)'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-4 text-lg font-bold">
                                        <div className="w-6 h-6 rounded-full bg-[#99C221]/20 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-[#99C221]" />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#99C221]/10 blur-3xl rounded-full" />
                            <div className="features-grid grid grid-cols-2 gap-6 relative z-10">
                                {[
                                    { title: 'Identificación de Partes', desc: 'Escaneo de precisión.', icon: <Barcode className="w-8 h-8 text-[#99C221]" /> },
                                    { title: 'Etiquetado de Almacén', desc: 'Impresión térmica nativa.', icon: <Printer className="w-8 h-8 text-[#99C221]" /> },
                                    { title: 'Control de Inventario', desc: 'Control físico vs digital.', icon: <Activity className="w-8 h-8 text-[#99C221]" /> },
                                    { title: 'Sincronización de Datos', desc: 'Sincronización instantánea.', icon: <RefreshCw className="w-8 h-8 text-[#99C221]" /> }
                                ].map((item, i) => (
                                    <div key={i} className="glass-card p-6 rounded-3xl text-center group hover:scale-[1.05] transition-all duration-300">
                                        <div className="flex justify-center mb-4">{item.icon}</div>
                                        <h4 className="font-bold mb-2">{item.title}</h4>
                                        <p className="text-xs text-gray-400 font-medium group-hover:text-[#99C221] transition-colors">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-40 px-6 border-y border-white/5 relative bg-[#050505]">
                <div className="max-w-7xl mx-auto stats-grid grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {[
                        { label: 'Ítems en Sistema', value: '1,425+', detail: 'Catálogo Maestro' },
                        { label: 'Marcas Estratégicas', value: '11', detail: 'Schwing, CIFA, etc.' },
                        { label: 'Sincronización', value: 'Instantánea', detail: 'Alta Disponibilidad' },
                        { label: 'Operación', value: 'Auditada', detail: 'Control de Stock' }
                    ].map((stat, i) => (
                        <div key={i} className="text-center group">
                            <div className="text-5xl md:text-6xl font-black text-gradient mb-3 stat-value tracking-tighter group-hover:scale-110 transition-transform duration-500">
                                {stat.value}
                            </div>
                            <div className="text-[13px] font-black text-gray-500 uppercase tracking-widest mb-1 group-hover:text-[#99C221] transition-colors">{stat.label}</div>
                            <div className="text-[11px] text-gray-700 font-bold uppercase tracking-widest">{stat.detail}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta py-60 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#99C221]/5 blur-[150px] rounded-full pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tighter leading-none">
                        ¿LISTO PARA EL <br />
                        <span className="text-gradient">SIGUIENTE NIVEL?</span>
                    </h2>
                    <p className="text-2xl text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed">
                        Únete a la evolución de la logística industrial con la plataforma líder en el mercado.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link href="/login" className="px-12 py-6 bg-[#99C221] text-black rounded-full font-black text-2xl hover:bg-[#88AD1D] transition-all active:scale-95 glow-primary">
                            ACCEDER AHORA
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-20 border-t border-white/10 bg-gradient-to-b from-[#050505] to-[#0a0a0a] overflow-hidden">
                {/* Línea de acento verde sutil */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#99C221]/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* Logo + frase + redes */}
                        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
                            <Image src="/LOGO.png" alt="BigMaq" width={180} height={60} className="brightness-0 invert mb-3" />
                            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-xs mb-3">
                                Redefiniendo el estándar industrial mediante innovación tecnológica y excelencia operativa.
                            </p>
                            <div className="w-full lg:w-auto">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Síguenos</p>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                    <a
                                        href="https://www.facebook.com/61556267192721"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#99C221]/20 hover:border-[#99C221]/40 hover:text-[#99C221] transition-all duration-200"
                                        aria-label="Facebook BigMaq"
                                    >
                                        <FaFacebookF className="w-5 h-5" />
                                    </a>
                                    <a
                                        href="https://www.instagram.com/bigmaq._/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#99C221]/20 hover:border-[#99C221]/40 hover:text-[#99C221] transition-all duration-200"
                                        aria-label="Instagram BigMaq"
                                    >
                                        <FaInstagram className="w-5 h-5" />
                                    </a>
                                    <a
                                        href="https://www.tiktok.com/@bigmaq_bm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#99C221]/20 hover:border-[#99C221]/40 hover:text-[#99C221] transition-all duration-200"
                                        aria-label="TikTok BigMaq"
                                    >
                                        <FaTiktok className="w-5 h-5" />
                                    </a>
                                    <a
                                        href="https://big-m.mx/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#99C221]/10 border border-[#99C221]/30 text-[#99C221] font-semibold text-sm hover:bg-[#99C221]/20 hover:border-[#99C221]/50 transition-all duration-200"
                                    >
                                        <HiOutlineGlobeAlt className="w-4 h-4" />
                                        big-m.mx
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Enlaces */}
                        <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
                            <div className="flex flex-col items-start">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Soluciones</h4>
                                <ul className="space-y-1 text-[13px] font-medium text-gray-400">
                                    <li><a href="/inventory" className="hover:text-[#99C221] transition-colors">Inventario</a></li>
                                    <li><a href="https://big-m.mx/" target="_blank" rel="noopener noreferrer" className="hover:text-[#99C221] transition-colors">Big Materials</a></li>
                                    <li><a href="https://big-m.mx/" target="_blank" rel="noopener noreferrer" className="hover:text-[#99C221] transition-colors">Venta y Renta</a></li>
                                </ul>
                            </div>
                            <div className="flex flex-col items-start">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Compañía</h4>
                                <ul className="space-y-1 text-[13px] font-medium text-gray-400">
                                    <li><a href="https://big-m.mx/" target="_blank" rel="noopener noreferrer" className="hover:text-[#99C221] transition-colors">Acerca de nosotros</a></li>
                                    <li><a href="https://big-m.mx/" target="_blank" rel="noopener noreferrer" className="hover:text-[#99C221] transition-colors">Contacto</a></li>
                                </ul>
                            </div>
                            <div className="flex flex-col items-start">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Sistema</h4>
                                <ul className="space-y-1 text-[13px] font-medium text-gray-400">
                                    <li><a href="/inventory" className="hover:text-[#99C221] transition-colors">Inventario</a></li>
                                    <li><a href="/login" className="hover:text-[#99C221] transition-colors">Acceder</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barra inferior */}
                <div className="mt-10 border-t border-white/10 bg-black/30">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-gray-500 text-[11px] font-semibold tracking-[0.2em] uppercase text-center sm:text-left">
                            © 2026 BIGMAQ GLOBAL INDUSTRIES. ALL RIGHTS RESERVED.
                        </p>

                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(2deg); }
                }
                @keyframes float-slow-reverse {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(30px) rotate(-2deg); }
                }
                .animate-float-slow {
                    animation: float-slow 8s ease-in-out infinite;
                }
                .animate-float-slow-reverse {
                    animation: float-slow-reverse 10s ease-in-out infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </main>
    );
}
