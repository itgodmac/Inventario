import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Configuration
const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';
const IMAGES_PATH = '\\\\MCA-S\\mk\\2_BM\\50_LibInv'; // Global repository
const UPLOAD_API_URL = 'http://127.0.0.1:3000/api/upload';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getDollarRate(): Promise<number> {
    try {
        console.log('🌐 Fetching real-time USD/MXN rate...');
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json() as any;
        const rate = data.rates.MXN;
        console.log(`💵 Current exchange rate: 1 USD = ${rate} MXN`);
        return rate;
    } catch (error) {
        console.error('❌ Error fetching dollar rate, using fallback 18.5:', error);
        return 18.5;
    }
}

async function uploadImage(imagePath: string, sku: string, retries = 3): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(imagePath));
            formData.append('productId', sku);

            const response = await fetch(UPLOAD_API_URL, {
                method: 'POST',
                body: formData as any,
                timeout: 30000, // 30s timeout
            } as any);

            const data = await response.json() as any;
            if (data.success) {
                return data.url;
            } else {
                console.error(`❌ Upload failed for ${sku} (Attempt ${i + 1}): ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`❌ Error uploading image for ${sku} (Attempt ${i + 1}):`, error);
            await sleep(1000); // Wait 1s before retry
        }
    }
    return null;
}

async function main() {
    console.log('--- STARTING MASS INGESTION ---');

    // 1. Clear DB (safety as user requested "Borra Todo")
    // Note: reset was already run via command line, but good to be sure

    const rate = await getDollarRate();

    console.log(`📖 Loading Excel from: ${EXCEL_PATH}`);
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Using header: 1 to get raw arrays for absolute index mapping
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 }) as any[][];

    // Row index 0 in rawRows is our header row from Excel (Row 3).
    // Row index 1 is our first data row (Row 4).
    const headers = rawRows[0];
    const dataRows = rawRows.slice(1);

    console.log(`📊 Total data rows found: ${dataRows.length}`);

    let processed = 0;
    let imagesUploaded = 0;

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];

        // Mapping by Index (A=0, B=1, etc.)
        const photoId = row[0]?.toString().trim() || null;
        const barcode = row[1]?.toString().trim() || null;
        // Skip Foto URL at 2
        const nameEng = row[3]?.toString().trim() || '';
        const nameEsp = row[4]?.toString().trim() || '';
        const description = row[5]?.toString().trim() || '';
        const uvaNombre = row[6]?.toString().trim() || '';
        const rawItemCode = row[7]?.toString().trim(); // SKU

        // Robust SKU Logic: Use Item Code, Barcode, or ID as the unique key
        const itemCode = rawItemCode || barcode || (photoId ? `ID-${photoId}` : null);

        if (!itemCode) {
            console.log(`⚠️  Skipping row ${i + 4}: No Item Code, Barcode, or ID found.`);
            continue;
        }
        const uniCode = row[8]?.toString().trim() || null;
        const category = row[9]?.toString().trim() || 'SIN ASIGNAR';
        const montaje = row[10]?.toString().trim() || '';
        const tipo = row[11]?.toString().trim() || '';

        const priceVenta = parseFloat(row[12]) || 0;
        const rotacion = row[13]?.toString().trim() || null;
        const stock = parseInt(row[14]) || 0;
        const statusRaw = row[15]?.toString().toLowerCase().trim() || '';
        const notes = row[16]?.toString().trim() || null;
        const pedido = row[17]?.toString().trim() || null;

        const priceZG = parseFloat(row[18]) || 0;
        const priceOth = parseFloat(row[19]) || 0;
        const priceBM = parseFloat(row[20]) || 0;
        const ptijDll = parseFloat(row[21]) || 0;
        const ptijMxn = parseFloat(row[22]) || 0;
        const vecesG = parseFloat(row[23]) || 0;

        // Normalizing status
        let status = 'in-stock';
        if (statusRaw === 'borrar') status = 'borrar';
        else if (stock <= 0) status = 'out-of-stock';
        else if (stock < 5) status = 'low-stock';

        try {
            const product = await (prisma.product as any).upsert({
                where: { sku: itemCode },
                update: {
                    barcode, itemCode, photoId, name: nameEsp || nameEng || 'Sin Nombre',
                    nameEn: nameEng, nameEs: nameEsp, uvaNombre, uniCode,
                    category, description, montaje, tipo,
                    price: priceVenta, priceZG, priceOth, priceBM,
                    ptijDll, ptijMxn, vecesG, stock, status,
                    notes, pedido, rotacion
                },
                create: {
                    sku: itemCode, barcode, itemCode, photoId, name: nameEsp || nameEng || 'Sin Nombre',
                    nameEn: nameEng, nameEs: nameEsp, uvaNombre, uniCode,
                    category, description, montaje, tipo,
                    price: priceVenta, priceZG, priceOth, priceBM,
                    ptijDll, ptijMxn, vecesG, stock, status,
                    notes, pedido, rotacion
                },
            });

            // Image lookup by Photo ID (Column A)
            const extensions = ['.png', '.jpg', '.jpeg'];
            let foundImagePath: string | null = null;

            if (photoId) {
                for (const ext of extensions) {
                    const testPath = path.join(IMAGES_PATH, `${photoId}${ext}`);
                    if (fs.existsSync(testPath)) {
                        foundImagePath = testPath;
                        break;
                    }
                }
            }

            if (foundImagePath) {
                const imageUrl = await uploadImage(foundImagePath, itemCode);
                if (imageUrl) {
                    await prisma.product.update({
                        where: { id: product.id },
                        data: { image: imageUrl },
                    });
                    imagesUploaded++;
                }
                await sleep(50); // Small delay to avoid hammering the local server
            }

            processed++;
            if (processed % 50 === 0) {
                console.log(`🚀 Progress: ${processed}/${dataRows.length} products synced... (${imagesUploaded} images)`);
            }
        } catch (error) {
            console.error(`❌ Error syncing product ${itemCode}:`, error);
        }
    }

    console.log(`\n✨ SYNC FINISHED!`);
    console.log(`📦 Total Products: ${processed}`);
    console.log(`🖼️ Total Images Uploaded: ${imagesUploaded}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
