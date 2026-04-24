require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedAdmin() {
  try {
    console.log('🔄 Creating admin account...');
    
    const adminId = 'TK00000001';
    const hashedPw = bcrypt.hashSync('Admin123', 10);
    
    await pool.query(
      `INSERT INTO TAIKHOAN (MATK, TENDN, MATKHAU, SDT, TENHT) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (MATK) DO NOTHING`,
      [adminId, 'admin', hashedPw, '0987654321', 'Chủ Tiệm Nga']
    );
    
    console.log('✅ Admin account created!');
    console.log('   Username: admin');
    console.log('   Password: Admin123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
