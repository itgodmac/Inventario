import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const total = await prisma.product.count();
    console.log(`📊 Total products in database: ${total}`);
}

main().finally(() => prisma.$disconnect());
