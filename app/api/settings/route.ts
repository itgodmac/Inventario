import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();

        // SECURITY: Only admins can view settings
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.systemSettings.findMany();
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Settings Error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();

        // SECURITY: Only admins can modify settings
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const updates = body.settings; // Array of { key, value, description }

        // Update each setting
        for (const setting of updates) {
            await prisma.systemSettings.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: {
                    key: setting.key,
                    value: setting.value,
                    description: setting.description
                }
            });
        }

        const updatedSettings = await prisma.systemSettings.findMany();
        return NextResponse.json({ status: 'success', settings: updatedSettings });
    } catch (error: any) {
        console.error('Settings Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
