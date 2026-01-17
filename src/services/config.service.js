import prisma from '../prisma.js';

export const getConfig = async () => {
    let config = await prisma.systemConfig.findUnique({
        where: { id: 'singleton' }
    });

    if (!config) {
        config = await prisma.systemConfig.create({
            data: { id: 'singleton' }
        });
    }
    return config;
};

export const updateConfig = async (data) => {
    return prisma.systemConfig.upsert({
        where: { id: 'singleton' },
        update: data,
        create: { id: 'singleton', ...data }
    });
};
