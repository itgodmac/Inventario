export default function Loading() {
    return (
        <main className="min-h-screen bg-[#F2F2F7] dark:bg-background pb-24 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-zinc-900 border-b border-[#3C3C43]/10 dark:border-white/10 sticky top-0 z-30">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E5E5EA] dark:bg-zinc-800 animate-pulse"></div>
                            <div className="h-6 w-32 bg-[#E5E5EA] dark:bg-zinc-800 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E5E5EA] dark:bg-zinc-800 animate-pulse"></div>
                            <div className="w-8 h-8 rounded-full bg-[#E5E5EA] dark:bg-zinc-800 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Skeleton */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:max-w-md h-10 bg-white dark:bg-zinc-900 rounded-xl border border-[#3C3C43]/10 dark:border-white/10 animate-pulse"></div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="h-10 w-24 bg-white dark:bg-zinc-900 rounded-lg animate-pulse"></div>
                        <div className="h-10 w-32 bg-[#007AFF]/20 rounded-xl animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 rounded-[16px] p-2.5 md:p-3 shadow-sm border border-[#3C3C43]/5 dark:border-white/5 flex flex-col">
                            <div className="aspect-square rounded-xl bg-[#F2F2F7] dark:bg-zinc-800 mb-3 animate-pulse"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 bg-[#E5E5EA] dark:bg-zinc-800 rounded animate-pulse"></div>
                                <div className="h-3 w-1/2 bg-[#E5E5EA] dark:bg-zinc-800 rounded animate-pulse"></div>
                                <div className="pt-2 flex justify-between items-center">
                                    <div className="h-5 w-16 bg-[#E5E5EA] dark:bg-zinc-800 rounded animate-pulse"></div>
                                    <div className="h-5 w-12 bg-[#E5E5EA] dark:bg-zinc-800 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
