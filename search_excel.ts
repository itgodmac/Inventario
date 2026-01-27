import * as XLSX from 'xlsx';

const EXCEL_PATH = 'd:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx';

async function main() {
    console.log('📖 Searching Excel for "2586"...');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { range: 2 });

    const found = rawData.filter((row: any) =>
        row['ID']?.toString() === '2586' ||
        row['Item Code']?.toString() === '2586' ||
        Object.values(row).some(v => v?.toString() === '2586')
    );

    if (found.length > 0) {
        console.log('✅ Found in Excel:');
        console.table(found);
    } else {
        console.log('❌ Not found in Excel.');
        // Maybe check nearby IDs to see the format
        console.log('Sample IDs from start:');
        console.table(rawData.slice(0, 5).map((r: any) => ({ ID: r['ID'], ItemCode: r['Item Code'] })));
    }
}

main().catch(console.error);
