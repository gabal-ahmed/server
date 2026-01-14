import prisma from '../prisma.js';
import { hashPassword } from '../utils/auth.js';

export const getAllUsers = async (params = {}) => {
  const { page = 1, limit = 10, search = '' } = params;
  const skip = (page - 1) * limit;

  const where = search ? {
    isDeleted: false,
    OR: [
      { name: { contains: search } }, 
      { email: { contains: search } }
    ]
  } : { isDeleted: false };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
};

export const deleteUser = async (id) => {
  return prisma.user.update({ where: { id }, data: { isDeleted: true } });
};

export const updateUser = async (id, data) => {
  if (data.password) {
    data.password = await hashPassword(data.password);
  }
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true }
  });
};

export const updateRole = async (id, role) => {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, role: true }
  });
};

export const getSystemStats = async () => {
  const [userCount, lessonCount, quizCount] = await Promise.all([
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.quiz.count()
  ]);
  
  return {
    users: userCount,
    lessons: lessonCount,
    quizzes: quizCount
  };
};
