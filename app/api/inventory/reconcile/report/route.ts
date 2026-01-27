import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Get all products
        const allProducts = await prisma.product.findMany({
            select: {
                id: true,
                sku: true,
                photoId: true,
                nameEn: true,
                nameEs: true,
                image: true,
            },
        });

        // Products without images
        const missingImages = allProducts.filter(p => !p.image);

        // Products with images (for stats)
        const withImages = allProducts.filter(p => p.image);

        const report = {
            total: allProducts.length,
            withImages: withImages.length,
            withoutImages: missingImages.length,
            coveragePercent: ((withImages.length / allProducts.length) * 100).toFixed(2),
            missingImagesList: missingImages.map(p => ({
                id: p.id,
                sku: p.sku,
                photoId: p.photoId,
                name: p.nameEs || p.nameEn || 'Sin Nombre',
            })),
        };

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
