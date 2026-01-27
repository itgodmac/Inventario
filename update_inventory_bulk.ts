import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const IMAGES_PATH = '\\\\MCA-S\\mk\\2_BM\\0_BMat\\08_PYM\\Catalogo actualizado DIC2025\\Imagenes de productos\\Ollas revoldedoras\\CON NUMERO';

async function getDollarRate(): Promise<number> {
    try {
        console.log('🌐 Fetching real-time dollar rate...');
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

async function uploadImage(imagePath: string, productId: string): Promise<string | null> {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));
        formData.append('productId', productId);

        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData as any,
        });

        const data = await response.json() as any;
        if (data.success) {
            console.log(`✅ Uploaded image for ${productId}: ${data.url}`);
            return data.url;
        } else {
            console.error(`❌ Failed to upload image for ${productId}:`, data.message);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error uploading image for ${productId}:`, error);
        return null;
    }
}

async function uploadExcelRow(rowIndex: number) {
    try {
        const workbook = XLSX.readFile('d:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Row 3 is index 2

        const row = data[rowIndex] as any;
        if (!row) {
            console.error(`❌ Row at index ${rowIndex} not found!`);
            return;
        }

        const id = row['ID']?.toString().trim();
        const itemCode = row['Item Code']?.toString().trim();
        const barcode = row['Barcode']?.toString().trim() || itemCode;
        const nameEn = row['Nombre Eng']?.toString()?.trim() || '';
        const nameEs = row['Nombre Esp']?.toString()?.trim() || '';
        const category = row['Categoria']?.toString()?.trim() || '';
        const uvaNombre = row['UVA Nombre']?.toString()?.trim() || '';

        console.log(`\n🔍 Processing Row ${rowIndex + 4}: ID ${id}, SKU ${itemCode}`);

        // Create or update product
        const product = await prisma.product.upsert({
            where: { sku: itemCode },
            update: {
                nameEs,
                nameEn,
                category,
                barcode: barcode,
                uvaNombre: uvaNombre,
                itemCode: itemCode,
                name: nameEs || nameEn,
            },
            create: {
                sku: itemCode,
                barcode: barcode,
                itemCode: itemCode,
                uvaNombre: uvaNombre,
                nameEs,
                nameEn,
                name: nameEs || nameEn,
                category,
                price: 0,
                stock: 0,
                status: 'active',
            },
        });

        console.log(`✅ Product ${itemCode} updated in DB.`);

        // Check for image using ID
        const imagePath = path.join(IMAGES_PATH, `${id}.png`);
        if (fs.existsSync(imagePath)) {
            console.log(`🖼️ Image found at ${imagePath}, uploading...`);
            const imageUrl = await uploadImage(imagePath, itemCode);
            if (imageUrl) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { image: imageUrl },
                });
                console.log(`✅ Image linked to product.`);
            }
        } else {
            console.log(`⚠️ Image not found for ID ${id} at ${imagePath}`);
        }
    } catch (e) {
        console.error(`❌ Error processing row ${rowIndex}:`, e);
    }
}

async function main() {
    const rate = await getDollarRate();
    // Here we can update system settings with the new rate if needed
    // But for now we just log it and proceed with row ingestion.

    // Indices:
    // Row 46 -> 42
    // Row 47 -> 43
    // We also uploaded some test IDs earlier: 1730, 1732, 1734, 1768, 1784, 1794, 1802, 1809, 1810, 2590
    // I will search for these IDs in the full data set and re-run them.

    console.log('📖 Re-scanning Excel for previous test IDs and updating rows 46/47...');
    const workbook = XLSX.readFile('d:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const allData = XLSX.utils.sheet_to_json(sheet, { range: 2 });

    const PREVIOUS_IDS = ['1730', '1732', '1734', '1768', '1784', '1794', '1802', '1809', '1810', '2590'];
    const ROWS_TO_PROCESS = [42, 43]; // 46, 47

    for (let i = 0; i < allData.length; i++) {
        const row = allData[i] as any;
        const currentId = row['ID']?.toString().trim();

        if (ROWS_TO_PROCESS.includes(i) || PREVIOUS_IDS.includes(currentId)) {
            await uploadExcelRow(i);
        }
    }

    console.log('\n✨ All requested updates completed!');
}

main().catch(console.error);
