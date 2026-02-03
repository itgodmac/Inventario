
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const itemCode = "10017560";
    const newCategory = "Schwing";

    // Find the product first to ensure we get the right ID or SKU
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { itemCode: itemCode },
                { sku: itemCode }
            ]
        }
    });

    if (!product) {
        console.error(`Product with itemCode/sku ${itemCode} not found.`);
        return;
    }

    const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
            category: newCategory
        }
    });

    console.log(`✅ Product category updated to: ${updated.category}`);
    console.log(`Product: ${updated.nameEs}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
