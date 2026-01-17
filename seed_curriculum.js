import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

const seed = async () => {
    try {
        // 1. Create Admin
        const hashedPassword = await hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { email: 'admin@mansa.edu' },
            update: {},
            create: {
                email: 'admin@mansa.edu',
                password: hashedPassword,
                name: 'System Admin',
                role: 'ADMIN'
            }
        });
        console.log('Admin created:', admin.email);

        // ---------- Middle School / الإعدادي ----------
        const middleSchool = await prisma.stage.upsert({
            where: { name: 'Middle School' },
            update: {},
            create: {
                name: 'Middle School',
                grades: {
                    create: [
                        {
                            name: 'Grade 7',
                            subjects: {
                                create: [
                                    {
                                        name: 'Science',
                                        units: {
                                            create: [
                                                { name: 'Introduction to Biology' },
                                                { name: 'Basic Chemistry' },
                                                { name: 'Earth & Space' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            name: 'Grade 8',
                            subjects: {
                                create: [
                                    {
                                        name: 'Science',
                                        units: {
                                            create: [
                                                { name: 'Human Body' },
                                                { name: 'Chemical Reactions' },
                                                { name: 'Rocks & Minerals' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            name: 'Grade 9',
                            subjects: {
                                create: [
                                    {
                                        name: 'Science',
                                        units: {
                                            create: [
                                                { name: 'Genetics Basics' },
                                                { name: 'Physics Fundamentals' },
                                                { name: 'Earth Systems' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        // ---------- High School / الثانوي ----------
        const highSchool = await prisma.stage.upsert({
            where: { name: 'High School' },
            update: {},
            create: {
                name: 'High School',
                grades: {
                    create: [
                        {
                            name: 'Grade 10',
                            subjects: {
                                create: [
                                    {
                                        name: 'Biology',
                                        units: {
                                            create: [
                                                { name: 'Cell Biology' },
                                                { name: 'Ecology' },
                                                { name: 'Genetics' }
                                            ]
                                        }
                                    },
                                    {
                                        name: 'Geology',
                                        units: {
                                            create: [
                                                { name: 'Mineralogy' },
                                                { name: 'Volcanology' },
                                                { name: 'Plate Tectonics' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            name: 'Grade 11',
                            subjects: {
                                create: [
                                    {
                                        name: 'Biology',
                                        units: {
                                            create: [
                                                { name: 'Human Anatomy' },
                                                { name: 'Evolution' }
                                            ]
                                        }
                                    },
                                    {
                                        name: 'Geology',
                                        units: {
                                            create: [
                                                { name: 'Sedimentary Rocks' },
                                                { name: 'Geological Mapping' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            name: 'Grade 12',
                            subjects: {
                                create: [
                                    {
                                        name: 'Biology',
                                        units: {
                                            create: [
                                                { name: 'Microbiology' },
                                                { name: 'Biotechnology' }
                                            ]
                                        }
                                    },
                                    {
                                        name: 'Geology',
                                        units: {
                                            create: [
                                                { name: 'Petrology' },
                                                { name: 'Structural Geology' }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        console.log('Curriculum seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
};

seed().catch(e => console.error(e)).finally(async () => {
    await prisma.$disconnect();
});
