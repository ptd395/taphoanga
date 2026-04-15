// Uses Node.js built-in sqlite (available since Node v22.5+, stable in v24)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'taphoanga.db');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
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
      GIABAN REAL DEFAULT 0,
      GIANHAP REAL DEFAULT 0,
      SL_TON INTEGER DEFAULT 0,
      DMUC_TON_MIN INTEGER DEFAULT 0,
      TRANGTHAI_SP TEXT DEFAULT 'Đang bán',
      HINHANH TEXT
    );

    CREATE TABLE IF NOT EXISTS HOADONBAN (
      MAHDB TEXT PRIMARY KEY,
      NGUOITAO TEXT,
      TONGTIENHANG_BAN REAL DEFAULT 0,
      NGAYBAN TEXT DEFAULT (datetime('now','localtime')),
      PTTT TEXT DEFAULT 'Tiền mặt',
      TRANGTHAI_HDB TEXT DEFAULT 'Hoàn thành',
      GHICHU TEXT,
      FOREIGN KEY (NGUOITAO) REFERENCES TAIKHOAN(MATK)
    );

    CREATE TABLE IF NOT EXISTS CT_HOADONBAN (
      MAHDB TEXT,
      MASP TEXT,
      SOLUONG INTEGER DEFAULT 1,
      GIABAN REAL DEFAULT 0,
      PRIMARY KEY (MAHDB, MASP),
      FOREIGN KEY (MAHDB) REFERENCES HOADONBAN(MAHDB),
      FOREIGN KEY (MASP) REFERENCES HANGHOA(MASP)
    );
  `);
}

function generateMASP() {
  const d = getDb();
  // Lấy số thứ tự lớn nhất từ mã sản phẩm (Bỏ 2 ký tự 'SP' đầu và chuyển phần còn lại thành số)
  const row = d.prepare("SELECT CAST(SUBSTR(MASP, 3) AS INTEGER) AS num FROM HANGHOA ORDER BY num DESC LIMIT 1").get();
  
  const maxNum = (row && row.num) ? row.num : 0;
  const nextNum = maxNum + 1;
  
  return 'SP' + nextNum.toString().padStart(8, '0');
}

function generateMAHDB() {
  const d = getDb();
  while (true) {
    const num = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const id = 'HDB' + num;
    const exists = d.prepare('SELECT MAHDB FROM HOADONBAN WHERE MAHDB = ?').get(id);
    if (!exists) return id;
  }
}

function generateMATK() {
  const d = getDb();
  while (true) {
    const num = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const id = 'TK' + num;
    const exists = d.prepare('SELECT MATK FROM TAIKHOAN WHERE MATK = ?').get(id);
    if (!exists) return id;
  }
}

// Transaction helper compatible with node:sqlite
function transaction(db, fn) {
  db.exec('BEGIN');
  try {
    fn();
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { getDb, generateMASP, generateMAHDB, generateMATK, transaction };
