const express = require('express');
const bcrypt = require('bcryptjs');
const { query, getOne } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await getOne(`
      SELECT 
        id, 
        email, 
        first_name,
        last_name,
        company_name,
        phone,
        plan_type,
        daily_export_count,
        daily_export_limit,
        trial_ends_at,
        email_verified,
        created_at,
        updated_at
      FROM users 
      WHERE id = $1
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'The requested user profile could not be found'
      });
    }

    const isTrialExpired = user.trial_ends_at && new Date() > new Date(user.trial_ends_at);
    const isOnFreePlan = user.plan_type === 'free';

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        phone: user.phone,
        planType: user.plan_type,
        dailyExportCount: user.daily_export_count,
        dailyExportLimit: user.daily_export_limit,
        trialEndsAt: user.trial_ends_at,
        emailVerified: user.email_verified,
        isTrialExpired,
        isOnFreePlan,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to get profile',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, companyName, phone } = req.body;

    // Validation
    if (firstName && firstName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid first name',
        details: 'First name cannot be empty'
      });
    }

    if (lastName && lastName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid last name',
        details: 'Last name cannot be empty'
      });
    }

    // Update user profile
    const result = await query(
      `UPDATE users 
       SET 
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         company_name = $3,
         phone = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, company_name, phone, updated_at`,
      [
        firstName?.trim() || null,
        lastName?.trim() || null,
        companyName?.trim() || null,
        phone?.trim() || null,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'The requested user could not be found'
      });
    }

    const user = result.rows[0];

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        phone: user.phone,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Current password, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match',
        details: 'New password and confirm password must be identical'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password too short',
        details: 'New password must be at least 8 characters long'
      });
    }

    // Get current user with password hash
    const user = await getOne('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'The requested user could not be found'
      });
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidCurrentPassword) {
      return res.status(400).json({ 
        error: 'Invalid current password',
        details: 'The current password you provided is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      error: 'Failed to change password',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Get user usage statistics
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    // Get search count for current month
    const searchResult = await getOne(`
      SELECT COUNT(*) as search_count
      FROM searches 
      WHERE user_id = $1 
      AND search_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [req.user.id]);

    // Get export count for current month
    const exportResult = await getOne(`
      SELECT COUNT(*) as export_count, SUM(records_count) as total_records
      FROM exports 
      WHERE user_id = $1 
      AND exported_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [req.user.id]);

    // Get daily export count for today
    const dailyExportResult = await getOne(`
      SELECT COUNT(*) as daily_export_count
      FROM exports 
      WHERE user_id = $1 
      AND exported_at >= DATE_TRUNC('day', CURRENT_DATE)
    `, [req.user.id]);

    return res.json({
      success: true,
      usage: {
        monthlySearches: parseInt(searchResult.search_count) || 0,
        monthlyExports: parseInt(exportResult.export_count) || 0,
        monthlyRecordsExported: parseInt(exportResult.total_records) || 0,
        dailyExports: parseInt(dailyExportResult.daily_export_count) || 0,
        dailyExportLimit: req.user.dailyExportLimit,
        dailyExportCount: req.user.dailyExportCount,
        planType: req.user.planType,
        trialEndsAt: req.user.trialEndsAt,
        isTrialExpired: req.user.isTrialExpired
      }
    });

  } catch (error) {
    console.error('Get usage error:', error);
    return res.status(500).json({ 
      error: 'Failed to get usage statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        error: 'Password required',
        details: 'Please provide your password to confirm account deletion'
      });
    }

    // Get user with password hash
    const user = await getOne('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'The requested user could not be found'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ 
        error: 'Invalid password',
        details: 'The password you provided is incorrect'
      });
    }

    // Delete user (this will cascade to related records due to foreign key constraints)
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);

    return res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete account',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

module.exports = router;
