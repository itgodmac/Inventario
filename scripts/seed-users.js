const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const users = [
        {
            email: 'admin@big-m.mx',
            password: 'adminpassword123',
            name: 'Admin Principal',
            role: 'admin'
        },
        {
            email: 'pmata@mcacorporation.com',
            password: 'nYba1V6b3!',
            name: 'Paola Mata',
            role: 'admin'
        },
        {
            email: 'ecoronel@mcacorporation.com',
            password: '5Bc4k0It2h!',
            name: 'Edwin Coronel',
            role: 'admin'
        }
    ];

    console.log('--- SEEDING USERS ---');

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);

        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword,
                name: u.name,
                role: u.role
            },
            create: {
                email: u.email,
                password: hashedPassword,
                name: u.name,
                role: u.role
            }
        });

        console.log(`✅ User ${user.email} created/updated`);
    }

    console.log('--- SEEDING COMPLETE ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
