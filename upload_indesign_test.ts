import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// IDs que tienen imagen
const TARGET_IDS = ['1730', '1732', '1734', '1768', '1784', '1794', '1802', '1809', '1810', '2590'];
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
            console.error(`❌ Failed to upload image for ${productId}`);
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

        console.log(`📊 Found ${data.length} total products in Excel`);

        // Debug: Log first row
        if (data.length > 0) {
            console.log('🔍 First row data:', JSON.stringify(data[0], null, 2));
        }

        let uploadedCount = 0;

        let debugCount = 0;
        for (const row of data as any[]) {
            const id = row[' ']?.toString().trim(); // ID column
            const itemCode = row['Dolar al dia']?.toString().trim(); // Item Code

            if (debugCount < 10 && id) {
                console.log(`Debug ID from row: "${id}"`);
                debugCount++;
            }

            // Check if this row matches our target IDs by ID column
            if (!id || !TARGET_IDS.includes(id)) {
                continue;
            }

            console.log(`\n🔍 Processing product ${itemCode}...`);

            const nameEn = row['__EMPTY_2']?.toString()?.trim() || ''; // Nombre Eng
            const nameEs = row['__EMPTY_3']?.toString()?.trim() || ''; // Nombre Esp
            const category = row['__EMPTY_6']?.toString()?.trim() || ''; // Categoria

            // Check if image exists using ID (since folder is CON NUMERO)
            const imagePath = path.join(IMAGES_PATH, `${id}.png`);
            if (!fs.existsSync(imagePath)) {
                console.log(`⚠️  Image not found for ID ${id} (SKU: ${itemCode}), skipping...`);
                continue;
            }

            // Create or update product
            const product = await prisma.product.upsert({
                where: { sku: itemCode },
                update: {
                    nameEs,
                    nameEn,
                    category,
                    name: nameEs || nameEn,
                },
                create: {
                    sku: itemCode,
                    barcode: itemCode,
                    nameEs,
                    nameEn,
                    name: nameEs || nameEn,
                    category,
                    price: 0,
                    stock: 0,
                    status: 'active',
                },
            });

            console.log(`✅ Product ${itemCode} created/updated`);

            // Upload image
            const imageUrl = await uploadImage(imagePath, itemCode);

            if (imageUrl) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { image: imageUrl },
                });
                console.log(`✅ Image assigned to product ${itemCode}`);
            }

            uploadedCount++;
        }

        console.log(`\n✅ Successfully uploaded ${uploadedCount} products with images!`);
        console.log(`📦 You can now test the InDesign export`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
