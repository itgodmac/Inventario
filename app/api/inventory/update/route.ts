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

        // 1. Update Database
        const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: {
                stock: quantity,
                lastAuditor: auditor,
            }
        });

        // 2. Publish Realtime Event (Fire & Forget)
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
            // Publish to 'inventory-updates' channel
            await redis.publish('inventory-updates', JSON.stringify(event));
            console.log("📡 [API] Published to Redis");
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
