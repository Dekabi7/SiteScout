const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '$!t3$c0ut',
    port: 5433,
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database');
        console.log('Databases:');
        res.rows.forEach(r => {
            console.log(`'${r.datname}' (len: ${r.datname.length})`);
            for (let i = 0; i < r.datname.length; i++) {
                console.log(`  ${r.datname[i]}: ${r.datname.charCodeAt(i)}`);
            }
        });
        await client.end();
    } catch (err) {
        console.error(err);
    }
}

run();
