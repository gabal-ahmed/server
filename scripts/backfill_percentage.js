
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting backfill of percentages...');

    const results = await prisma.result.findMany();
    console.log(`Found ${results.length} results to check.`);

    let updatedCount = 0;

    for (const r of results) {
        if (r.total > 0) {
            const percentage = (r.score / r.total) * 100;
            // Precision update if needed, but float is fine
            await prisma.result.update({
                where: { id: r.id },
                data: { percentage }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} results with percentage values.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
