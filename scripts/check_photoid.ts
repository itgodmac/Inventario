import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking first 10 products for photoId...');
    const products = await prisma.product.findMany({
        take: 10,
        select: {
            sku: true,
            name: true,
            photoId: true
        }
    });

    console.table(products);
}

main().finally(() => prisma.$disconnect());
