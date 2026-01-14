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

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvsy3wIcYsei_ObuY5T21JtliDkKJKEt3N__s3SRkvu4zJF1zBvzF89wHZKXaYH9IwqAjBPHPDi_UK/pub?output=csv';

export async function fetchInventory(): Promise<Product[]> {
    try {
        const response = await fetch(GOOGLE_SHEET_URL, { cache: 'no-store' });
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                // The first 2 lines are garbage metadata, the real header is on line 3.
                // However, PapaParse will try to use the first line as header if we say header: true.
                // We need to preprocess or use a transform.
                // Simpler: Split text by newline, find the line starting with "ID,", and rejoin from there.
                beforeFirstChunk: (chunk) => {
                    const lines = chunk.split(/\r\n|\n/);
                    const headerIndex = lines.findIndex(line => line.startsWith('ID,'));
                    return headerIndex !== -1 ? lines.slice(headerIndex).join('\n') : chunk;
                },
                complete: (results) => {
                    const products: Product[] = results.data.map((row: any) => {
                        // Helper to clean currency strings
                        const parsePrice = (val: string) => {
                            if (!val) return 0;
                            return parseFloat(val.replace(/[$,]/g, '')) || 0;
                        };

                        const stock = parseInt(row['Stock'] || '0', 10);

                        // Status mapping
                        let status: Product['status'] = 'out-of-stock';
                        if (stock > 5) status = 'in-stock';
                        else if (stock > 0) status = 'low-stock';

                        // Explicit status override from sheet if valid
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

                    // Filter out empty rows (where ID might be missing but row exists)
                    resolve(products.filter(p => p.id && p.name !== 'Unnamed Product'));
                },
                error: (error: any) => {
                    reject(error);
                }
            });
        });

    } catch (error) {
        console.error('Failed to fetch inventory from Google Sheets:', error);
        return [];
    }
}
