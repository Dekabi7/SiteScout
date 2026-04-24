const jwt = require('jsonwebtoken');
const { getOne } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        details: 'Please provide a valid authentication token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data
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
        email_verified,
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

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      companyName: user.company_name,
      planType: user.plan_type,
      dailyExportCount: user.daily_export_count,
      dailyExportLimit: user.daily_export_limit,
      trialEndsAt: user.trial_ends_at,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      isTrialExpired: user.trial_ends_at && new Date() > new Date(user.trial_ends_at),
      isOnFreePlan: user.plan_type === 'free'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        details: 'Your session has expired. Please log in again.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
};

// Middleware to check if user has required plan
const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'Please log in to access this feature'
      });
    }

    const planHierarchy = {
      'free': 0,
      'pro': 1,
      'agency': 2
    };

    const userPlanLevel = planHierarchy[req.user.planType] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({ 
        error: 'Plan upgrade required',
        details: `This feature requires a ${requiredPlan} plan or higher`,
        currentPlan: req.user.planType,
        requiredPlan: requiredPlan
      });
    }

    next();
  };
};

// Middleware to check if user is within export limits
const checkExportLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'Please log in to access this feature'
      });
    }

    // Check if user has exceeded daily export limit
    if (req.user.dailyExportCount >= req.user.dailyExportLimit) {
      return res.status(429).json({ 
        error: 'Export limit exceeded',
        details: `You have reached your daily export limit of ${req.user.dailyExportLimit}. Please upgrade your plan for higher limits.`,
        currentCount: req.user.dailyExportCount,
        limit: req.user.dailyExportLimit
      });
    }

    next();
  } catch (error) {
    console.error('Export limit check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check export limit',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
};

// Middleware to check if trial is still active
const checkTrialStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      details: 'Please log in to access this feature'
    });
  }

  if (req.user.isTrialExpired && req.user.isOnFreePlan) {
    return res.status(403).json({ 
      error: 'Trial expired',
      details: 'Your free trial has expired. Please upgrade to continue using SiteScout.',
      trialEndedAt: req.user.trialEndsAt
    });
  }

  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user data
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
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
        email_verified,
        created_at
      FROM users 
      WHERE id = $1
    `, [decoded.userId]);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        companyName: user.company_name,
        planType: user.plan_type,
        dailyExportCount: user.daily_export_count,
        dailyExportLimit: user.daily_export_limit,
        trialEndsAt: user.trial_ends_at,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        isTrialExpired: user.trial_ends_at && new Date() > new Date(user.trial_ends_at),
        isOnFreePlan: user.plan_type === 'free'
      };
    }

    next();
  } catch (error) {
    // Continue without user data if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requirePlan,
  checkExportLimit,
  checkTrialStatus,
  optionalAuth
};
