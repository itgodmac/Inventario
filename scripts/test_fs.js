const fs = require('fs');
try {
    fs.writeFileSync('d:\\RIPODOO\\ripodoo\\test_fs.log', 'Hello from test_fs');
    console.log('Wrote file');
} catch (e) {
    console.error(e);
}
