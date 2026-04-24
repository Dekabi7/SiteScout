const { pool } = require('../src/config/database');

// Mock environment variables if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Global setup before all tests
beforeAll(async () => {
    // Any global setup
});

// Global teardown after all tests
afterAll(async () => {
    await pool.end();
});

// Mock console.error to keep test output clean (optional)
// global.console.error = jest.fn();
