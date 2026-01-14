import { NextResponse } from 'next/server';
import { fetchInventory } from '../../lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await fetchInventory();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}
