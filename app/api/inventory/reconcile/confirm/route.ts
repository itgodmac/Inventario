import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId, imageUrl } = body;

        if (!productId || !imageUrl) {
            return NextResponse.json(
                { success: false, error: 'Missing productId or imageUrl' },
                { status: 400 }
            );
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Extract the real file path from the serve-image URL
        let finalImageUrl = imageUrl;

        if (imageUrl.includes('/api/inventory/reconcile/serve-image')) {
            // Extract the path parameter from the URL
            const urlObj = new URL(imageUrl, 'http://localhost');
            const localPath = urlObj.searchParams.get('path');

            if (localPath && fs.existsSync(localPath)) {
                // Upload directly to Cloudinary
                try {
                    const result = await new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                folder: 'inventory',
                                public_id: productId,
                                resource_type: 'auto',
                                overwrite: true,
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );

                        // Pipe the file to Cloudinary
                        fs.createReadStream(localPath).pipe(stream);
                    });

                    finalImageUrl = (result as any).secure_url;
                } catch (uploadError: any) {
                    console.error('Cloudinary upload error:', uploadError);
                    return NextResponse.json(
                        { success: false, error: `Failed to upload image: ${uploadError.message}` },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { success: false, error: 'Image file not found' },
                    { status: 404 }
                );
            }
        }

        // Update product with new image
        await prisma.product.update({
            where: { id: productId },
            data: {
                image: finalImageUrl,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, imageUrl: finalImageUrl });
    } catch (error) {
        console.error('Error confirming image:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to confirm image' },
            { status: 500 }
        );
    }
}
