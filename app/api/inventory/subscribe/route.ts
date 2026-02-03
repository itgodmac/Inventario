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
    // TEMPORARILY DISABLED: Redis has exceeded rate limit (500k requests)
    // This realtime functionality is disabled until limits reset

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // 1. Send initial connection message
            const startTime = new Date().toISOString();
            let lastEventTime = startTime;

            const initMessage = `data: ${JSON.stringify({
                type: 'CONNECTED',
                timestamp: startTime,
                message: 'Realtime updates active (Broadcast Mode)'
            })}\n\n`;
            controller.enqueue(encoder.encode(initMessage));

            // 2. Poll for new messages every 3 seconds (sustainable rate)
            const pollInterval = setInterval(async () => {
                try {
                    if (!redis) return;

                    // Get messages from Redis list (don't delete, let TTL handle it)
                    const messages = await redis.lrange('inventory-events', 0, -1) as string[];

                    if (messages && messages.length > 0) {
                        let newEventsFound = false;

                        for (const msg of messages) {
                            try {
                                const event = typeof msg === 'string' ? JSON.parse(msg) : msg;
                                const eventTime = event.payload?.timestamp || event.timestamp;

                                // Only process events newer than our last seen
                                if (eventTime && eventTime > lastEventTime) {
                                    const message = `data: ${JSON.stringify(event)}\n\n`;
                                    controller.enqueue(encoder.encode(message));

                                    if (eventTime > lastEventTime) {
                                        lastEventTime = eventTime;
                                    }
                                    newEventsFound = true;
                                }
                            } catch (e) {
                                console.error('Failed to parse event:', e);
                            }
                        }

                        if (newEventsFound) {
                            console.log(`📡 [SSE] Broadcasted events to client. New LastSeen: ${lastEventTime}`);
                        }
                    } else {
                        // Heartbeat to keep connection alive every 30s (silently)
                        const now = Date.now();
                        if (now % 30000 < 3000) { // Approx every 30s
                            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                        }
                    }
                } catch (error) {
                    console.error('Redis poll error:', error);
                }
            }, 3000);

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                console.log('🔌 [SSE] Client disconnected, clearing interval');
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
