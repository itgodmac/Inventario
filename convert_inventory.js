const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'public', 'BigMaterials Inv - Inventario .csv');
const outputPath = path.join(__dirname, 'app', 'inventory', 'data.ts');

try {
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split(/\r?\n/);

    // Skip first 2 lines (header info), 3rd is actual header
    // Data starts at line index 5 (row 6 in file)
    const dataLines = lines.slice(5);

    const products = [];

    // Regex to split by comma, ignoring commas inside quotes
    const splitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    dataLines.forEach((line, index) => {
        if (!line.trim()) return;

        const cols = line.split(splitRegex).map(col => col.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes

        // Mapping based on inspection
        // Ind 0: ID
        // Ind 1: Barcode (SKU 1)
        // Ind 2: Foto URL
        // Ind 3: Nombre Eng
        // Ind 4: Nombre Esp
        // Ind 5: Descripcion
        // Ind 7: Item Code (SKU 2)
        // Ind 9: Categoria
        // Ind 12: $ Venta
        // Ind 14: Stock

        const id = cols[0];
        if (!id) return;


        let barcode = cols[1] || '';
        let itemCode = cols[7] || '';
        let sku = barcode || itemCode || `GEN-${id}`;
        let nameEn = cols[3] || '';
        let nameEs = cols[4] || '';
        let name = nameEs || nameEn || cols[5] || 'Unnamed Product';
        const description = cols[5] || '';

        const category = cols[9] || 'Uncategorized';

        // Check if local image exists
        const localImagePath = path.join(__dirname, 'public', 'images', 'products', `${id}.jpg`);
        const image = fs.existsSync(localImagePath) ? `/images/products/${id}.jpg` : (cols[2] || '');

        let priceStr = cols[12] || '0';
        priceStr = priceStr.replace(/[$,]/g, '');
        const price = parseFloat(priceStr) || 0;

        let stockStr = cols[14] || '0';
        const stock = parseInt(stockStr.replace(/[^0-9-]/g, '')) || 0;

        let status = 'in-stock';
        if (stock <= 0) status = 'out-of-stock';
        else if (stock < 5) status = 'low-stock';

        // Fix casing for category to looks nice
        const niceCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

        products.push({
            id,
            name,
            nameEn,
            nameEs,
            sku,
            barcode,
            itemCode,
            category: niceCategory,
            stock,
            price,
            status,
            image,
            description
        });
    });

    const fileContent = `export interface Product {
    id: string;
    name: string;
    nameEn: string;
    nameEs: string;
    sku: string;
    barcode: string;
    itemCode: string;
    category: string;
    stock: number;
    price: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    image: string;
    description: string;
}

export const inventoryData: Product[] = ${JSON.stringify(products, null, 4)};
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log(`Successfully converted ${products.length} products to ${outputPath}`);

} catch (err) {
    console.error('Error converting CSV:', err);
}
