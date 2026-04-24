require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    const client = await pool.connect();
    
    // Check accounts
    const accounts = await client.query('SELECT COUNT(*) as cnt FROM TAIKHOAN');
    console.log('✅ Tài khoản:', accounts.rows[0].cnt);
    
    // Check products
    const products = await client.query('SELECT COUNT(*) as cnt FROM HANGHOA');
    console.log('✅ Hàng hóa:', products.rows[0].cnt);
    
    // Check invoices
    const invoices = await client.query('SELECT COUNT(*) as cnt FROM HOADONBAN');
    console.log('✅ Hóa đơn:', invoices.rows[0].cnt);
    
    // Check admin account
    const admin = await client.query("SELECT * FROM TAIKHOAN WHERE TENDN = 'admin'");
    if (admin.rows.length > 0) {
      console.log('✅ Admin account exists:', admin.rows[0].tendn);
    } else {
      console.log('❌ Admin account NOT found!');
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
