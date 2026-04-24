// PostgreSQL database connection for shared testing
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set. Please add it to your .env file.');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    });

    console.log('✅ PostgreSQL connection pool created');
  }
  return pool;
}

async function initSchema() {
  const pool = getPool();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS TAIKHOAN (
      MATK TEXT PRIMARY KEY,
      TENDN TEXT UNIQUE NOT NULL,
      MATKHAU TEXT NOT NULL,
      SDT TEXT,
      TENHT TEXT
    );

    CREATE TABLE IF NOT EXISTS HANGHOA (
      MASP TEXT PRIMARY KEY,
      TENSP TEXT NOT NULL,
      DVT TEXT DEFAULT 'Cái',
      GIABAN DECIMAL(15,2) DEFAULT 0,
      GIANHAP DECIMAL(15,2) DEFAULT 0,
      SL_TON INTEGER DEFAULT 0,
      DMUC_TON_MIN INTEGER DEFAULT 0,
      TRANGTHAI_SP TEXT DEFAULT 'Đang bán',
      HINHANH TEXT,
      NGAYTAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS HOADONBAN (
      MAHDB TEXT PRIMARY KEY,
      NGUOITAO TEXT,
      TONGTIENHANG_BAN DECIMAL(15,2) DEFAULT 0,
      NGAYBAN TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PTTT TEXT DEFAULT 'Tiền mặt',
      TRANGTHAI_HDB TEXT DEFAULT 'Hoàn thành',
      GHICHU TEXT,
      FOREIGN KEY (NGUOITAO) REFERENCES TAIKHOAN(MATK)
    );

    CREATE TABLE IF NOT EXISTS CT_HOADONBAN (
      MAHDB TEXT,
      MASP TEXT,
      SOLUONG INTEGER DEFAULT 1,
      GIABAN DECIMAL(15,2) DEFAULT 0,
      PRIMARY KEY (MAHDB, MASP),
      FOREIGN KEY (MAHDB) REFERENCES HOADONBAN(MAHDB),
      FOREIGN KEY (MASP) REFERENCES HANGHOA(MASP)
    );
  `);

  console.log('✅ PostgreSQL schema initialized');
}

async function generateMASP() {
  const pool = getPool();
  const result = await pool.query(
    "SELECT CAST(SUBSTRING(MASP FROM 3) AS INTEGER) AS num FROM HANGHOA ORDER BY num DESC LIMIT 1"
  );
  
  const maxNum = (result.rows[0] && result.rows[0].num) ? result.rows[0].num : 0;
  const nextNum = maxNum + 1;
  
  return 'SP' + nextNum.toString().padStart(8, '0');
}

async function generateMAHDB() {
  const pool = getPool();
  while (true) {
    const num = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const id = 'HDB' + num;
    const result = await pool.query('SELECT MAHDB FROM HOADONBAN WHERE MAHDB = $1', [id]);
    if (result.rows.length === 0) return id;
  }
}

async function generateMATK() {
  const pool = getPool();
  while (true) {
    const num = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const id = 'TK' + num;
    const result = await pool.query('SELECT MATK FROM TAIKHOAN WHERE MATK = $1', [id]);
    if (result.rows.length === 0) return id;
  }
}

// Transaction helper for PostgreSQL
async function transaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { 
  getPool, 
  initSchema, 
  generateMASP, 
  generateMAHDB, 
  generateMATK, 
  transaction 
};
