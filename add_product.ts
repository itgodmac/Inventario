
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.create({
        data: {
            name: "PISTON ROD END EYE",
            nameEn: "PISTON ROD END EYE",
            nameEs: "ROD EYE PUNTA PARA PISTON DE CAMBIO V-ROCK",
            itemCode: "10017560", // OEM
            sku: "10017560",       // Using Item Code as SKU for now as fallback
            category: "PISTONES",
            price: 5256.96,
            stock: 4,
            status: "in-stock"
        }
    });

    console.log("Created product:", product);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
