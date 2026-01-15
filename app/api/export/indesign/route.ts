import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import Papa from 'papaparse';
import { PassThrough } from 'stream';

// Prisma Client Instantiation
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set timeout to 60s (Vercel Pro/Hobby limits apply)

export async function GET() {
    try {
        // 1. Setup Stream & Archive
        const stream = new PassThrough();
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Error handling for archive
        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            // We can't really change the response status now as headers are sent
            // But checking 'error' event is good practice
        });

        // Pipe archive data to the response stream
        archive.pipe(stream);

        // 2. Start Async Generation
        // proper pattern: we return the stream immediately, and populate it in background
        generateArchiveContent(archive).catch(err => {
            console.error('Generation failed:', err);
            archive.abort();
        });

        // 3. Return Response
        return new Response(stream as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="inventory-indesign_assets.zip"',
            },
        });

    } catch (error) {
        console.error('Export init error:', error);
        return NextResponse.json({ error: 'Failed to initialize export' }, { status: 500 });
    }
}

async function generateArchiveContent(archive: archiver.Archiver) {
    try {
        console.log('📦 Starting Export Generation...');

        // 1. Fetch Products
        const products = await prisma.product.findMany({
            where: {
                status: { not: 'archived' }
            },
            orderBy: { name: 'asc' }
        });

        console.log(`🔍 Found ${products.length} products`);

        const csvData = [];

        // 2. Process Products
        for (const product of products) {
            const sku = product.sku || product.id.substring(0, 8);
            // Sanitize filename
            const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            let imageFilename = '';
            let imagePathForCsv = '';

            // Handle Image
            if (product.image && product.image.startsWith('http')) {
                try {
                    const ext = product.image.split('.').pop()?.split('?')[0] || 'jpg';
                    imageFilename = `${sku}_${safeName}.${ext}`;

                    // Fetch image buffer
                    const response = await fetch(product.image);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        // Add to ZIP
                        archive.append(buffer, { name: `images/${imageFilename}` });

                        // Set CSV path (relative to CSV file location)
                        // InDesign Data Merge expects paths like "images/pic.jpg" or full paths.
                        // Relative paths work if the CSV is in the same folder as the images folder
                        imagePathForCsv = `images/${imageFilename}`;
                    }
                } catch (imgErr) {
                    console.error(`Failed to download image for ${sku}:`, imgErr);
                }
            }

            // Prepare CSV Row
            // Note: InDesign requires @Image for the image column
            csvData.push({
                'SKU': sku,
                'Name': product.name,
                'NameEs': product.nameEs || product.name,
                'NameEn': product.nameEn || '',
                'Price': product.price.toFixed(2),
                'Barcode': product.barcode || '',
                'Category': product.category || '',
                '@Image': imagePathForCsv
            });
        }

        // 3. Create CSV
        const csvString = Papa.unparse(csvData, {
            quotes: true,
        });

        // Add CSV to ZIP
        archive.append(csvString, { name: 'data.csv' });

        // 4. Finalize
        console.log('🎉 Finalizing Archive...');
        await archive.finalize();

    } catch (error) {
        console.error('Critical error in generator:', error);
        throw error;
    }
}
