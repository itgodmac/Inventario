
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(process.cwd(), 'public', 'BigMaterials Inv - Inventario .csv');
    console.log(`Reading CSV from: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found!');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    const headerRowIndex = lines.findIndex(line => line.startsWith('ID,Barcode') || line.startsWith('ID,'));

    if (headerRowIndex === -1) {
        console.error('Could not find header row');
        process.exit(1);
    }

    const csvContentToParse = lines.slice(headerRowIndex).join('\n');
    const parsed = Papa.parse(csvContentToParse, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
    });

    const rows = parsed.data;
    console.log(`Parsed ${rows.length} rows.`);

    console.log('Clearing existing product database...');
    try {
        await prisma.product.deleteMany({});
        console.log('Database cleared.');
    } catch (e) {
        console.error("Error clearing database:", e);
    }

    const cleanFloat = (val) => {
        if (!val) return 0;
        const cleaned = val.toString().replace(/[$,\s]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    const cleanInt = (val) => {
        if (!val) return 0;
        const cleaned = val.toString().replace(/[,]/g, '');
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? 0 : num;
    };

    const cleanString = (val) => {
        return val ? val.trim() : null;
    };

    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
            const photoId = cleanString(row['ID']);
            if (!photoId) continue;

            const barcode = cleanString(row['Barcode']);
            const nameEn = cleanString(row['Nombre Eng']);
            const nameEs = cleanString(row['Nombre Esp']);
            const description = cleanString(row['Descripcion']);
            const uvaNombre = cleanString(row['UVA Nombre']);
            const itemCode = cleanString(row['Item Code']);
            const uniCode = cleanString(row['Uni Code']);
            const category = cleanString(row['Categoria']);
            const montaje = cleanString(row['Montaje']);
            const tipo = cleanString(row['Tipo']);
            const rotacion = cleanString(row['Rotacion']);
            const status = cleanString(row['Status']) || 'out-of-stock';
            const notes = cleanString(row['Notes']);
            const pedido = cleanString(row['Pedido']);

            const price = cleanFloat(row['$ Venta']);
            const stock = cleanInt(row['Stock']);
            const priceZG = cleanFloat(row['$ ZG']);
            const priceOth = cleanFloat(row['$ Oth']);
            const priceBM = cleanFloat(row['$ BM']);
            const ptijDll = cleanFloat(row['$ Ptij dll']);
            const ptijMxn = cleanFloat(row['$ Ptij mxn']);
            const vecesG = cleanFloat(row['Veces G']);

            const displayName = nameEs || nameEn || description || `Product ${photoId}`;

            let finalSku = itemCode;

            try {
                await prisma.product.create({
                    data: {
                        photoId, barcode, sku: finalSku, itemCode, uniCode,
                        name: displayName, nameEn, nameEs, description, uvaNombre,
                        category, montaje, tipo, rotacion, status, notes, pedido,
                        stock, price, priceZG, priceOth, priceBM, ptijDll, ptijMxn, vecesG
                    }
                });
                importedCount++;
            } catch (e) {
                // Check for Unique Constraint violation (P2002)
                if (e.code === 'P2002') {
                    // Silently fallback to NULL SKU as requested by user
                    try {
                        await prisma.product.create({
                            data: {
                                photoId, barcode, sku: null, itemCode, uniCode,
                                name: displayName, nameEn, nameEs, description, uvaNombre,
                                category, montaje, tipo, rotacion, status, notes, pedido,
                                stock, price, priceZG, priceOth, priceBM, ptijDll, ptijMxn, vecesG
                            }
                        });
                        importedCount++;
                    } catch (innerE) {
                        console.error(`[Row ${i}] FAILED fallback insert for ID ${photoId}:`, innerE.message);
                        skippedCount++;
                    }
                } else {
                    console.error(`[Row ${i}] Error inserting ID ${photoId}:`, e.message);
                    skippedCount++;
                }
            }
        } catch (outerE) {
            console.error(`[Row ${i}] Fatal processing error:`, outerE);
            skippedCount++;
        }

        if (importedCount > 0 && importedCount % 200 === 0) {
            console.log(`Imported ${importedCount} products...`);
        }
    }

    console.log('\n------------------------------------------------');
    console.log(`Import Complete.`);
    console.log(`Success: ${importedCount}`);
    console.log(`Skipped/Failed: ${skippedCount}`);

    const finalCount = await prisma.product.count();
    console.log(`Final DB Count: ${finalCount}`);
    console.log('------------------------------------------------');
}

main()
    .catch((e) => {
        console.error("Main script error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
