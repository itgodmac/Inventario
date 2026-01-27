import * as XLSX from 'xlsx';

async function main() {
    const workbook = XLSX.readFile('d:\\RIPODOO\\ripodoo\\BigMaterials Inv.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Skip first 2 rows, Row 3 is index 2
    const data = XLSX.utils.sheet_to_json(sheet, { range: 2 });

    console.log(`Total data rows found: ${data.length}`);

    // If Excel Row 3 is headers, then:
    // Excel Row 4 is index 0
    // Excel Row 47 is index 43
    const targetIndex = 43;

    const row = data[targetIndex] as any;
    console.log(`--- DATA FROM EXCEL ROW 47 (Index ${targetIndex}) ---`);
    if (row) {
        Object.keys(row).forEach(key => {
            console.log(`${key.padEnd(15)}: ${row[key]}`);
        });
    } else {
        console.log("No data found at this index.");
    }
}

main();
