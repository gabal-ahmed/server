
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Backfilling subscription statuses...');

    // Update all subscriptions that have default 'PENDING' (which will be all of them after migration if we rely on default)
    // Actually, prisma db push might not backfill default values for existing rows if the column is added.
    // It usually adds the column. If it's required and has a default, SQLite/Postgres fills it.
    // But let's be sure and set everything to APPROVED to avoid disruption.

    const result = await prisma.subscription.updateMany({
        data: {
            status: 'APPROVED'
        }
    });

    console.log(`Updated ${result.count} subscriptions to APPROVED.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
