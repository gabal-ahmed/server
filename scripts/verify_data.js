
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Result Table Values ---');
    const results = await prisma.result.findMany({
        select: { id: true, score: true, total: true, percentage: true }
    });
    console.table(results);

    console.log('\n--- Checking Sorting Logic (Highest Score) ---');
    // Simulate the query used in subscription.service.js
    const attempts = await prisma.quizAttempt.findMany({
        where: { completedAt: { not: null } },
        include: {
            result: {
                select: {
                    score: true,
                    total: true,
                    percentage: true
                }
            }
        },
        orderBy: [
            { result: { percentage: 'desc' } }, // Sort by percentage descending
            { completedAt: 'desc' }
        ],
        take: 10
    });

    console.log('Top 10 Attempts (Sorted by Percentage DESC):');
    attempts.forEach(a => {
        console.log(`Score: ${a.result.score}/${a.result.total} | Percentage: ${a.result.percentage}% | Passed: ${a.result.passed}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
