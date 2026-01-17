import prisma from '../prisma.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { notifyAdminOfNewRegistration } from '../utils/email.js';
import { getConfig } from './config.service.js';

export const register = async ({ email, password, name, role }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (!existingUser.isActive) {
      throw new Error('Account pending admin approval');
    }
    throw new Error('Email already in use');
  }

  // Check system configuration for approval requirement
  const config = await getConfig();
  const requiresApproval = config.requireApproval;

  const hashedPassword = await hashPassword(password);

  // Default to STUDENT if role not provided or if public registration logic limits it.
  // For this project, we'll accept role if valid, default STUDENT.
  // Set isActive based on system configuration
  const isActive = !requiresApproval; // If approval required, user starts as inactive

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'STUDENT',
      isActive: isActive,
    },
  });

  // Notify Admin of new registration
  notifyAdminOfNewRegistration(user).catch(console.error);

  // Don't generate token for inactive users
  if (!user.isActive) {
    return { user, message: 'Registration successful! Your account is pending admin approval.' };
  }

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Account pending admin approval');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};
