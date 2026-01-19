
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    const products = await prisma.product.findMany({ take: 5 });

    console.log('--- DIAGNÓSTICO DE PRODUCTOS ---');
    products.forEach(p => {
        console.log(`
Nombre: ${p.name}
SKU: ${p.sku}
Barcode: "${p.barcode}"
OEM (ItemCode): "${p.itemCode}"
UVA Nombre: "${p.uvaNombre}"
-----------------------------------`);
    });
}

checkData();
