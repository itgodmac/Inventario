import * as XLSX from 'xlsx';

const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';

async function main() {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 2 });
    console.log('🔍 Headers/Fields detected in first row:');
    console.log(Object.keys(rawData[0] as any));
    console.log('🔍 Sample data (Row 1):');
    console.log(rawData[0]);
}

main().catch(console.error);
