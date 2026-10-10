import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/security.js';
import { User, IUser } from '../models/User.js';
import { isDatabaseConnected } from '../db/connection.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to continue.',
      });
      return;
    }

    const payload = verifyJwtToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please log in again.',
      });
      return;
    }

    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: 'Database connection is temporarily unavailable. Please try again shortly.',
      });
      return;
    }

    const user = await User.findById(payload.userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User account not found. Please log in again.',
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected authentication error occurred.',
    });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      next();
      return;
    }

    const payload = verifyJwtToken(token);
    if (payload && payload.userId && isDatabaseConnected()) {
      const user = await User.findById(payload.userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
      if (user) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }
  } catch (error) {
    // Non-blocking for optional auth
  }
  next();
}

function extractToken(req: Request): string | null {
  // 1. From HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  // 2. From Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}
