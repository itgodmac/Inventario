import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();

const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, nameEn, nameEs } = body;

        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'Missing productId' },
                { status: 400 }
            );
        }

        await prisma.product.update({
            where: { id: productId },
            data: {
                nameEn: nameEn || null,
                nameEs: nameEs || null,
                updatedAt: new Date(),
            },
        });

        // 3. Broadcast to SSE clients
        if (redis) {
            try {
                const event = {
                    type: 'PRODUCT_UPDATE',
                    payload: { id: productId, timestamp: new Date().toISOString() }
                };
                await redis.lpush('inventory-events', JSON.stringify(event));
                await redis.expire('inventory-events', 10);
            } catch (e) {
                console.warn("⚠️ [API] Redis broadcast failed:", e);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating names:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update names' },
            { status: 500 }
        );
    }
}
