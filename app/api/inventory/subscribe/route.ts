import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    if (!redis) {
        return new Response('Redis not configured', { status: 503 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            const message = `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`;
            controller.enqueue(encoder.encode(message));

            // Subscribe to inventory updates
            const channelName = 'inventory-updates';

            // Poll Redis for messages every 1s
            const intervalId = setInterval(async () => {
                try {
                    // Note: Upstash Redis doesn't support traditional pub/sub in serverless
                    // We'll use a different approach: check a stream/list
                    // For now, we'll keep the existing setup and clients will poll
                    // This is a limitation of serverless Redis
                } catch (error) {
                    console.error('Redis poll error:', error);
                }
            }, 1000);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                clearInterval(intervalId);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
