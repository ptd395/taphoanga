const { getDb } = require('./db/database');

const db = getDb();

// Tìm sản phẩm có chữ "kem"
console.log('=== SẢN PHẨM CÓ CHỮ "KEM" ===');
const kemProducts = db.prepare(`
  SELECT MASP, TENSP, GIABAN, GIANHAP 
  FROM HANGHOA 
  WHERE LOWER(TENSP) LIKE '%kem%'
`).all();

kemProducts.forEach(p => {
  console.log(`${p.MASP} - ${p.TENSP}`);
  console.log(`  Giá bán: ${p.GIABAN.toLocaleString('vi-VN')}đ`);
  console.log(`  Giá nhập: ${p.GIANHAP.toLocaleString('vi-VN')}đ`);
  console.log('');
});

// Thống kê giá
console.log('\n=== THỐNG KÊ GIÁ ===');
const stats = db.prepare(`
  SELECT 
    MIN(GIABAN) as min_price,
    MAX(GIABAN) as max_price,
    AVG(GIABAN) as avg_price
  FROM HANGHOA
`).get();

console.log(`Giá thấp nhất: ${stats.min_price.toLocaleString('vi-VN')}đ`);
console.log(`Giá cao nhất: ${stats.max_price.toLocaleString('vi-VN')}đ`);
console.log(`Giá trung bình: ${Math.round(stats.avg_price).toLocaleString('vi-VN')}đ`);
