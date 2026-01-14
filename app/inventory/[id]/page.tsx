import Link from 'next/link';
import ProductDetailClient from './ProductDetailClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Theme configurations (same as inventory)
const themes = {
    bigm: {
        primary: '#C8D900',
        secondary: '#5A6670',
        name: 'Big Machines',
    },
    mca: {
        primary: '#1B3A57',
        secondary: '#9BA5AE',
        name: 'MCA Corporation',
    },
    default: {
        primary: '#1A73E8',
        secondary: '#5F6368',
        name: 'RIPODOO',
    }
};

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching for detail page

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch fresh data from DB
    const product = await prisma.product.findUnique({
        where: { id: id },
    });

    if (!product) {
        return (
            <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                    <Link href="/inventory" className="text-sm font-medium text-[#007AFF]">
                        ← Back to Inventory
                    </Link>
                </div>
            </main>
        );
    }

    return <ProductDetailClient product={product} currentTheme={themes.bigm} />;
}
