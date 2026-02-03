
async function checkProduct() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        // Find a product with useful data
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { uvaNombre: { not: null } },
                    { itemCode: { not: null } }
                ]
            }
        });

        if (!product) {
            console.log("No products with UVA/OEM values found in DB");
            return;
        }

        console.log(`Checking Product: ${product.name} (ID: ${product.id})`);
        console.log(`Original DB Values -> UVA: ${product.uvaNombre}, OEM: ${product.itemCode}`);

        const response = await fetch(`http://localhost:3000/api/inventory/${product.id}`);
        const data = await response.json();

        if (data.status === 'success') {
            console.log("\nAPI Response (Should be Swapped & Prefixed):");
            console.log(`uvaNombre (Expect OEM): ${data.product.uvaNombre}`);
            console.log(`itemCode  (Expect UVA): ${data.product.itemCode}`);
        } else {
            console.log("API Error:", data);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProduct();
