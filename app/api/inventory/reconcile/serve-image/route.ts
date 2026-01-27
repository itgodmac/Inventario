import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const imagePath = searchParams.get('path');

        if (!imagePath) {
            return NextResponse.json(
                { error: 'Missing path parameter' },
                { status: 400 }
            );
        }

        // Security: Only allow paths starting with the base MCA-S path
        const basePath = '\\\\MCA-S\\mk\\2_BM';
        if (!imagePath.startsWith(basePath)) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 403 }
            );
        }

        if (!fs.existsSync(imagePath)) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Read the file
        const imageBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();

        // Determine content type
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

        // Return the image
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
