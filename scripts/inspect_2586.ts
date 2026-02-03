import * as XLSX from 'xlsx';

const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';

async function main() {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 }) as any[][];

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (row[0]?.toString() === '2586') {
            console.log(`✅ FOUND ID 2586 at row index ${i} (Excel row ${i + 4}):`);
            console.log(JSON.stringify(row, null, 2));
            return;
        }
    }
    console.log('❌ ID 2586 not found in raw rows mapping.');
}

main().catch(console.error);
