const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'sitescout',
    password: '$!t3$c0ut',
    port: 5433,
});

async function run() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');

        console.log('Reading schema file...');
        const sql = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8');

        console.log('Applying schema...');
        await client.query(sql);
        console.log('Schema applied successfully!');

        await client.end();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
