/**
 * Cloudinary Image Optimization Utilities
 * 
 * This module provides helper functions to optimize Cloudinary images
 * with automatic format conversion, quality optimization, and responsive sizing.
 */

export interface CloudinaryTransformOptions {
    width?: number;
    height?: number;
    quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'limit' | 'pad';
    gravity?: 'auto' | 'center' | 'face' | 'faces';
}

/**
 * Optimize a Cloudinary image URL with transformations
 * 
 * @example
 * const optimized = optimizeCloudinaryImage(
 *   'https://res.cloudinary.com/dmcpixqgf/image/upload/v1234/inventory/product.jpg',
 *   { width: 400, quality: 'auto', format: 'auto' }
 * );
 */
export function optimizeCloudinaryImage(
    url: string | null | undefined,
    options: CloudinaryTransformOptions = {}
): string {
    // Return empty string if no URL
    if (!url) return '';

    // Only process Cloudinary URLs
    if (!url.includes('cloudinary.com')) return url;

    const {
        width,
        height,
        quality = 'auto',
        format = 'auto',
        crop = 'fill',
        gravity = 'auto'
    } = options;

    // Build transformation string
    const transformations: string[] = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop) transformations.push(`c_${crop}`);
    if (gravity && crop === 'fill') transformations.push(`g_${gravity}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);

    const transformString = transformations.join(',');

    // Insert transformations into URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{version}/{path}
    const parts = url.split('/upload/');
    if (parts.length === 2) {
        return `${parts[0]}/upload/${transformString}/${parts[1]}`;
    }

    // If URL format is unexpected, return original
    return url;
}

/**
 * Preset configurations for common use cases
 */
export const CloudinaryPresets = {
    /** Thumbnail for grid/list views (150x150) */
    thumbnail: (url: string) => optimizeCloudinaryImage(url, {
        width: 150,
        height: 150,
        quality: 'auto',
        format: 'auto',
        crop: 'fill'
    }),

    /** Small image for cards (400px wide) */
    small: (url: string) => optimizeCloudinaryImage(url, {
        width: 400,
        quality: 'auto',
        format: 'auto',
        crop: 'limit'
    }),

    /** Medium image for detail views (800px wide) */
    medium: (url: string) => optimizeCloudinaryImage(url, {
        width: 800,
        quality: 'auto',
        format: 'auto',
        crop: 'limit'
    }),

    /** Large image for full-screen (1200px wide) */
    large: (url: string) => optimizeCloudinaryImage(url, {
        width: 1200,
        quality: 'auto:best',
        format: 'auto',
        crop: 'limit'
    }),

    /** Print quality (optimized for print viewing, ~1600px) */
    print: (url: string) => optimizeCloudinaryImage(url, {
        width: 1600,
        quality: 'auto:best',
        format: 'auto',
        crop: 'limit'
    }),

    /** InDesign export (original size, maximum quality) - For professional print exports */
    indesign: (url: string) => {
        // Return empty string if no URL
        if (!url) return '';

        // For non-Cloudinary URLs, return as-is
        if (!url.includes('cloudinary.com')) return url;

        // For InDesign, we want the ORIGINAL uploaded image without transformations
        // Format: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{version}/{path}
        // We want: https://res.cloudinary.com/{cloud}/image/upload/{version}/{path}
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            const afterUpload = parts[1];

            // Check if there are transformations (they contain commas or underscores at the start)
            // Transformations look like: "w_800,q_auto,f_auto/v123456/path.jpg"
            // Without transformations: "v123456/path.jpg"

            // If it starts with a version (v followed by numbers) or direct path, no transformations
            if (afterUpload.match(/^v\d+\//) || afterUpload.match(/^[^\/,_]+\.[a-z]+$/)) {
                return url; // Already original
            }

            // Remove transformation part (everything before the version/path)
            // Find the first occurrence of /v followed by digits
            const versionMatch = afterUpload.match(/\/(v\d+\/.*)/);
            if (versionMatch) {
                return `${parts[0]}/upload/${versionMatch[1]}`;
            }

            // If no version found, try to find filename directly
            const segments = afterUpload.split('/');
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && lastSegment.includes('.')) {
                // Likely a direct file path without version
                return `${parts[0]}/upload/${lastSegment}`;
            }
        }

        // Fallback: return original URL if parsing fails
        return url;
    }
};
