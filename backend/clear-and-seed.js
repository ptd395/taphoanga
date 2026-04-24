require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearAndSeed() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Clearing old data...');
    
    await client.query('DELETE FROM CT_HOADONBAN');
    await client.query('DELETE FROM HOADONBAN');
    await client.query('DELETE FROM HANGHOA');
    // Keep TAIKHOAN (admin account)
    
    console.log('✅ Old data cleared');
    
    await client.release();
    await pool.end();
    
    console.log('🔄 Running seed...');
    require('./seed-quick.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

clearAndSeed();
