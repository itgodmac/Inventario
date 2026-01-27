
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
// Using Node's native fetch and FormData (available in Node 18+)

const prisma = new PrismaClient();

// Configuration
const IMAGES_PATH = '\\\\MCA-S\\mk\\2_BM\\50_LibInv'; // Network path
const UPLOAD_API_URL = 'http://127.0.0.1:3000/api/upload';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadImage(imagePath, productId, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            // Read file as buffer and create a Blob/File for native FormData
            const fileBuffer = fs.readFileSync(imagePath);
            const fileName = path.basename(imagePath);
            const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('productId', productId);

            const response = await fetch(UPLOAD_API_URL, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                return data.url;
            } else {
                console.error(`❌ Upload failed for ${productId} (Attempt ${i + 1}): ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`❌ Error uploading image for ${productId} (Attempt ${i + 1}):`, error.message);
            await sleep(1000);
        }
    }
    return null;
}

async function main() {
    console.log('🖼️  Starting Image Upload Process...');
    console.log(`📂 Images Path: ${IMAGES_PATH}`);

    if (!fs.existsSync(IMAGES_PATH)) {
        console.error(`❌ Images directory not found: ${IMAGES_PATH}`);
        console.error('⚠️  Make sure you are connected to the network drive.');
        process.exit(1);
    }

    // Get all products that don't have an image yet
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { image: null },
                { image: '' }
            ]
        },
        select: {
            id: true,
            photoId: true,
            sku: true,
            name: true
        }
    });

    console.log(`📦 Found ${products.length} products without images.`);

    let uploaded = 0;
    let notFound = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];

        if (!product.photoId) {
            notFound++;
            continue;
        }

        // Try to find image with common extensions
        const extensions = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'];
        let foundImagePath = null;

        for (const ext of extensions) {
            const testPath = path.join(IMAGES_PATH, `${product.photoId}${ext}`);
            if (fs.existsSync(testPath)) {
                foundImagePath = testPath;
                break;
            }
        }

        if (!foundImagePath) {
            notFound++;
            if ((i + 1) % 100 === 0) {
                console.log(`⏭️  Progress: ${i + 1}/${products.length} (${notFound} images not found on disk)`);
            }
            continue;
        }

        // Upload to Cloudinary
        const imageUrl = await uploadImage(foundImagePath, product.id);

        if (imageUrl) {
            await prisma.product.update({
                where: { id: product.id },
                data: { image: imageUrl }
            });
            uploaded++;

            if (uploaded % 10 === 0) {
                console.log(`✅ Uploaded ${uploaded} images... (${product.photoId})`);
            }
        } else {
            failed++;
        }

        // Small delay to avoid hammering the server
        await sleep(100);
    }

    console.log('\n------------------------------------------------');
    console.log('🖼️  Image Upload Complete!');
    console.log(`✅ Successfully uploaded: ${uploaded}`);
    console.log(`⚠️  Images not found: ${notFound}`);
    console.log(`❌ Failed uploads: ${failed}`);
    console.log('------------------------------------------------');
}

main()
    .catch((e) => {
        console.error('Main script error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
