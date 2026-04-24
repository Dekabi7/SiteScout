const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, getOne } = require('../config/database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RESET_TOKEN_TTL_HOURS = 24; // 24 hours

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

function createResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Enhanced user registration
router.post('/signup', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      confirmPassword, 
      companyName, 
      phone 
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'First name, last name, email, password, and confirm password are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match',
        details: 'Password and confirm password must be identical'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password too short',
        details: 'Password must be at least 8 characters long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await getOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        details: 'An account with this email already exists. Please try logging in instead.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        company_name, 
        phone,
        plan_type,
        trial_ends_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, company_name, plan_type, created_at`,
      [
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        companyName || null,
        phone || null,
        'free',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7-day trial
      ]
    );

    const user = result.rows[0];
    const token = createToken({ 
      userId: user.id, 
      email: user.email,
      planType: user.plan_type
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        planType: user.plan_type,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      error: 'Failed to create account',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Enhanced login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        details: 'Email and password are required'
      });
    }

    // Get user with all fields
    const user = await getOne(`
      SELECT 
        id, 
        email, 
        password_hash, 
        first_name,
        last_name,
        company_name,
        plan_type,
        daily_export_count,
        daily_export_limit,
        trial_ends_at,
        created_at
      FROM users 
      WHERE email = $1
    `, [email.toLowerCase()]);

    if (!user || !user.password_hash) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Check if trial has expired
    const isTrialExpired = user.trial_ends_at && new Date() > new Date(user.trial_ends_at);
    const isOnFreePlan = user.plan_type === 'free';

    const token = createToken({ 
      userId: user.id, 
      email: user.email,
      planType: user.plan_type
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        planType: user.plan_type,
        dailyExportCount: user.daily_export_count,
        dailyExportLimit: user.daily_export_limit,
        trialEndsAt: user.trial_ends_at,
        isTrialExpired,
        isOnFreePlan,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Failed to login',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email required',
        details: 'Please provide your email address'
      });
    }

    // Check if user exists
    const user = await getOne('SELECT id, email, first_name FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = createResetToken();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    // Store reset token in database
    await query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires_at = $2 
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // TODO: Send email with reset link
    // For now, we'll just return success
    // In production, you'd send an email with: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    console.log(`Password reset token for ${email}: ${resetToken}`);

    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password too short',
        details: 'Password must be at least 8 characters long'
      });
    }

    // Find user with valid reset token
    const user = await getOne(`
      SELECT id, email 
      FROM users 
      WHERE reset_token = $1 
      AND reset_token_expires_at > NOW()
    `, [token]);

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired token',
        details: 'The password reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL 
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Verify JWT token
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token required',
        details: 'Please provide a valid token'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get current user data
    const user = await getOne(`
      SELECT 
        id, 
        email, 
        first_name,
        last_name,
        company_name,
        plan_type,
        daily_export_count,
        daily_export_limit,
        trial_ends_at,
        created_at
      FROM users 
      WHERE id = $1
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: 'User not found'
      });
    }

    const isTrialExpired = user.trial_ends_at && new Date() > new Date(user.trial_ends_at);
    const isOnFreePlan = user.plan_type === 'free';

    return res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        planType: user.plan_type,
        dailyExportCount: user.daily_export_count,
        dailyExportLimit: user.daily_export_limit,
        trialEndsAt: user.trial_ends_at,
        isTrialExpired,
        isOnFreePlan,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: 'Token is invalid or has expired'
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify token',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;

