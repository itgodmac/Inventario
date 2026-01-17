const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const fs = require('fs');
const path = require('path');

// Correct path without typo
const LOG_FILE = 'C:\\Users\\IT\\.gemini\\antigravity\\brain\\4bb33814-4d9b-4204-b35e-d944239b42d7\\import_result.log';

function log(msg) {
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
    } catch (e) {
        console.error('Log fail:', e);
    }
}

async function main() {
    try {
        fs.writeFileSync(LOG_FILE, 'Script started...\n');
    } catch (e) { console.error(e); }

    const filePath = path.join(process.cwd(), 'BigMaterials Inv.xlsx');
    log(`Reading ${filePath}...`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read as Array of Arrays to handle variable header rows
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find Header Row
    let headerIdx = -1;
    const colMap = {};

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i];
        // Check for key columns
        if (row.includes('ID') && (row.includes('$ Venta') || row.includes('Stock') || row.includes('Barcode'))) {
            headerIdx = i;
            row.forEach((val, idx) => {
                if (val) colMap[val.trim()] = idx;
            });
            break;
        }
    }

    if (headerIdx === -1) {
        log('❌ Could not find header row containing ID and $ Venta');
        return;
    }

    log(`Found header at row ${headerIdx + 1}`);
    log(`Columns found: ${Object.keys(colMap).join(', ')}`);

    const productsToImport = rows.slice(headerIdx + 1, headerIdx + 3); // Take next 2 rows
    log('\n--- Processing 2 Rows ---');

    for (const row of productsToImport) {
        if (!row || row.length === 0) continue;

        // Helper to get value by col name
        const val = (name) => {
            const idx = colMap[name];
            return idx !== undefined ? row[idx] : undefined;
        }

        const id = val('ID');
        const validId = id ? String(id) : undefined;

        // Handle "Item Code" vs "Barcode"
        const itemCode = val('Item Code');
        const barcode = val('Barcode');
        const sku = itemCode ? String(itemCode) : (barcode ? String(barcode) : (validId ? `GEN-${validId}` : undefined));

        const productData = {
            id: validId,
            sku: sku ? String(sku) : undefined,
            barcode: barcode ? String(barcode) : undefined,
            itemCode: itemCode ? String(itemCode) : undefined,
            name: val('Nombre Esp') || val('Nombre Eng') || val('Descripcion') || 'Unnamed',
            nameEn: val('Nombre Eng') ? String(val('Nombre Eng')) : undefined,
            nameEs: val('Nombre Esp') ? String(val('Nombre Esp')) : undefined,
            description: val('Descripcion') ? String(val('Descripcion')) : undefined,
            category: val('Categoria') ? String(val('Categoria')) : 'Uncategorized',
            image: val('Foto URL') ? String(val('Foto URL')) : undefined,
            stock: val('Stock') ? parseInt(val('Stock')) : 0,
            price: val('$ Venta') ? parseFloat(String(val('$ Venta')).replace(/[^0-9.]/g, '')) : 0,
        };

        if (Number.isNaN(productData.price)) productData.price = 0;
        if (Number.isNaN(productData.stock)) productData.stock = 0;

        log(`Processing: ${productData.name} (SKU: ${productData.sku}, ID: ${productData.id})`);

        try {
            let result;
            if (productData.id) {
                result = await prisma.product.upsert({
                    where: { id: productData.id },
                    update: productData,
                    create: { ...productData, id: productData.id },
                });
            } else if (productData.sku) {
                result = await prisma.product.upsert({
                    where: { sku: productData.sku },
                    update: productData,
                    create: { ...productData },
                });
            } else {
                log('Skipping product without ID or SKU');
                continue;
            }

            log(`✅ Saved: ${result.name} (ID: ${result.id})`);
            log('   Captured: ' + JSON.stringify(result, null, 2));

        } catch (e) {
            log(`❌ Error verifying product: ${e.message}`);
        }
    }
}

main()
    .catch(e => log(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
