import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
    try {
        // 1. Get next Barcode (Max + 1)
        let nextBarcode = '75045892565';
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
                // ignore
            }
        }

        // 2. Get next PhotoID (Max + 1)
        let nextPhotoId = '1';
        const lastPhotoIdProduct = await prisma.product.findFirst({
            where: { photoId: { not: null } },
            orderBy: { photoId: 'desc' }, // simple string sort proxy
            select: { photoId: true }
        });

        if (lastPhotoIdProduct && lastPhotoIdProduct.photoId) {
            const currentId = parseInt(lastPhotoIdProduct.photoId);
            if (!isNaN(currentId)) {
                nextPhotoId = (currentId + 1).toString();
            }
        }

        return NextResponse.json({
            status: 'success',
            nextBarcode,
            nextPhotoId
        });

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
