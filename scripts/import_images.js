const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'public', 'BigMaterials Inv - Inventario .csv');
const networkSource = '\\\\MCA-S\\mk\\2_BM\\50_LibInv';
const localDest = path.join(__dirname, 'public', 'images', 'products');

// Create destination if not exists
if (!fs.existsSync(localDest)) {
    fs.mkdirSync(localDest, { recursive: true });
}

try {
    console.log('Reading CSV...');
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split(/\r?\n/);
    const dataLines = lines.slice(5);

    const splitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    let foundCount = 0;
    let missingCount = 0;

    console.log(`Processing ${dataLines.length} rows...`);

    dataLines.forEach((line) => {
        if (!line.trim()) return;
        const cols = line.split(splitRegex).map(col => col.trim().replace(/^"|"$/g, ''));
        const id = cols[0];
        if (!id) return;

        // Try extensions
        const extensions = ['.jpg', '.JPG', '.png', '.PNG', '.jpeg', '.JPEG'];
        let found = false;

        for (const ext of extensions) {
            const sourceFile = path.join(networkSource, `${id}${ext}`);
            const destFile = path.join(localDest, `${id}.jpg`); // Normalize to .jpg locally for simplicity

            if (fs.existsSync(sourceFile)) {
                try {
                    fs.copyFileSync(sourceFile, destFile);
                    // console.log(`Copied ${id}${ext}`);
                    found = true;
                    break;
                } catch (err) {
                    console.error(`Error copying ${id}: ${err.message}`);
                }
            }
        }

        if (found) foundCount++;
        else missingCount++;

        if ((foundCount + missingCount) % 100 === 0) {
            console.log(`Processed ${foundCount + missingCount}: Found ${foundCount}, Missing ${missingCount}`);
        }
    });

    console.log(`\nDone!`);
    console.log(`Total Found/Copied: ${foundCount}`);
    console.log(`Total Missing: ${missingCount}`);

} catch (err) {
    console.error('Error:', err);
}
