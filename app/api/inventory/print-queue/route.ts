
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, copies = 1 } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const count = Math.max(1, Math.min(100, Number(copies))); // Limit to 100 copies max safety
        const jobs = [];

        // Create multiple jobs safely
        // Using Promise.all for parallel creation or loop for simplicity
        // Given it's SQLite/Postgres locally, a loop is fine, or createMany if supported
        // printQueue doesn't look like it has unique constraints that prevent dupes

        for (let i = 0; i < count; i++) {
            const job = await prisma.printQueue.create({
                data: { productId }
            });
            jobs.push(job);
        }

        return NextResponse.json({ status: 'success', jobs });
    } catch (error) {
        console.error('Print Queue Error:', error);
        return NextResponse.json({ error: 'Failed to queue job' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Fetch the oldest job
        const job = await prisma.printQueue.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!job) {
            return NextResponse.json({ job: null });
        }

        // Delete it immediately (FIFO - Pop) so it doesn't get printed twice
        // Note: In a robust system we might mark as 'processing' first, 
        // but for this simple "fire and forget" requirement, delete on read is fine.
        await prisma.printQueue.delete({
            where: { id: job.id }
        });

        return NextResponse.json({ job });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to poll queue' }, { status: 500 });
    }
}
