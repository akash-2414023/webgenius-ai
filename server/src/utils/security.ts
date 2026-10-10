import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';

export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { isValid: false, message: 'Password cannot exceed 128 characters.' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: 'Password must contain at least one letter and one number.' };
  }
  return { isValid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJwtToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: '7d',
    issuer: 'WebGeniusAI',
  });
}

export function verifyJwtToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: 'WebGeniusAI',
    }) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export function generateCryptoToken(): { rawToken: string; hashedToken: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
}

export function hashCryptoToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
