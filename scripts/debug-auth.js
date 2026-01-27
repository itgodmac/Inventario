const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debug() {
    const email = 'pmata@mcacorporation.com';
    const password = 'nYba1V6b3!';

    console.log('--- DEBUGGING USER ---');
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log(`❌ User ${email} not found in database`);
    } else {
        console.log(`✅ User found:`, { ...user, password: '[REDACTED]' });
        const match = await bcrypt.compare(password, user.password);
        console.log(`Password match: ${match}`);
    }

    const allUsers = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log('Total users in DB:', allUsers.length);
    console.log('Users list:', allUsers);

    await prisma.$disconnect();
}

debug();
