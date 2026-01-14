import prisma from '../prisma.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

export const register = async ({ email, password, name, role }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const hashedPassword = await hashPassword(password);
  
  // Default to STUDENT if role not provided or if public registration logic limits it.
  // For this project, we'll accept role if valid, default STUDENT.
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'STUDENT',
    },
  });

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new Error('Invalid credentials');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};
