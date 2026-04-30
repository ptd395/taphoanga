const { getDb } = require('./db/database');

const db = getDb();

// Đếm tổng số sản phẩm
const total = db.prepare('SELECT COUNT(*) as cnt FROM HANGHOA').get();
console.log(`\n📦 Tổng số sản phẩm: ${total.cnt}`);

// Lấy 10 sản phẩm ngẫu nhiên
const products = db.prepare('SELECT * FROM HANGHOA ORDER BY RANDOM() LIMIT 10').all();
console.log('\n🎲 10 sản phẩm ngẫu nhiên:\n');

products.forEach((p, i) => {
  console.log(`${i + 1}. ${p.MASP} - ${p.TENSP}`);
  console.log(`   Giá: ${p.GIABAN.toLocaleString('vi-VN')}đ | Tồn: ${p.SL_TON} ${p.DVT}\n`);
});

// Thống kê theo trạng thái
const stats = db.prepare(`
  SELECT TRANGTHAI_SP, COUNT(*) as cnt 
  FROM HANGHOA 
  GROUP BY TRANGTHAI_SP
`).all();

console.log('📊 Thống kê theo trạng thái:');
stats.forEach(s => {
  console.log(`   ${s.TRANGTHAI_SP}: ${s.cnt} sản phẩm`);
});

// Sản phẩm đắt nhất và rẻ nhất
const expensive = db.prepare('SELECT * FROM HANGHOA ORDER BY GIABAN DESC LIMIT 1').get();
const cheapest = db.prepare('SELECT * FROM HANGHOA ORDER BY GIABAN ASC LIMIT 1').get();

console.log(`\n💰 Sản phẩm đắt nhất: ${expensive.TENSP} - ${expensive.GIABAN.toLocaleString('vi-VN')}đ`);
console.log(`💵 Sản phẩm rẻ nhất: ${cheapest.TENSP} - ${cheapest.GIABAN.toLocaleString('vi-VN')}đ\n`);
