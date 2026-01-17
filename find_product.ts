
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

const searchTerm = '10017560'; // The rod eye barcode/sku
const rootDir = process.cwd();

function searchInFile(filePath: string) {
    try {
        const workbook = xlsx.readFile(filePath);
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowString = JSON.stringify(row);
                if (rowString.includes(searchTerm)) {
                    console.log(`\n✅ FOUND in ${filePath} (Sheet: ${sheetName}, Row: ${i + 1})`);
                    console.log('Row Data:', row);

                    if (i > 0) {
                        console.log('Potential Headers:', data[0]);
                    }

                    const result = {
                        file: filePath,
                        row: row,
                        headers: i > 0 ? data[0] : [],
                        sheet: sheetName
                    };
                    fs.writeFileSync('found_product.json', JSON.stringify(result, null, 2));
                    console.log('Saved to found_product.json');

                    return true;
                }
            }
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, (e as any).message);
    }
    return false;
}

function findFiles(dir: string, extensions: string[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.next' || file === '.git') continue;
            findFiles(fullPath, extensions);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                // console.log(`Checking ${fullPath}...`);
                if (searchInFile(fullPath)) {
                    // console.log('Found!');
                }
            }
        }
    }
}

console.log(`Searching for "${searchTerm}" in .xlsx files in ${rootDir}...`);
findFiles(rootDir, ['.xlsx', '.csv']);
