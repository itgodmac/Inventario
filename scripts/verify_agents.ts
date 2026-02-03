
async function checkProductAgents() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { uvaNombre: { not: null } },
                    { itemCode: { not: null } }
                ]
            }
        });

        if (!product) {
            console.log("No useful product found.");
            return;
        }

        const url = `http://localhost:3000/api/inventory/${product.id}`;

        console.log(`\n🔎 Testing Product: ${product.name} (ID: ${product.id})`);
        console.log(`DB Values: name="${product.name}", uva="${product.uvaNombre}", oem="${product.itemCode}"`);
        console.log(`          nameEs="${product.nameEs}"`);

        // 1. Browser Test
        const resBrowser = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 ...' }
        });
        const browserData = await resBrowser.json();
        const p1 = browserData.product;

        console.log("\n🌍 Browser Request:");
        console.log(`uvaNombre: ${p1.uvaNombre}`);
        console.log(`name:      ${p1.name}`);
        console.log(`itemCode:  ${p1.itemCode}`);

        // 2. Printer Test
        const resPrinter = await fetch(url, {
            headers: { 'User-Agent': 'python-requests/2.25.1' }
        });
        const printerData = await resPrinter.json();
        const p2 = printerData.product;

        console.log("\n🖨️ Printer Request (Should contain mapped values):");
        console.log(`uvaNombre (Top -> Expect UVA):       ${p2.uvaNombre}`);
        console.log(`name      (Mid -> Expect NameEs):    ${p2.name}`);
        console.log(`itemCode  (Bot -> Expect ItemCode):  ${p2.itemCode}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProductAgents();
