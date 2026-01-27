import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⚠️ Clearing database...');
    await prisma.printQueue.deleteMany({});
    await prisma.stockLog.deleteMany({});
    await prisma.product.deleteMany({});
    console.log('✅ Database cleared.');
}

main().finally(() => prisma.$disconnect());
