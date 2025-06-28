import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { nanoid } from 'nanoid';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User, LoginRequest, RegisterRequest } from '@shared/schema';
import './types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email verification skipped - SMTP credentials not configured');
    return;
  }

  const transporter = createEmailTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verify your CognoQuest account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">CognoQuest</h1>
          <p style="color: #6B7280; margin: 5px 0;">Your Brain Gym Learning Platform</p>
        </div>
        
        <div style="background: #F9FAFB; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1F2937; margin-top: 0;">Welcome to CognoQuest!</h2>
          <p style="color: #4B5563; line-height: 1.6;">
            Thank you for signing up! To start solving puzzles and tracking your progress, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block; font-weight: 600;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #3B82F6;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await storage.getUser(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

// Optional authentication middleware (for routes that work with or without auth)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await storage.getUser(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  }

  next();
}

// Register user
export async function registerUser(userData: RegisterRequest): Promise<{ user: User; token: string }> {
  const existingUser = await storage.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const hashedPassword = await hashPassword(userData.password);
  const verificationToken = nanoid();

  const userId = nanoid();
  const user = await storage.createUser({
    id: userId,
    email: userData.email,
    passwordHash: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    emailVerified: false,
    verificationToken,
    provider: 'email',
  });

  // Send verification email
  try {
    await sendVerificationEmail(userData.email, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  const token = generateToken(user.id);
  return { user, token };
}

// Login user
export async function loginUser(credentials: LoginRequest): Promise<{ user: User; token: string }> {
  const user = await storage.getUserByEmail(credentials.email);
  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await comparePassword(credentials.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user.id);
  return { user, token };
}

// Verify email
export async function verifyUserEmail(token: string): Promise<User> {
  const user = await storage.getUserByEmail(''); // We'll need to find by verification token
  // This would require updating the storage interface to find by verification token
  // For now, we'll implement a simplified version

  // TODO: Implement proper verification token lookup in storage
  throw new Error('Email verification not fully implemented');
}