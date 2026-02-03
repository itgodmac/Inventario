import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';

async function main() {
    console.log('📖 Searching for 2586 in Excel...');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 2 }) as any[];

    const targetRow = rawData.find(r => r['ID']?.toString() === '2586');

    if (targetRow) {
        console.log('✅ Found row. Syncing to database...');
        const id = targetRow['ID']?.toString().trim();
        const itemCode = targetRow['Item Code']?.toString().trim();
        const nameEsp = targetRow['Nombre Esp']?.toString().trim();

        const product = await prisma.product.upsert({
            where: { sku: itemCode },
            update: { photoId: id, nameEs: nameEsp, name: nameEsp },
            create: {
                sku: itemCode,
                photoId: id,
                nameEs: nameEsp,
                name: nameEsp || 'Unknown',
                price: parseFloat(targetRow['$ Venta']) || 0,
                stock: parseInt(targetRow['Stock']) || 0,
                status: 'in-stock'
            }
        });

        console.log('✨ Synced:');
        console.log(JSON.stringify(product, null, 2));
    } else {
        console.log('❌ Could not find 2586 in Excel again.');
    }
}

main().finally(() => prisma.$disconnect());
