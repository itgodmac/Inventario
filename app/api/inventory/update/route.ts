import { NextResponse } from 'next/server';

// This URL needs to be provided by the user after they deploy the script
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwrrg2YWihU3ejhaVxaSb96a2IygLWPbfsaq7iyF-dwxxEFntYs6S9KbUnN58HSNoo/exec';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, quantity, difference, auditor } = body;

        if (!id || quantity === undefined) {
            return NextResponse.json({ error: 'Missing ID or Quantity' }, { status: 400 });
        }

        if (!APPS_SCRIPT_URL) {
            console.warn("⚠️ [API] APPS_SCRIPT_URL is not configured.");
            return NextResponse.json({
                warning: 'Integration not yet configured.',
                mock_success: true
            });
        }

        console.log("📡 [API] Forwarding to Apps Script:", APPS_SCRIPT_URL);
        console.log("📦 [API] Payload:", { id, quantity, difference, auditor });

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, quantity, difference, auditor })
        });

        console.log("📥 [API] Apps Script Status:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error("🔥 [API] Apps Script Error Body:", text);
            throw new Error(`Apps Script responded with ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log("✅ [API] Apps Script Response:", data);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('🔥 [API] Update error:', error);
        return NextResponse.json({ error: 'Failed to update inventory', details: error.message }, { status: 500 });
    }
}
