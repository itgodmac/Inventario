import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createViewerUser() {
    try {
        console.log('🔐 Creating viewer user...');

        // Hash password
        const hashedPassword = await bcrypt.hash("GYV6y45PyG!", 10);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: 'sgerman@big-m.mx' }
        });

        if (existingUser) {
            console.log('⚠️  User already exists, updating role to viewer...');
            await prisma.user.update({
                where: { email: 'sgerman@big-m.mx' },
                data: {
                    role: 'viewer',
                    password: hashedPassword,
                    name: 'German (Viewer)'
                }
            });
            console.log('✅ User updated successfully!');
        } else {
            // Create new user
            const user = await prisma.user.create({
                data: {
                    email: 'sgerman@big-m.mx',
                    name: 'German (Viewer)',
                    password: hashedPassword,
                    role: 'viewer'
                }
            });

            console.log('✅ Viewer user created successfully!');
            console.log(`📧 Email: ${user.email}`);
            console.log(`👤 Name: ${user.name}`);
            console.log(`🔑 Role: ${user.role}`);
        }

    } catch (error) {
        console.error('❌ Error creating viewer user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createViewerUser();
