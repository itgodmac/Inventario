import { PrismaClient } from '@prisma/client';
import ProductDeviceSwitcher from './ProductDeviceSwitcher';

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

    // Fetch fresh data for Desktop SSR
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { photoId: id },
                { id: id }
            ]
        },
    });

    if (!product) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">Producto no encontrado</h1>
                    <p className="text-gray-500 mb-6">El producto con ID {id} no existe en la base de datos.</p>
                    <a href="/inventory" className="inline-flex items-center gap-2 text-blue-600 font-semibold underline">
                        Ir al Inventario
                    </a>
                </div>
            </div>
        );
    }

    return <ProductDeviceSwitcher product={product} initialId={id} />;
}
