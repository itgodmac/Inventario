import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

// Prevent multiple instances in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return NextResponse.json({ status: 'error', message: 'Product not found' }, { status: 404 });
        }

        const userAgent = request.headers.get('User-Agent') || '';
        const isPrinter = !userAgent.includes('Mozilla');

        if (isPrinter) {
            // FORCE FINAL LAYOUT FOR PRINTER ONLY
            // -----------------------------------------------------------
            // Field 'uvaNombre' -> Top Right
            // Field 'name'      -> Middle Big Text (OEM)
            // Field 'itemCode'  -> Bottom Small Text (Name)

            const valUva = product.uvaNombre || '';
            const valOem = product.itemCode || product.sku || '';
            const valName = product.nameEs || product.name || '';

            return NextResponse.json({
                status: 'success',
                product: {
                    ...product,
                    uvaNombre: valUva,
                    name: valOem,
                    nameEs: valOem,
                    itemCode: valName
                }
            });
        }

        return NextResponse.json({ status: 'success', product });
    } catch (error: any) {
        console.error("🔥 [API] Fetch Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            name, nameEn, nameEs,
            sku, barcode, itemCode, uniCode,
            uvaNombre, description,
            category, montaje, tipo, status, stock,
            priceZG, priceOth, image
        } = body;

        console.log(`📝 [API] Updating Product ${id}:`, body);

        // Pricing Logic
        const zg = parseFloat(priceZG) || 0;
        const oth = parseFloat(priceOth) || 0;

        const config = await getPricingSettings(prisma);

        let bm_usd = 0;
        if (oth > 0) {
            bm_usd = oth * config.L1;
        }

        const finalPriceMxn = bm_usd * config.I1;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: name || nameEn || 'Unnamed',
                nameEn: nameEn || null,
                nameEs: nameEs || null,

                sku: sku || null,
                barcode: barcode || null,
                itemCode: itemCode || null,
                uniCode: uniCode || null,

                uvaNombre: uvaNombre || null,
                description: description || null,

                category: category || null,
                montaje: montaje || null,
                tipo: tipo || null,

                status,
                stock: parseInt(stock),

                // Pricing
                priceZG: zg,
                priceOth: oth,
                price: finalPriceMxn,

                // Image
                image: image || null
            }
        });

        // Broadcast update
        if (redis) {
            await redis.publish('inventory-updates', JSON.stringify({
                type: 'PRODUCT_UPDATE',
                payload: updatedProduct
            }));
        }

        return NextResponse.json({ status: 'success', product: updatedProduct });
    } catch (error: any) {
        console.error("🔥 [API] Update Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        console.log(`🗑️ [API] Deleting Product ${id}`);

        await prisma.product.delete({
            where: { id }
        });

        // Broadcast delete
        if (redis) {
            await redis.publish('inventory-updates', JSON.stringify({
                type: 'PRODUCT_DELETE',
                payload: { id }
            }));
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error("🔥 [API] Delete Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
