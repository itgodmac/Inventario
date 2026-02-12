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
        const product = await prisma.product.findFirst({
            where: { photoId: id }
        });

        if (!product) {
            return NextResponse.json({ status: 'error', message: 'Product not found' }, { status: 404 });
        }

        // FORCE FINAL LAYOUT FOR ALL (Ensures printer script gets it)
        // -----------------------------------------------------------
        // Field 'uvaNombre' -> Top Right
        // Field 'nameEs'    -> Middle Big Text
        // Field 'itemCode'  -> Bottom Small Text

        const valUva = product.uvaNombre || '';
        const valOem = product.itemCode || product.sku || '';
        const valName = product.nameEs || product.name || '';

        const layoutProduct = {
            ...product,
            // TOP -> UVA
            uvaNombre: valUva,

            // MIDDLE (Big Text) -> ITEM CODE (OEM)
            name: valOem,
            nameEs: valOem,
            nameEn: valOem,

            // BOTTOM (Small Text) -> Spanish Name
            itemCode: valName
        };

        return NextResponse.json({ status: 'success', product: layoutProduct });
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
            priceZG, priceOth, image,
            locationRack, locationFloor
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

        // Find product first to get internal ID
        const targetProduct = await prisma.product.findFirst({
            where: { photoId: id },
            select: { id: true }
        });

        if (!targetProduct) {
            return NextResponse.json({ status: 'error', message: 'Product not found' }, { status: 404 });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: targetProduct.id },
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

                // Location
                // @ts-ignore
                locationRack: locationRack || null,
                // @ts-ignore
                locationFloor: locationFloor || null,

                status,
                // stock: parseInt(stock), // REMOVED: Stock should ONLY be updated via inventory logs/counts

                // Pricing
                priceZG: zg,
                priceOth: oth,
                price: finalPriceMxn,

                // Image
                image: image || null
            }
        });

        // 3. Broadcast to SSE clients via Redis list
        if (redis) {
            try {
                const event = {
                    type: 'PRODUCT_UPDATE',
                    payload: {
                        id: updatedProduct.id,
                        timestamp: new Date().toISOString()
                    }
                };
                await redis.lpush('inventory-events', JSON.stringify(event));
                await redis.expire('inventory-events', 10);
                console.log("📡 [API] Broadcasted product update");
            } catch (e) {
                console.warn("⚠️ [API] Redis broadcast failed:", e);
            }
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
        console.log(`🗑️ [API] Deleting Product with photoId ${id}`);

        const targetProduct = await prisma.product.findFirst({
            where: { photoId: id },
            select: { id: true }
        });

        if (!targetProduct) {
            return NextResponse.json({ status: 'error', message: 'Product not found' }, { status: 404 });
        }

        await prisma.product.delete({
            where: { id: targetProduct.id }
        });

        // 3. Broadcast delete
        if (redis) {
            try {
                const event = {
                    type: 'PRODUCT_DELETE',
                    payload: { id, timestamp: new Date().toISOString() }
                };
                await redis.lpush('inventory-events', JSON.stringify(event));
                await redis.expire('inventory-events', 10);
                console.log("📡 [API] Broadcasted product deletion");
            } catch (e) {
                console.warn("⚠️ [API] Redis broadcast failed:", e);
            }
        }

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error("🔥 [API] Delete Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
