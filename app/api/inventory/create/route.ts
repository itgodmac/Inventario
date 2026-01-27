import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Remove ID if present (it's 'new-phantom') and any undefineds
        const { id, ...createData } = body;

        console.log("📝 [API] Creating Product:", createData);

        // --- AUTO-GENERATION LOGIC ---

        // 1. Get next Barcode (Max + 1)
        let nextBarcode = '75045892565'; // Fallback start
        const lastBarcodeProduct = await prisma.product.findFirst({
            where: { barcode: { not: null } },
            orderBy: { barcode: 'desc' },
            select: { barcode: true }
        });

        if (lastBarcodeProduct && lastBarcodeProduct.barcode) {
            try {
                const currentNumeric = BigInt(lastBarcodeProduct.barcode);
                nextBarcode = (currentNumeric + BigInt(1)).toString();
            } catch (e) {
                console.warn("⚠️ [API] Last barcode was not numeric:", lastBarcodeProduct.barcode);
            }
        }

        // 2. Get next PhotoID (Max + 1)
        let nextPhotoId = '1';
        // Note: Simple string sort may fail for numeric ordering ('10' < '2'), but sufficient for fixed length.
        const lastPhotoIdProduct = await prisma.product.findFirst({
            where: { photoId: { not: null } },
            orderBy: { photoId: 'desc' },
            select: { photoId: true }
        });

        if (lastPhotoIdProduct && lastPhotoIdProduct.photoId) {
            const currentId = parseInt(lastPhotoIdProduct.photoId);
            if (!isNaN(currentId)) {
                nextPhotoId = (currentId + 1).toString();
            }
        }

        // Apply generated values if not provided
        if (!createData.barcode) createData.barcode = nextBarcode;
        if (!createData.photoId) createData.photoId = nextPhotoId;

        // Defaults
        if (!createData.stock) createData.stock = 0;
        if (!createData.status) createData.status = 'available';

        const newProduct = await prisma.product.create({
            data: {
                ...createData,
                // Ensure required fields if schema enforces them. 
                // Schema usually requires SKU.
            }
        });

        // Broadcast
        if (redis) {
            const event = {
                type: 'PRODUCT_CREATED',
                payload: { product: newProduct, timestamp: new Date().toISOString() }
            };
            await redis.lpush('inventory-events', JSON.stringify(event));
            await redis.expire('inventory-events', 5);
        }

        return NextResponse.json({
            status: 'success',
            product: newProduct
        });

    } catch (error: any) {
        console.error("🔥 [API] Create Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
