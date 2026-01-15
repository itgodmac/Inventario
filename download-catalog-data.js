// ===============================================
// BigMaterials - Download Catalog Data
// Helper script to fetch catalog data from API
// ===============================================

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://inventario.big-m.mx/api/catalog/export';
const OUTPUT_FILE = path.join(__dirname, 'catalog-data.json');

console.log('📥 Descargando datos del catálogo...\n');
console.log('API URL:', API_URL);

https.get(API_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);

            // Guardar archivo
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));

            console.log('✅ Datos descargados exitosamente!\n');
            console.log('📊 Estadísticas:');
            console.log(`   - Secciones: ${jsonData.sections.length}`);
            console.log(`   - Total productos: ${jsonData.totalProducts}`);
            console.log(`   - Total páginas: ${jsonData.totalPages}`);
            console.log(`\n📁 Archivo guardado: ${OUTPUT_FILE}`);
            console.log('\n👉 Ahora ejecuta el script de InDesign\n');

        } catch (error) {
            console.error('❌ Error al parsear JSON:', error.message);
            process.exit(1);
        }
    });

}).on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.error('\nVerifica:');
    console.error('  1. Tu conexión a internet');
    console.error('  2. Que el servidor esté disponible');
    console.error('  3. La URL del API es correcta\n');
    process.exit(1);
});
