import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const logs = await prisma.stockLog.findMany({
            where: { productId: id },
            orderBy: { timestamp: 'desc' },
            take: 10 // Last 10 logs
        });

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
