'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';

// Theme configurations for each company
const themes = {
    bigm: {
        primary: '#C8D900', // Lime green from Big Machines logo
        secondary: '#5A6670', // Gray from Big Machines logo
        name: 'Big Machines',
        domain: '@big-m.mx'
    },
    mca: {
        primary: '#1B3A57', // Navy blue from MCA logo
        secondary: '#9BA5AE', // Light gray from MCA logo
        name: 'MCA Corporation',
        domain: '@macorporation.com'
    },
    default: {
        primary: '#1A73E8', // Google Blue
        secondary: '#5F6368',
        name: 'RIPODOO',
        domain: ''
    }
};

export default function LoginPage() {
    const container = useRef(null);
    const formRef = useRef(null);
    const logoRef = useRef(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentTheme, setCurrentTheme] = useState(themes.default);

    // Detect company from email domain
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        if (value.includes('@big-m.mx')) {
            setCurrentTheme(themes.bigm);
        } else if (value.includes('@macorporation.com')) {
            setCurrentTheme(themes.mca);
        } else {
            setCurrentTheme(themes.default);
        }
    };

    // Magnetic button effect removed

    useGSAP(() => {
        const tl = gsap.timeline();

        tl.from(logoRef.current, {
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            ease: "back.out(1.7)",
        })
            .from(formRef.current, {
                y: 40,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
            }, "-=0.3");

    }, { scope: container });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login attempt:', { email, company: currentTheme.name });
    };

    return (
        <main
            ref={container}
            className="min-h-screen flex items-center justify-center p-6"
            style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.secondary}10 100%)`
            }}
        >
            <div className="w-full max-w-md">
                {/* Logo */}
                <div ref={logoRef} className="text-center mb-8">
                    <div
                        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all duration-500"
                        style={{ backgroundColor: currentTheme.primary }}
                    >
                        <span className="text-white text-3xl font-bold">
                            {currentTheme.name === 'Big Machines' ? 'BM' :
                                currentTheme.name === 'MCA Corporation' ? 'MC' : 'R'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-500">
                        {currentTheme.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Sign in to your account</p>
                </div>

                {/* Form */}
                <div
                    ref={formRef}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-200 dark:border-zinc-800"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={handleEmailChange}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                                placeholder="you@company.com"
                            />
                            {email && currentTheme.domain && (
                                <p className="text-xs mt-2 transition-all duration-500" style={{ color: currentTheme.primary }}>
                                    Detected: {currentTheme.name}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                                onFocus={(e) => e.target.style.borderColor = currentTheme.primary}
                                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Remember */}
                        <div className="flex items-center">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 transition-all"
                                    style={{ accentColor: currentTheme.primary }}
                                />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!email || !password}
                            className={`w-full py-3 px-4 rounded-full font-medium transition-all duration-300 ${(!email || !password) ? 'cursor-not-allowed opacity-70' : 'hover:shadow-lg shadow-md active:scale-95'}`}
                            style={{
                                backgroundColor: (!email || !password) ? '#E5E7EB' : currentTheme.primary,
                                color: (!email || !password) ? '#9CA3AF' : 'white',
                            }}
                        >
                            Sign in
                        </button>
                    </form>


                </div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all inline-flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to home
                    </Link>
                </div>
            </div>
        </main>
    );
}
