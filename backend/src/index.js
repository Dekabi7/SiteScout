const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: './config.env' });

const businessSearchRoutes = require('./routes/businessSearch');
const tileCrawlerRoutes = require('./routes/tileCrawler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stripeRoutes = require('./routes/stripe');
const savedBusinessesRoutes = require('./routes/savedBusinesses');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SiteScout API'
  });
});

// API Routes
app.use('/api/businesses', businessSearchRoutes);
app.use('/api/crawler', tileCrawlerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/saved-businesses', savedBusinessesRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SiteScout API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Business search: http://localhost:${PORT}/api/businesses/search`);
    console.log(`🗺️ Tile crawler: http://localhost:${PORT}/api/crawler/crawl-city`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;