const fs = require('fs');
const path = 'C:\\Users\\IT\\.gemini\\antigravity\\brain\\4bb33814-4d9b-4204-b35e-d944239b42d7\\test_fs_artifact.log';
try {
    fs.writeFileSync(path, 'Hello from artifact dir');
    console.log('Wrote file to artifact dir');
} catch (e) {
    console.error(e);
}
