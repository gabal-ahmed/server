import prisma from './src/prisma.js';

const check = async () => {
    const stages = await prisma.stage.count();
    const grades = await prisma.grade.count();
    const subjects = await prisma.subject.count();
    const units = await prisma.unit.count();
    
    console.log('--- DB COUNTS ---');
    console.log(`Stages: ${stages}`);
    console.log(`Grades: ${grades}`);
    console.log(`Subjects: ${subjects}`);
    console.log(`Units: ${units}`);
    console.log('-----------------');
};

check();
