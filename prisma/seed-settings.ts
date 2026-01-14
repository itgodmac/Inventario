import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding System Settings...');

    const settings = [
        { key: 'PRICE_L1_COMP_FACTOR', value: 0.96, description: 'Competitor Discount Factor (4% off)' },
        { key: 'PRICE_Q1_IMPORT_FACTOR', value: 0.225, description: 'Import/Freight Factor (22.5%)' },
        { key: 'PRICE_S1_EXCHANGE_COST', value: 18.75, description: 'Exchange Rate: Cost (MXN/USD)' },
        { key: 'PRICE_I1_EXCHANGE_SALE', value: 18.50, description: 'Exchange Rate: Sale (MXN/USD)' },
        { key: 'PRICE_O1_EXTRA_FACTOR', value: 0.0, description: 'Extra Import Factor' }
    ];

    for (const s of settings) {
        await (prisma as any).systemSettings.upsert({
            where: { key: s.key },
            update: { value: s.value, description: s.description },
            create: s
        });
        console.log(`Updated ${s.key} = ${s.value}`);
    }

    console.log('✅ Settings seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
