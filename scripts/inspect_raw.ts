import * as XLSX from 'xlsx';

const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';

async function main() {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 });
    console.log('🔍 Row 3 (Headers?):');
    console.log(rawData[0]);
    console.log('🔍 Row 4 (Sample Data):');
    console.log(rawData[1]);
}

main().catch(console.error);
