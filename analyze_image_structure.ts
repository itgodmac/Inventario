import * as fs from 'fs';
import * as path from 'path';

const BASE_PATH = '\\\\MCA-S\\mk\\2_BM\\0_BMat\\08_PYM\\Catalogo actualizado DIC2025\\Imagenes de productos';

function analyzeDirectory(dir: string, level: number = 0) {
    const indent = '  '.repeat(level);

    try {
        const items = fs.readdirSync(dir);

        console.log(`${indent}📁 ${path.basename(dir)} (${items.length} items)`);

        let folderCount = 0;
        let imageCount = 0;

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                folderCount++;
                if (level < 2) { // Only recurse 2 levels deep for analysis
                    analyzeDirectory(fullPath, level + 1);
                }
            } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
                imageCount++;
                if (imageCount <= 3) { // Show first 3 images as examples
                    console.log(`${indent}  🖼️  ${item}`);
                }
            }
        }

        if (imageCount > 3) {
            console.log(`${indent}  ... y ${imageCount - 3} imágenes más`);
        }

        console.log(`${indent}  Total: ${folderCount} subcarpetas, ${imageCount} imágenes\n`);

    } catch (error) {
        console.error(`${indent}❌ Error reading ${dir}:`, error);
    }
}

console.log('Analizando estructura de carpetas...\n');
analyzeDirectory(BASE_PATH);
