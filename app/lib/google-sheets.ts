import Papa from 'papaparse';

export interface Product {
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

import { unstable_cache } from 'next/cache';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvsy3wIcYsei_ObuY5T21JtliDkKJKEt3N__s3SRkvu4zJF1zBvzF89wHZKXaYH9IwqAjBPHPDi_UK/pub?output=csv';

// Internal fetcher that does the heavy lifting
async function getInventoryData(): Promise<Product[]> {
    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            // We use no-store here because unstable_cache handles the caching.
            // This ensures meaningful updates when the cache expires.
            cache: 'no-store'
        });
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                beforeFirstChunk: (chunk) => {
                    const lines = chunk.split(/\r\n|\n/);
                    const headerIndex = lines.findIndex(line => line.startsWith('ID,'));
                    return headerIndex !== -1 ? lines.slice(headerIndex).join('\n') : chunk;
                },
                complete: (results) => {
                    const products: Product[] = results.data.map((row: any) => {
                        const parsePrice = (val: string) => {
                            if (!val) return 0;
                            return parseFloat(val.replace(/[$,]/g, '')) || 0;
                        };

                        const stock = parseInt(row['Stock'] || '0', 10);
                        let status: Product['status'] = 'out-of-stock';
                        if (stock > 5) status = 'in-stock';
                        else if (stock > 0) status = 'low-stock';

                        if (['in-stock', 'low-stock', 'out-of-stock'].includes(row['Status'])) {
                            status = row['Status'];
                        }

                        return {
                            id: row['ID'] || Math.random().toString(36).substr(2, 9),
                            name: row['Nombre Esp'] || row['Nombre Eng'] || 'Unnamed Product',
                            nameEn: row['Nombre Eng'] || '',
                            nameEs: row['Nombre Esp'] || '',
                            sku: row['Item Code'] || '',
                            barcode: row['Barcode'] || '',
                            itemCode: row['Item Code'] || '',
                            category: row['Categoria'] || 'Uncategorized',
                            stock: stock,
                            price: parsePrice(row['$ Venta']),
                            status: status,
                            image: row['Foto URL'] || '',
                            description: row['Descripcion'] || ''
                        };
                    });

                    // Filter and resolve
                    resolve(products.filter(p => p.id && p.name !== 'Unnamed Product'));
                },
                error: (error: any) => reject(error)
            });
        });
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

// Export the cached version
export const fetchInventory = unstable_cache(
    async () => getInventoryData(),
    ['inventory-data'], // Key parts
    { revalidate: 60, tags: ['inventory'] } // Revalidate every 60s
);
