const { pool } = require('../../src/config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    const client = await pool.connect();

    try {
        console.log('Starting database seeding...');
        await client.query('BEGIN');

        // Clear existing data
        await client.query('TRUNCATE TABLE search_history, saved_businesses, businesses, users RESTART IDENTITY CASCADE');

        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10);
        const userResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role, subscription_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['test@example.com', hashedPassword, 'Test User', 'user', 'pro']);

        const userId = userResult.rows[0].id;
        console.log(`Created test user with ID: ${userId}`);

        // Create test businesses
        const businesses = [
            {
                google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
                name: 'Google Sydney',
                address: '48 Pirrama Rd, Pyrmont NSW 2009, Australia',
                category: 'Software Company',
                rating: 4.8,
                reviews_count: 1500,
                has_website: true,
                website_url: 'https://www.google.com.au'
            },
            {
                google_place_id: 'ChIJsXwWJm2uEmsR7t4_kZ88sQ0',
                name: 'Local Cafe',
                address: '123 Test St, Sydney NSW 2000',
                category: 'Cafe',
                rating: 4.2,
                reviews_count: 45,
                has_website: false,
                website_url: null
            }
        ];

        for (const bus of businesses) {
            await client.query(`
        INSERT INTO businesses (
          google_place_id, name, address, category, rating, 
          reviews_count, has_website, website_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
                bus.google_place_id, bus.name, bus.address, bus.category,
                bus.rating, bus.reviews_count, bus.has_website, bus.website_url
            ]);
        }
        console.log(`Created ${businesses.length} test businesses`);

        await client.query('COMMIT');
        console.log('Database seeding completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();
