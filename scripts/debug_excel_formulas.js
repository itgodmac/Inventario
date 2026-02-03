const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'BigMaterials Inv.xlsx');
console.log(`Reading ${filePath}...`);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0]; // Assuming data is in first sheet
const sheet = workbook.Sheets[sheetName];

console.log(`Sheet: ${sheetName}`);

// Convert to JSON to find header row easily, but we need raw cell addresses for formulas
const range = XLSX.utils.decode_range(sheet['!ref']);
const formulas = [];

// Try to find header row by looking for "$ Venta"
let headerRowIndex = -1;
let headers = {};

for (let R = range.s.r; R <= range.e.r; ++R) {
    let rowValues = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];
        if (cell && cell.v) rowValues.push(cell.v);
    }
    if (rowValues.includes('$ Venta') || rowValues.includes('ID')) {
        headerRowIndex = R;
        // Map headers to columns
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellAddress];
            if (cell && cell.v) headers[cell.v] = C;
        }
        console.log(`Found header at row ${R + 1}`);
        console.log('Headers:', Object.keys(headers).join(', '));
        break;
    }
}

if (headerRowIndex === -1) {
    console.error("Could not find header row.");
    process.exit(1);
}

// Columns of interest
const targetCols = ['$ ZG', '$ Oth', '$ BM', '$ Ptij dll', '$ Ptij mxn', 'Veces G', '$ Venta'];

// Check formulas for next 5 rows
console.log('\n--- Analyzing Formulas ---');
for (let R = headerRowIndex + 1; R <= headerRowIndex + 5; ++R) {
    if (R > range.e.r) break;

    let rowInfo = `Row ${R + 1}:\n`;

    for (const colName of targetCols) {
        if (headers[colName] !== undefined) {
            const C = headers[colName];
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellAddress];

            if (cell) {
                // .f is formula, .v is value
                const formula = cell.f ? `=${cell.f}` : 'No Formula';
                const value = cell.v;
                rowInfo += `  ${colName}: Val=${value}, Formula=${formula}\n`;
            } else {
                rowInfo += `  ${colName}: Empty\n`;
            }
        }
    }
    console.log(rowInfo);
}

// Check Constants
const constants = ['L1', 'O1', 'Q1', 'S1', 'I1'];
console.log('\n--- Constants ---');
constants.forEach(addr => {
    const cell = sheet[addr];
    console.log(`${addr}: ${cell ? cell.v : 'Empty'}`);
});
