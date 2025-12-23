'use client';

import Link from 'next/link';

export default function DashboardHeader({ appName = 'Inventory' }: { appName?: string }) {
    return (
        <header className="sticky top-0 z-[60] bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-white/5 text-white supports-[backdrop-filter]:bg-[#1C1C1E]/80 transition-all duration-500">
            <div className="w-full px-4 h-14 flex items-center justify-between gap-4">
                {/* Left: App Switcher & Navigation */}
                <div className="flex items-center gap-6">
                    {/* App Switcher */}
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg>
                    </Link>

                    {/* App Brand */}
                    <div className="font-semibold text-[17px] tracking-tight text-white hidden md:block">{appName}</div>

                    {/* Desktop Menu Items */}
                    <nav className="hidden lg:flex items-center gap-1 ml-4">
                        {['Overview', 'Operations', 'Products', 'Reporting', 'Configuration'].map((item) => (
                            <button
                                key={item}
                                className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${item === 'Products'
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right: System Tray */}
                <div className="flex items-center gap-3">
                    {/* Search Icon (Mobile/Compact) */}
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors lg:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>

                    {/* Chat / Activities */}
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#1C1C1E]"></span>
                    </button>

                    {/* Notifications */}
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </button>

                    {/* User Profile */}
                    <button className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-white/10 rounded-lg transition-colors ml-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs text-white font-bold border border-white/10">
                            SA
                        </div>
                        <span className="text-[13px] font-medium hidden sm:block">System Admin</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu (Sub-header) */}
            <div className="lg:hidden h-10 border-t border-white/5 overflow-x-auto no-scrollbar flex items-center px-4 gap-4">
                {['Overview', 'Operations', 'Products', 'Reporting', 'Configuration'].map((item) => (
                    <button
                        key={item}
                        className={`text-[13px] font-medium whitespace-nowrap transition-colors ${item === 'Products'
                                ? 'text-white'
                                : 'text-gray-400'
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>
        </header>
    );
}
