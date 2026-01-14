import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(process.cwd(), 'public', 'BigMaterials Inv - Inventario .csv');
    const csvFile = fs.readFileSync(csvPath, 'utf8');

    console.log('📖 Reading CSV...');

    // Clean parsing: Find the line starting with "ID" manually first
    const allLines = csvFile.split(/\r\n|\n/);
    const headerLineIndex = allLines.findIndex(l => l.startsWith('ID,') || l.startsWith('ID;'));

    if (headerLineIndex === -1) {
        throw new Error("Could not find header row starting with ID");
    }

    const cleanCsv = allLines.slice(headerLineIndex).join('\n');

    const results = Papa.parse(cleanCsv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim()
    });

    const products = [];
    console.log(`🔍 Parsed ${results.data.length} raw rows.`);

    for (const row of results.data as any[]) {
        if (!row['ID']) continue;

        // Clean up price string "$ 1,200.00" -> 1200.00
        const priceRaw = row['$ Venta'] || '0';
        const price = parseFloat(priceRaw.toString().replace(/[$,]/g, '')) || 0;

        const stock = parseInt(row['Stock'] || '0', 10);
        let status = 'out-of-stock';
        if (stock > 5) status = 'in-stock';
        else if (stock > 0) status = 'low-stock';

        // Override if status column exists and is valid
        if (['in-stock', 'low-stock', 'out-of-stock'].includes(row['Status'])) {
            status = row['Status'];
        }

        // Handle potentially duplicate IDs by appending random string if needed, 
        // but for seeding let's trust the CSV ID first, if it fails unique constraint we skip.
        // Actually we will use upsert or skipDuplicates.

        const product = {
            id: row['ID'].toString().trim(),
            name: row['Nombre Esp'] || row['Nombre Eng'] || 'Unnamed Product',
            nameEn: row['Nombre Eng'] || null,
            nameEs: row['Nombre Esp'] || null,
            sku: row['Item Code'] || null,
            barcode: row['Barcode'] ? row['Barcode'].toString() : null,
            itemCode: row['Item Code'] || null,
            category: row['Categoria'] || 'Uncategorized',
            stock: stock,
            price: price,
            status: status,
            image: row['Foto URL'] || null,
            description: row['Descripcion'] || null,
        };

        if (product.name !== 'Unnamed Product' && product.id) {
            products.push(product);
        }
    }

    console.log(`🌱 Found ${products.length} valid products to seed.`);

    // Wipe table (Optional, but good for reliable seed)
    try {
        await prisma.product.deleteMany({});
        console.log('🧹 Cleared existing data.');
    } catch (e) {
        console.warn("⚠️ Could not wipe table. Maybe it doesn't exist yet? Proceeding...");
    }

    // Insert in chunks
    const chunkSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        try {
            await prisma.product.createMany({
                data: chunk,
                skipDuplicates: true
            });
            insertedCount += chunk.length;
            process.stdout.write(`.`);
        } catch (err) {
            console.error(`\n❌ Error inserting chunk ${i}:`, err);
        }
    }

    console.log(`\n🚀 Seeding finished. Inserted/scanned ${insertedCount} products.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
