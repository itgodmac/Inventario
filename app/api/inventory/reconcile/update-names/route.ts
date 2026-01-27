import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating names:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update names' },
            { status: 500 }
        );
    }
}
