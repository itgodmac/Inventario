import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const totalCount = await prisma.product.count();
    const withStock = await prisma.product.count({
        where: {
            stock: { gt: 0 }
        }
    });

    console.log(`Total Products: ${totalCount}`);
    console.log(`Products with Stock > 0: ${withStock}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
