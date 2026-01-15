import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sectionsParam = searchParams.getAll('sections[]');
        const language = searchParams.get('language') || 'es';

        // Fetch products
        const products = await prisma.product.findMany({
            where: sectionsParam.length > 0
                ? { category: { in: sectionsParam } }
                : {},
            orderBy: [
                { category: 'asc' },
                { sku: 'asc' }
            ],
            select: {
                id: true,
                sku: true,
                nameEs: true,
                nameEn: true,
                price: true,
                image: true,
                category: true
            }
        });

        // Group by category
        const grouped = products.reduce((acc: any, product) => {
            const category = product.category || 'Sin Categoría';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({
                id: product.id,
                sku: product.sku,
                name: language === 'es' ? product.nameEs || product.nameEn : product.nameEn || product.nameEs,
                nameEs: product.nameEs,
                nameEn: product.nameEn,
                price: product.price,
                image: product.image
            });
            return acc;
        }, {});

        // Convert to sections array
        const sections = Object.entries(grouped).map(([name, products]) => ({
            name,
            products,
            productCount: (products as any[]).length
        }));

        return NextResponse.json({
            sections,
            totalProducts: products.length,
            totalPages: Math.ceil(products.length / 16),
            generatedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Catalog export error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
