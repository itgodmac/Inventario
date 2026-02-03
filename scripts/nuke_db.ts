import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('☢️  NUKING DATABASE...');

    try {
        const queueCount = await prisma.printQueue.deleteMany({});
        console.log(`🗑️ Deleted ${queueCount.count} items from PrintQueue`);

        const logCount = await prisma.stockLog.deleteMany({});
        console.log(`🗑️ Deleted ${logCount.count} items from StockLog`);

        const productCount = await prisma.product.deleteMany({});
        console.log(`🗑️ Deleted ${productCount.count} items from Product`);

        const settingsCount = await prisma.systemSettings.deleteMany({});
        console.log(`🗑️ Deleted ${settingsCount.count} items from SystemSettings`);

        console.log('\n✅ DATABASE FULLY WIPED.');
    } catch (error) {
        console.error('❌ Error nuking database:', error);
    }
}

main().finally(() => prisma.$disconnect());
