import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { canSeeZeroStock } from '@/lib/permissions';

// Prevent multiple instances in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export async function GET() {
    try {
        const session = await auth();

        // Build query filter
        const where: any = {};

        // Filter zero-stock products for viewers
        if (!canSeeZeroStock(session)) {
            where.stock = { gt: 0 };
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

// Helper to get pricing settings
async function getPricingSettings(prisma: PrismaClient) {
    try {
        const settings = await prisma.systemSettings.findMany();
        const map: Record<string, number> = {};

        settings.forEach(s => map[s.key] = s.value);

        return {
            L1: map['PRICE_L1_COMP_FACTOR'] ?? 0.96,
            Q1: map['PRICE_Q1_IMPORT_FACTOR'] ?? 0.225,
            S1: map['PRICE_S1_EXCHANGE_COST'] ?? 18.75,
            I1: map['PRICE_I1_EXCHANGE_SALE'] ?? 18.5,
            O1: map['PRICE_O1_EXTRA_FACTOR'] ?? 0.0,
        };
    } catch (e) {
        console.error("Failed to fetch settings, using defaults:", e);
        return {
            L1: 0.96, Q1: 0.225, S1: 18.75, I1: 18.5, O1: 0.0
        };
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, nameEn, nameEs,
            sku, barcode, itemCode, uniCode,
            uvaNombre, description,
            category, montaje, tipo, status,
            stock, priceZG, priceOth, image
        } = body;

        // Validation
        const zg = parseFloat(priceZG) || 0;
        const oth = parseFloat(priceOth) || 0;

        // Calc Pricing
        const config = await getPricingSettings(prisma);

        // 1. Calculate BigMachines Price (USD) based on Competitor
        let bm_usd = 0;
        if (oth > 0) {
            bm_usd = oth * config.L1;
        }

        // 2. Calculate Final Sale Price (MXN)
        const finalPriceMxn = bm_usd * config.I1;

        console.log(`🧮 Pricing Calc: ZG=${zg}, Oth=${oth} -> BM=$${bm_usd} -> MXN=$${finalPriceMxn}`);

        const newProduct = await prisma.product.create({
            data: {
                id: crypto.randomUUID(),
                name: name || nameEn || 'New Product',
                nameEn: nameEn || null,
                nameEs: nameEs || null,

                sku: sku || null,
                barcode: barcode || null,
                itemCode: itemCode || null,
                uniCode: uniCode || null,

                uvaNombre: uvaNombre || null,
                description: description || null,

                category: category || 'SIN ASIGNAR',
                montaje: montaje || null,
                tipo: tipo || null,

                stock: parseInt(stock) || 0,
                status: status || ((parseInt(stock) || 0) > 0 ? 'in-stock' : 'out-of-stock'),

                // Pricing Inputs
                priceZG: zg,
                priceOth: oth,

                // Calculated Final Price
                price: finalPriceMxn,

                // Image
                image: image || null
            }
        });

        return NextResponse.json({ status: 'success', product: newProduct });
    } catch (error: any) {
        console.error('Create Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
