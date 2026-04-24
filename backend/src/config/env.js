const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

const requiredEnvVars = [
    'DB_USER',
    'DB_HOST',
    'DB_NAME',
    'DB_PASSWORD',
    'JWT_SECRET'
];

// Validate required environment variables
function validateEnv() {
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Set defaults for optional variables
    process.env.PORT = process.env.PORT || 3001;
    process.env.DB_PORT = process.env.DB_PORT || 5433;
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
}

module.exports = {
    validateEnv
};
