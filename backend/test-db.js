const { pool } = require('./src/config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time from database:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await pool.end();
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Make sure to:');
    console.log('1. Install PostgreSQL');
    console.log('2. Run: .\\setup-database.ps1');
    process.exit(1);
  }
}

testConnection(); 