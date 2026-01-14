import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get all products with numeric SKUs
        const products = await prisma.product.findMany({
            select: { sku: true },
            where: {
                sku: {
                    not: null
                }
            }
        });

        // Find max numeric SKU
        let maxId = 999; // Start from 999, so first will be 1000

        products.forEach(p => {
            if (p.sku) {
                const numId = parseInt(p.sku);
                if (!isNaN(numId) && numId > maxId) {
                    maxId = numId;
                }
            }
        });

        const nextId = maxId + 1;

        return NextResponse.json({ nextId: String(nextId) });
    } catch (error: any) {
        console.error('Next ID Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
