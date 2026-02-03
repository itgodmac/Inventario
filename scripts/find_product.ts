import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = '2586';
    console.log(`🔍 Searching for product with ID: ${id}`);

    const product = await prisma.product.findFirst({
        where: { photoId: id }
    });

    if (product) {
        console.log('✅ Product found:');
        console.table([product]);
    } else {
        console.log('❌ Product not found.');
    }
}

main().finally(() => prisma.$disconnect());
