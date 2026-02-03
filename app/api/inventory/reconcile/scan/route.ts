import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Recursive function to find all images in a directory and subdirectories
function findImagesRecursive(dir: string, baseDir: string = dir): { filename: string; fullPath: string; relativePath: string }[] {
    const results: { filename: string; fullPath: string; relativePath: string }[] = [];

    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // Recurse into subdirectory
                results.push(...findImagesRecursive(fullPath, baseDir));
            } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
                // Found an image file
                const relativePath = path.relative(baseDir, fullPath);
                results.push({
                    filename: item,
                    fullPath: fullPath,
                    relativePath: relativePath,
                });
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }

    return results;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imagePath } = body;

        if (!imagePath) {
            return NextResponse.json(
                { success: false, error: 'No se especificó la ruta de imágenes' },
                { status: 400 }
            );
        }

        // Check if path exists
        if (!fs.existsSync(imagePath)) {
            return NextResponse.json(
                { success: false, error: `La ruta no existe: ${imagePath}` },
                { status: 400 }
            );
        }

        // Get ALL products from database
        const allProducts = await prisma.product.findMany({
            select: {
                id: true,
                sku: true,
                photoId: true,
                nameEn: true,
                nameEs: true,
                name: true,
                category: true,
                image: true,
            },
        });

        console.log(`Loaded ${allProducts.length} products from database`);

        // Scan directory recursively for images
        console.log(`Scanning ${imagePath} recursively...`);
        const imageFiles = findImagesRecursive(imagePath);
        console.log(`Found ${imageFiles.length} image files (including subdirectories)`);

        // Match images to products
        const productsWithCandidates = [];
        const matchedImagePaths = new Set<string>();

        for (const product of allProducts) {
            const candidates: { url: string; filename: string; relativePath: string }[] = [];

            // Helper function to normalize strings for matching (remove spaces, hyphens, underscores)
            const normalize = (str: string) => str.toLowerCase().replace(/[\s\-_]/g, '');

            // Priority 1: Exact match on SKU or Photo ID (most reliable)
            const exactMatches: string[] = [];
            const exactMatchesNormalized: string[] = [];
            if (product.sku) {
                exactMatches.push(product.sku.toLowerCase());
                exactMatchesNormalized.push(normalize(product.sku));
            }
            if (product.photoId) {
                exactMatches.push(product.photoId.toLowerCase());
                exactMatchesNormalized.push(normalize(product.photoId));
            }

            // Priority 2: Full name matches (less reliable, needs to be more specific)
            const nameMatches: string[] = [];
            if (product.nameEn) nameMatches.push(product.nameEn.toLowerCase());
            if (product.nameEs) nameMatches.push(product.nameEs.toLowerCase());
            if (product.name) nameMatches.push(product.name.toLowerCase());

            for (const imageFile of imageFiles) {
                const filenameWithoutExt = path.parse(imageFile.filename).name.toLowerCase();
                const filenameNormalized = normalize(filenameWithoutExt);
                let matched = false;

                // Check exact matches (SKU, Photo ID) - HIGHEST PRIORITY
                // First try exact match, then normalized match for variations like "ABC-123" vs "ABC123"
                for (let i = 0; i < exactMatches.length; i++) {
                    const exactTerm = exactMatches[i];
                    const normalizedTerm = exactMatchesNormalized[i];

                    if (filenameWithoutExt === exactTerm ||
                        filenameWithoutExt.includes(exactTerm) ||
                        filenameNormalized === normalizedTerm ||
                        filenameNormalized.includes(normalizedTerm)) {
                        matched = true;
                        break;
                    }
                }

                // Check name matches - MUCH MORE STRICT
                if (!matched) {
                    for (const nameTerm of nameMatches) {
                        const words = nameTerm.split(/\s+/).filter(w => w.length >= 4);
                        let matchingWords = 0;
                        for (const word of words) {
                            if (filenameWithoutExt.includes(word)) {
                                matchingWords++;
                                if (word.length >= 8) {
                                    matched = true;
                                    break;
                                }
                            }
                        }

                        if (matchingWords >= 2) {
                            matched = true;
                        }

                        if (matched) break;
                    }
                }

                if (matched) {
                    const imageUrl = `/api/inventory/reconcile/serve-image?path=${encodeURIComponent(imageFile.fullPath)}`;
                    candidates.push({
                        url: imageUrl,
                        filename: imageFile.filename,
                        relativePath: imageFile.relativePath,
                    });
                    matchedImagePaths.add(imageFile.fullPath);
                }
            }

            // Only include products with at least one candidate
            if (candidates.length > 0) {
                productsWithCandidates.push({
                    id: product.id,
                    sku: product.sku || '',
                    photoId: product.photoId,
                    nameEn: product.nameEn,
                    nameEs: product.nameEs,
                    category: product.category,
                    currentImage: product.image,
                    candidateImages: candidates,
                });
            }
        }

        // Collect unmatched images
        const unmatchedImages = imageFiles
            .filter(img => !matchedImagePaths.has(img.fullPath))
            .map(img => ({
                url: `/api/inventory/reconcile/serve-image?path=${encodeURIComponent(img.fullPath)}`,
                filename: img.filename,
                relativePath: img.relativePath
            }));

        console.log(`Found ${productsWithCandidates.length} products with matches and ${unmatchedImages.length} unmatched images`);

        return NextResponse.json({
            success: true,
            products: productsWithCandidates,
            unmatchedImages: unmatchedImages,
            total: productsWithCandidates.length,
            scannedFiles: imageFiles.length,
        });
    } catch (error) {
        console.error('Error scanning images:', error);
        return NextResponse.json(
            { success: false, error: `Error: ${error instanceof Error ? error.message : 'Unknown'}` },
            { status: 500 }
        );
    }
}
