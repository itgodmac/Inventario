import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(process.cwd(), 'indesign-export');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

async function downloadImage(url: string, filename: string): Promise<string | null> {
    try {
        const filepath = path.join(IMAGES_DIR, filename);

        // Skip if exists
        if (fs.existsSync(filepath)) {
            return `images/${filename}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        if (!res.body) throw new Error('No body');

        const fileStream = fs.createWriteStream(filepath);
        // Node.js fetch body is a ReadableStream (Web Stream)
        // We can create a Node Readable stream from it for piping
        // @ts-ignore
        await finished(Readable.fromWeb(res.body).pipe(fileStream));

        return `images/${filename}`;
    } catch (error) {
        console.error(`❌ Error downloading ${url}:`, error);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting InDesign Asset Generation...');

    // 1. Create directories
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

    // 2. Fetch products
    const products = await prisma.product.findMany({
        where: {
            status: { not: 'archived' } // Optional filter
        },
        orderBy: { name: 'asc' }
    });

    console.log(`📦 Found ${products.length} products to export`);

    const csvData = [];

    // 3. Process each product
    for (const [index, product] of products.entries()) {
        const sku = product.sku || product.id.substring(0, 8);
        const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        let imagePath = '';

        // Download image if exists
        if (product.image) {
            // Check if it's a Cloudinary URL or already local
            if (product.image.startsWith('http')) {
                const ext = path.extname(product.image) || '.jpg';
                const filename = `${sku}_${safeName}${ext}`;
                const relativePath = await downloadImage(product.image, filename);
                if (relativePath) imagePath = relativePath;
            }
        } else {
            // Handle placeholder or leave empty
            imagePath = '';
        }

        // Add to CSV Data
        // InDesign Data Merge uses @ for image columns
        csvData.push({
            'SKU': product.sku || '',
            'Name': product.name,
            'NameEs': product.nameEs || product.name,
            'NameEn': product.nameEn || '',
            'Price': product.price.toFixed(2),
            'Barcode': product.barcode || '',
            'Category': product.category || '',
            '@Image': imagePath // Special InDesign header for images
        });

        // Progress log
        if ((index + 1) % 10 === 0) {
            console.log(`✅ Processed ${index + 1}/${products.length} products`);
        }
    }

    // 4. Generate CSV
    const csvKey = Papa.unparse(csvData, {
        quotes: true, // Quote all fields to be safe
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, 'data.csv'), csvKey);

    console.log('\n🎉 Export Complete!');
    console.log(`📂 Output Directory: ${OUTPUT_DIR}`);
    console.log('   - data.csv (Load this in InDesign Data Merge)');
    console.log('   - images/  (Contains downloaded assets)');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
