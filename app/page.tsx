'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    const container = useRef(null);
    const heroRef = useRef(null);
    const subtitleRef = useRef(null);
    const ctaRef = useRef(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline();

        // Hero Title Animation
        tl.from(heroRef.current, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
        })
            .from(subtitleRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
            }, "-=0.4")
            .from(ctaRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.6,
                ease: "power3.out",
            }, "-=0.3");

        // Cards stagger animation
        if (cardsRef.current) {
            const cards = cardsRef.current.querySelectorAll('.feature-card');
            gsap.from(cards, {
                y: 60,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: cardsRef.current,
                    start: "top 80%",
                }
            });
        }

        // Floating animation for logo
        gsap.to(".floating-logo", {
            y: -12,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: container });

    return (
        <main ref={container} className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">R</span>
                        </div>
                        <span className="text-xl font-semibold text-gray-900">RIPODOO</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">Features</a>
                        <a href="#modules" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">Modules</a>
                        <a href="#docs" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">Documentation</a>
                        <button className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div ref={heroRef}>
                        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Build the new way
                        </h1>
                    </div>
                    <div ref={subtitleRef}>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Next-generation ERP architecture powered by modern web technologies.
                            Experience seamless workflows with RIPODOO.
                        </p>
                    </div>
                    <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:shadow-lg">
                            Start Building
                        </button>
                        <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-medium text-lg hover:border-blue-600 hover:text-blue-600 transition-all">
                            View Demo
                        </button>
                    </div>
                </div>

                {/* Floating Logo */}
                <div className="flex justify-center mt-20">
                    <div className="floating-logo w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl shadow-2xl flex items-center justify-center">
                        <span className="text-white text-5xl font-bold">R</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
                        Powerful features
                    </h2>
                    <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                        Everything you need to manage your business operations efficiently
                    </p>

                    <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
                        <div className="feature-card bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Built on Next.js 16 with Turbopack for instant page loads and seamless navigation.
                            </p>
                        </div>

                        <div className="feature-card bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Real-time Sync</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Keep your data synchronized across all devices with Pusher real-time updates.
                            </p>
                        </div>

                        <div className="feature-card bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Fully Modular</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Start with what you need. Add modules like Sales, Inventory, and Accounting as you grow.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modules Section */}
            <section id="modules" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-16">
                        Explore modules
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <a href="/inventory" className="group block p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-semibold text-gray-900">Inventory</h3>
                                <svg className="w-6 h-6 text-blue-600 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-700">Manage stock, track inventory levels, and automate replenishment.</p>
                        </a>

                        <a href="/sales" className="group block p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-semibold text-gray-900">Sales</h3>
                                <svg className="w-6 h-6 text-green-600 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-700">Create quotes, manage orders, and track sales performance.</p>
                        </a>

                        <a href="/accounting" className="group block p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-semibold text-gray-900">Accounting</h3>
                                <svg className="w-6 h-6 text-purple-600 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-700">Handle invoicing, expenses, and financial reporting with ease.</p>
                        </a>

                        <a href="/crm" className="group block p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-semibold text-gray-900">CRM</h3>
                                <svg className="w-6 h-6 text-orange-600 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-gray-700">Build stronger customer relationships and track interactions.</p>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-sm">R</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">RIPODOO</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Built with Next.js, Prisma, and GSAP
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        © 2025 RIPODOO. All rights reserved.
                    </p>
                </div>
            </footer>
        </main>
    );
}
