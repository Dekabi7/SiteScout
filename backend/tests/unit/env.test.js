const { validateEnv } = require('../../src/config/env');

describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should validate successfully when all required variables are present', () => {
        process.env.DB_USER = 'test';
        process.env.DB_HOST = 'localhost';
        process.env.DB_NAME = 'test_db';
        process.env.DB_PASSWORD = 'pass';
        process.env.JWT_SECRET = 'secret';

        expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when required variables are missing', () => {
        delete process.env.DB_USER;

        expect(() => validateEnv()).toThrow('Missing required environment variables');
    });
});
