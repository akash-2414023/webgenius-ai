import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { 
  normalizeEmail, 
  validatePassword, 
  hashPassword, 
  comparePassword, 
  generateJwtToken, 
  generateCryptoToken, 
  hashCryptoToken 
} from '../utils/security.js';
import { isDatabaseConnected } from '../db/connection.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { config } from '../config/env.js';

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: 'Database connection is currently offline. Please configure MONGODB_URI in server/.env.',
      });
      return;
    }

    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long.',
      });
      return;
    }

    const normalized = normalizeEmail(email);
    if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) {
      res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: passwordValidation.message,
      });
      return;
    }

    // Check duplicate account
    const existing = await User.findOne({ email: normalized });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalized,
      passwordHash,
    });

    const token = generateJwtToken(user._id.toString());
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during account creation. Please try again.',
    });
  }
}

export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: 'Database connection is currently offline. Please configure MONGODB_URI in server/.env.',
      });
      return;
    }

    const { email, password } = req.body;

    const normalized = normalizeEmail(email);
    if (!normalized || !password) {
      res.status(400).json({
        success: false,
        error: 'Both email and password are required.',
      });
      return;
    }

    const user = await User.findOne({ email: normalized });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const token = generateJwtToken(user._id.toString());
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
    });
  }
}

export async function handleLogout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function handleGetMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    },
  });
}

export async function handleUpdateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated.' });
      return;
    }

    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password is required to set a new password.',
        });
        return;
      }

      const isMatch = await comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect.',
        });
        return;
      }

      const val = validatePassword(newPassword);
      if (!val.isValid) {
        res.status(400).json({ success: false, error: val.message });
        return;
      }

      user.passwordHash = await hashPassword(newPassword);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile.',
    });
  }
}

export async function handleForgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const normalized = normalizeEmail(email);

    // Constant-time behavior: regardless of whether user exists, return generic message
    if (normalized && isDatabaseConnected()) {
      const user = await User.findOne({ email: normalized });
      if (user) {
        const { rawToken, hashedToken } = generateCryptoToken();
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;
        console.log(`\n🔑 [PASSWORD RECOVERY] Reset token generated for ${normalized}:`);
        console.log(`🔗 Reset Link: ${resetUrl}\n`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, password recovery instructions have been prepared.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing password recovery.',
    });
  }
}

export async function handleResetPassword(req: Request, res: Response): Promise<void> {
  try {
    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: 'Database connection offline. Please check MONGODB_URI.',
      });
      return;
    }

    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Password reset token is missing or invalid.',
      });
      return;
    }

    const val = validatePassword(newPassword);
    if (!val.isValid) {
      res.status(400).json({ success: false, error: val.message });
      return;
    }

    const hashedToken = hashCryptoToken(token.trim());
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Password reset link is invalid or has expired. Please request a new one.',
      });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = generateJwtToken(user._id.toString());
    res.cookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset.',
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
        token: jwtToken,
      },
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.',
    });
  }
}
