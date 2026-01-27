import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

const IMAGES_PATH = '\\\\MCA-S\\mk\\2_BM\\0_BMat\\08_PYM\\Catalogo actualizado DIC2025\\Imagenes de productos\\Ollas revoldedoras\\CON NUMERO';

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

async function main() {
    try {
        console.log('📖 Reading Excel file...');
        const workbook = XLSX.readFile('d:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Row 46 is index 44
        const targetIndex = 44;
        const row = data[targetIndex] as any;
        if (!row) {
            console.error(`❌ Row at index ${targetIndex} not found!`);
            return;
        }

        const id = row[' ']?.toString().trim();
        const itemCode = row['Dolar al dia']?.toString().trim();
        const nameEn = row['__EMPTY_2']?.toString()?.trim() || '';
        const nameEs = row['__EMPTY_3']?.toString()?.trim() || '';
        const category = row['__EMPTY_6']?.toString()?.trim() || '';
        const barcode = row['__EMPTY']?.toString()?.trim() || itemCode;
        const uvaNombre = row['__EMPTY_5']?.toString()?.trim() || '';

        console.log(`\n🔍 Found Correct Row (Row 46) Data:`);
        console.log(`- ID: ${id}`);
        console.log(`- Item Code (OEM): ${itemCode}`);
        console.log(`- Name Es: ${nameEs}`);
        console.log(`- Barcode: ${barcode}`);
        console.log(`- UVA: ${uvaNombre}`);

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

        console.log(`✅ Product ${itemCode} upserted in DB.`);

        // Check for image
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

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
