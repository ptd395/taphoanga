const { getDb, transaction } = require('./db/database');

function fixProductPrices() {
  const db = getDb();
  
  console.log('Đang sửa giá sản phẩm cho thực tế hơn...');
  
  transaction(db, () => {
    // Lấy tất cả sản phẩm
    const products = db.prepare('SELECT MASP, TENSP FROM HANGHOA').all();
    
    const updatePrice = db.prepare('UPDATE HANGHOA SET GIABAN = ?, GIANHAP = ? WHERE MASP = ?');
    
    for (const p of products) {
      let giaban;
      const tensp = p.TENSP.toLowerCase();
      
      // Phân loại theo tên sản phẩm
      if (tensp.includes('nước') || tensp.includes('coca') || tensp.includes('pepsi') || tensp.includes('sting') || tensp.includes('trà')) {
        giaban = Math.floor(Math.random() * 6 + 8) * 1000; // 8k-13k
      } else if (tensp.includes('mì') || tensp.includes('miến') || tensp.includes('phở')) {
        giaban = Math.floor(Math.random() * 3 + 4) * 1000; // 4k-6k
      } else if (tensp.includes('bánh') || tensp.includes('snack') || tensp.includes('kẹo')) {
        giaban = Math.floor(Math.random() * 10 + 5) * 1000; // 5k-14k
      } else if (tensp.includes('sữa')) {
        giaban = Math.floor(Math.random() * 15 + 10) * 1000; // 10k-24k
      } else if (tensp.includes('dầu') || tensp.includes('nước mắm') || tensp.includes('tương')) {
        giaban = Math.floor(Math.random() * 20 + 25) * 1000; // 25k-44k
      } else if (tensp.includes('bột giặt') || tensp.includes('nước giặt')) {
        giaban = Math.floor(Math.random() * 30 + 40) * 1000; // 40k-69k
      } else if (tensp.includes('dầu gội') || tensp.includes('sữa tắm')) {
        giaban = Math.floor(Math.random() * 25 + 30) * 1000; // 30k-54k
      } else if (tensp.includes('kem đánh răng')) {
        giaban = Math.floor(Math.random() * 15 + 20) * 1000; // 20k-34k
      } else if (tensp.includes('xà phòng')) {
        giaban = Math.floor(Math.random() * 8 + 10) * 1000; // 10k-17k
      } else if (tensp.includes('gạo')) {
        giaban = Math.floor(Math.random() * 30 + 50) * 1000; // 50k-79k
      } else {
        giaban = Math.floor(Math.random() * 15 + 10) * 1000; // 10k-24k (mặc định)
      }
      
      const gianhap = Math.floor(giaban * 0.75); // Giá nhập = 75% giá bán
      
      updatePrice.run(giaban, gianhap, p.MASP);
    }
  });
  
  console.log('✅ Đã sửa giá cho tất cả sản phẩm!');
  
  // Hiển thị một số sản phẩm mẫu
  const samples = db.prepare('SELECT MASP, TENSP, GIABAN FROM HANGHOA ORDER BY RANDOM() LIMIT 10').all();
  console.log('\n📦 Một số sản phẩm mẫu:');
  samples.forEach(p => {
    console.log(`   ${p.MASP} - ${p.TENSP}: ${p.GIABAN.toLocaleString('vi-VN')}đ`);
  });
}

try {
  fixProductPrices();
} catch (err) {
  console.error('Lỗi:', err);
  process.exit(1);
}
