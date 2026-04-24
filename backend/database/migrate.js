const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get applied migrations
    const { rows: appliedMigrations } = await client.query(
      'SELECT name FROM migrations'
    );
    const appliedNames = new Set(appliedMigrations.map(m => m.name));

    // Get migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`Applying migration: ${file}`);

        const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        // Split into Up and Down (simple implementation, assumes -- Down Migration marker)
        const [upSql] = content.split('-- Down Migration');

        await client.query('BEGIN');
        try {
          await client.query(upSql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`Successfully applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
