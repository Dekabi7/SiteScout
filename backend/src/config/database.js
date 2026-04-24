const { Pool } = require('pg');
const { validateEnv } = require('./env');

// Validate environment variables before connecting
validateEnv();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    // console.log('Database connected successfully');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development') {
        // console.log('Executed query', { text, duration, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      console.error('Query error', { text, error });
      throw error;
    }
  },
  getOne: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows[0];
  },
  getClient: () => pool.connect(),
  pool,
};