
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearQueue() {
    console.log('🧹 Clearing print queue...');
    const result = await prisma.printQueue.deleteMany({});
    console.log(`✅ Deleted ${result.count} stale jobs.`);
}

clearQueue();
