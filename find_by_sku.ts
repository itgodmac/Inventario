import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const sku = '10041432';
    const photoId = '2586';

    console.log(`🔍 Searching for SKU: ${sku} or ID: ${photoId}`);

    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { sku: sku },
                { photoId: photoId }
            ]
        }
    });

    if (product) {
        console.log('✅ Product found:');
        console.log(JSON.stringify(product, null, 2));
    } else {
        console.log('❌ Product not found in database.');
    }
}

main().finally(() => prisma.$disconnect());
