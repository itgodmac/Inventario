
import React from 'react';
import { PrismaClient } from '@prisma/client';
import PrintLabelBodega from '@/app/components/print/PrintLabelBodega';
import PrintTrigger from './PrintTrigger';
import { Product } from '@/app/lib/types';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export default async function PrintBodegaPage({
    searchParams,
}: {
    searchParams: Promise<{ ids: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const ids = resolvedSearchParams.ids ? resolvedSearchParams.ids.split(',') : [];

    if (ids.length === 0) {
        return <div>No hay productos seleccionados para imprimir.</div>;
    }

    const products = await prisma.product.findMany({
        where: {
            id: {
                in: ids,
            },
        },
    });

    // Basic styling for the print page to arrange labels
    // We can just stack them or use a grid if needed.
    // The layout.tsx handles page size for each item? 
    // Actually usually you want one label per 'page' or a continuous stream if it's a roll printer.
    // For roll printers (Brother), usually just having them sequentially is fine as long as page break is handled.

    return (
        <div className="flex flex-col">
            {products.map((product) => (
                <PrintLabelBodega key={product.id} product={product as unknown as Product} />
            ))}
            <PrintTrigger />
        </div>
    );
}
