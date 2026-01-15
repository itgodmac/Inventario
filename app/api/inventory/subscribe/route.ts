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
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!redis) {
        return new Response('Redis not configured', { status: 503 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            const initMessage = `data: ${JSON.stringify({
                type: 'CONNECTED',
                timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(encoder.encode(initMessage));

            // Poll for new messages every 1 second
            const pollInterval = setInterval(async () => {
                try {
                    // Get messages from Redis list
                    const messages = await redis.lrange('inventory-events', 0, -1) as string[];

                    if (messages && messages.length > 0) {
                        // Process new messages
                        for (const msg of messages) {
                            try {
                                const event = JSON.parse(msg);
                                const message = `data: ${msg}\n\n`;
                                controller.enqueue(encoder.encode(message));
                            } catch (e) {
                                console.error('Failed to parse event:', e);
                            }
                        }

                        // Clear processed messages
                        await redis.del('inventory-events');
                    }
                } catch (error) {
                    console.error('Redis poll error:', error);
                }
            }, 1000);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                clearInterval(pollInterval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
