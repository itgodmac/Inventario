// ===============================================
// BigMaterials - Download ALL Products + Images
// ===============================================

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://inventario.big-m.mx/api/catalog/export';
const OUTPUT_FILE = path.join(__dirname, 'catalog-data.json');
const IMAGES_FOLDER = path.join(__dirname, 'catalog-images');

console.log('📥 Descargando productos e imágenes...\n');

// Crear carpeta de imágenes
if (!fs.existsSync(IMAGES_FOLDER)) {
    fs.mkdirSync(IMAGES_FOLDER);
}

https.get(API_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', async () => {
        try {
            const catalogData = JSON.parse(data);

            // Guardar JSON
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogData, null, 2));

            console.log('✅ Datos descargados\n');
            console.log('📊 Total productos:', catalogData.totalProducts);

            // Recopilar todos los productos (ignorar secciones)
            let allProducts = [];
            catalogData.sections.forEach(section => {
                allProducts = allProducts.concat(section.products);
            });

            // Descargar imágenes
            console.log('\n📸 Descargando imágenes...\n');
            let downloaded = 0;
            let skipped = 0;

            for (const product of allProducts) {
                if (product.image && product.image.startsWith('http')) {
                    const imageUrl = product.image;
                    const imageName = product.sku + '.jpg';
                    const imagePath = path.join(IMAGES_FOLDER, imageName);

                    // Descargar imagen
                    try {
                        await downloadImage(imageUrl, imagePath);
                        console.log(`   ✓ ${imageName}`);
                        downloaded++;
                    } catch (e) {
                        console.log(`   ✗ ${imageName} - Error`);
                    }
                } else {
                    skipped++;
                }
            }

            console.log('\n✅ Descarga completada!\n');
            console.log(`   Imágenes descargadas: ${downloaded}`);
            console.log(`   Sin imagen: ${skipped}`);
            console.log(`\n📁 Carpeta de imágenes: ${IMAGES_FOLDER}`);
            console.log('\n👉 Ahora ejecuta el script de InDesign\n');

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

}).on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
});

// Función para descargar imagen
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error('Status: ' + res.statusCode));
                return;
            }

            const fileStream = fs.createWriteStream(filepath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => { });
                reject(err);
            });
        }).on('error', reject);
    });
}
