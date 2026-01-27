const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany({
            select: {
                photoId: true,
                sku: true,
                name: true
            }
        });

        console.log(`Total items in DB: ${products.length}`);

        // Extract Photo IDs and ensure they are numbers
        const ids = products
            .map(p => parseInt(p.photoId))
            .filter(id => !isNaN(id))
            .sort((a, b) => a - b);

        if (ids.length === 0) {
            console.log("No numeric photoIds found.");
            return;
        }

        const min = ids[0];
        const max = ids[ids.length - 1];

        console.log(`Min PhotoID: ${min}`);
        console.log(`Max PhotoID: ${max}`);
        console.log(`Expected count (if contiguous): ${max - min + 1}`);
        console.log(`Missing count: ${(max - min + 1) - ids.length}`);

        const missing = [];
        for (let i = min; i <= max; i++) {
            if (!ids.includes(i)) {
                missing.push(i);
            }
        }

        if (missing.length > 0) {
            console.log("\n--- MISSING PHOTO IDS ---");
            console.log("ID\t| Excel Row (Approx ID+3)");
            console.log("-".repeat(30));
            missing.forEach(id => {
                console.log(`${id}\t| ${id + 3}`);
            });
        } else {
            console.log("\nNo gaps found in the sequence!");
            // If no gaps, maybe duplicates?
            const unique = new Set(ids);
            if (unique.size !== ids.length) {
                console.log("WARNING: Duplicates found!");
            }
        }

        // Check duplicates just in case
        const seen = new Set();
        const duplicates = [];
        for (const id of ids) {
            if (seen.has(id)) duplicates.push(id);
            seen.add(id);
        }

        if (duplicates.length > 0) {
            console.log("\n--- DUPLICATE IDS ---");
            console.log(duplicates.join(', '));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
