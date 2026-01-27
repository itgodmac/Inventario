import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
    try {
        // Configure Cloudinary (must be inside handler to access env vars)
        cloudinary.config({
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const formData = await request.formData();
        const file = formData.get('file');
        const productId = formData.get('productId') as string;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        let buffer: Buffer;

        // Handle different file types (File from browser or ReadableStream from server)
        if (file instanceof File) {
            // Browser upload
            const bytes = await file.arrayBuffer();
            buffer = Buffer.from(bytes);
        } else if (typeof file === 'object' && 'pipe' in file) {
            // Server-side stream (from node-fetch FormData)
            const chunks: any[] = [];
            for await (const chunk of file as any) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
        } else {
            return NextResponse.json({ success: false, error: 'Invalid file format' }, { status: 400 });
        }

        // Upload to Cloudinary with product ID as filename
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'inventory',
                    public_id: productId || undefined, // Use product ID as filename
                    resource_type: 'auto',
                    overwrite: true, // Replace if exists
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        return NextResponse.json({
            success: true,
            url: (result as any).secure_url
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
