import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import Papa from 'papaparse';
import { PassThrough } from 'stream';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const dateRange = searchParams.get('dateRange'); // '7d', '30d', 'all'
        const sortBy = searchParams.get('sortBy') || 'name'; // 'name', 'newest'

        // 1. Setup Stream
        const stream = new PassThrough();
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => console.error('Archiver error:', err));
        archive.pipe(stream);

        // 2. Start Async Generation
        generateArchiveContent(archive, { category, status, dateRange, sortBy }).catch(err => {
            console.error('Generation failed:', err);
            archive.abort();
        });

        // 3. Return Response with Metadata
        const filename = `inventory-export-${new Date().toISOString().split('T')[0]}.zip`;

        return new Response(stream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Export init error:', error);
        return NextResponse.json({ error: 'Failed to initialize export' }, { status: 500 });
    }
}

interface FilterOptions {
    category?: string | null;
    status?: string | null;
    dateRange?: string | null;
    sortBy?: string | null;
}

async function generateArchiveContent(archive: archiver.Archiver, filters: FilterOptions) {
    try {
        console.log('📦 Starting Export with filters:', filters);

        // Build Query
        const where: any = { status: { not: 'archived' } };

        if (filters.category && filters.category !== 'all') {
            where.category = filters.category;
        }

        if (filters.status && filters.status !== 'all') {
            // Map UI status to DB status if needed, or assume direct match
            where.status = filters.status;
        }

        if (filters.dateRange) {
            const now = new Date();
            if (filters.dateRange === '7d') {
                const date = new Date(now.setDate(now.getDate() - 7));
                where.createdAt = { gte: date };
            } else if (filters.dateRange === '30d') {
                const date = new Date(now.setDate(now.getDate() - 30));
                where.createdAt = { gte: date };
            }
        }

        let orderBy: any = { name: 'asc' };
        if (filters.sortBy === 'newest') {
            orderBy = { createdAt: 'desc' };
        } else if (filters.sortBy === 'stock') {
            orderBy = { stock: 'desc' };
        }

        // Fetch Products
        const products = await prisma.product.findMany({
            where,
            orderBy
        });

        console.log(`🔍 Exporting ${products.length} products`);

        const csvData = [];
        const processedImages = new Set<string>();

        for (const product of products) {
            const sku = product.sku || product.id.substring(0, 8);
            const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            let imageFilename = '';
            let imagePathForCsv = '';

            // Handle Image Download
            if (product.image && product.image.startsWith('http')) {
                try {
                    const ext = product.image.split('.').pop()?.split('?')[0] || 'jpg';
                    imageFilename = `${sku}_${safeName}.${ext}`;

                    // Deduplication check (unlikely but good safety)
                    if (!processedImages.has(imageFilename)) {
                        const response = await fetch(product.image);
                        if (response.ok) {
                            const arrayBuffer = await response.arrayBuffer();
                            archive.append(Buffer.from(arrayBuffer), { name: imageFilename });
                            processedImages.add(imageFilename);
                        }
                    }
                    imagePathForCsv = imageFilename;
                } catch (e) {
                    console.error(`Failed individual image download: ${product.image}`, e);
                }
            }

            // CSV Row
            csvData.push({
                'ITEM CODE': sku,
                'Spanish Name': product.nameEs || product.name,
                'English Name': product.nameEn || '',
                'Category': product.category || ''
            });
        }

        // CSV Generation
        const csvString = Papa.unparse(csvData, { quotes: true });
        archive.append(csvString, { name: 'data.csv' });

        await archive.finalize();

    } catch (error) {
        console.error('Critical generator error:', error);
        throw error;
    }
}
