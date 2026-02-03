import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';

async function main() {
    console.log('📖 Loading Excel to sync IDs...');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 2 });

    console.log(`📊 Syncing IDs for ${rawData.length} rows...`);
    let updated = 0;

    for (const row of rawData as any[]) {
        const photoId = row['ID']?.toString().trim();
        const sku = row['Item Code']?.toString().trim();

        if (photoId && sku) {
            try {
                await prisma.product.update({
                    where: { sku: sku },
                    data: { photoId: photoId }
                });
                updated++;
            } catch (e) {
                // Product might not exist yet
            }
        }
    }

    console.log(`✨ Sync Complete! Updated ${updated} products with correct IDs.`);
}

main().finally(() => prisma.$disconnect());
