require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Testing PostgreSQL connection...');
console.log('📍 Host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('⏳ Connecting...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query test:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('📋 Error details:', error);
    process.exit(1);
  }
}

testConnection();
