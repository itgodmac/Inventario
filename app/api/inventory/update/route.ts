import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

// Prevent multiple instances in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Initialize Redis (safely)
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, quantity, difference, auditor } = body;

        console.log("📝 [API] Updating Product:", { id, quantity, auditor });

        if (!id) {
            return NextResponse.json({ status: 'error', message: "Missing ID" }, { status: 400 });
        }

        // 1. Get current product first
        const currentProduct = await prisma.product.findUnique({
            where: { id: id }
        });

        if (!currentProduct) {
            return NextResponse.json({ status: 'error', message: "Product not found" }, { status: 404 });
        }

        // 2. Update Database
        const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: {
                stock: quantity,
                lastAuditor: auditor,
            }
        });

        // 3. Create Stock Log
        await prisma.stockLog.create({
            data: {
                productId: updatedProduct.id,
                productSku: updatedProduct.sku,
                productName: updatedProduct.nameEs || updatedProduct.name,
                oldQuantity: currentProduct.stock,
                newQuantity: quantity,
                difference: difference,
                auditor: auditor || 'TEST',
            }
        });

        // 4. Broadcast to SSE clients via Redis list
        if (redis) {
            const event = {
                type: 'STOCK_UPDATE',
                payload: {
                    id: updatedProduct.id,
                    stock: updatedProduct.stock,
                    auditor: auditor,
                    timestamp: new Date().toISOString()
                }
            };

            // Push event to Redis list for SSE endpoints to consume
            await redis.lpush('inventory-events', JSON.stringify(event));
            // Set TTL to auto-cleanup old events (5 seconds)
            await redis.expire('inventory-events', 5);

            console.log("📡 [API] Broadcasted inventory update");
        } else {
            console.warn("⚠️ [API] Redis not configured, skipping realtime broadcast");
        }

        return NextResponse.json({
            status: 'success',
            product: updatedProduct
        });

    } catch (error: any) {
        console.error("🔥 [API] Update Error:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
