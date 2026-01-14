import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // 1. Get current settings
        const settings = await prisma.systemSettings.findMany();
        const map: Record<string, number> = {};
        settings.forEach(s => map[s.key] = s.value);

        const L1 = map['PRICE_L1_COMP_FACTOR'] ?? 0.96;
        const I1 = map['PRICE_I1_EXCHANGE_SALE'] ?? 18.5;

        // 2. Get all products
        const products = await prisma.product.findMany();

        let updated = 0;
        let skipped = 0;

        // 3. Recalculate each product
        for (const product of products) {
            // Only recalculate if product has competitor price
            if (product.priceOth && product.priceOth > 0) {
                const bm_usd = product.priceOth * L1;
                const newPrice = bm_usd * I1;

                await prisma.product.update({
                    where: { id: product.id },
                    data: { price: newPrice }
                });

                updated++;
            } else {
                skipped++;
            }
        }

        return NextResponse.json({
            status: 'success',
            updated,
            skipped,
            message: `${updated} productos actualizados, ${skipped} sin precio competencia`
        });
    } catch (error: any) {
        console.error('Recalculate Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
