import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma';
import { generateToken } from '../lib/jwt';
import { ApiResponse } from '../utils/ApiResponse';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role } = req.body as RegisterInput;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json(ApiResponse.error('Email already registered'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as 'INSTRUCTOR' | 'STUDENT',
        isEmailVerified: false,
        isActive: true,
        ...(role === 'INSTRUCTOR'
          ? { instructorProfile: { create: {} } }
          : { studentProfile: { create: {} } }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.status(201).json(ApiResponse.success({ user, token }));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(ApiResponse.error('Registration failed'));
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json(ApiResponse.error('Invalid email or password'));
      return;
    }

    if (!user.isActive) {
      res.status(401).json(ApiResponse.error('Account is deactivated'));
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      res.status(401).json(ApiResponse.error('Invalid email or password'));
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json(ApiResponse.success({ user: userWithoutPassword, token }));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(ApiResponse.error('Login failed'));
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Not authenticated'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        instructorProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      res.status(404).json(ApiResponse.error('User not found'));
      return;
    }

    res.json(ApiResponse.success(user));
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch user'));
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json(ApiResponse.success({ message: 'Logged out successfully' }));
};
