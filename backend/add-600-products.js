const { getDb, transaction } = require('./db/database');

// Danh sách các loại sản phẩm tạp hóa
const categories = {
  'Đồ ăn vặt': [
    'Bánh mì', 'Bánh bao', 'Bánh quy', 'Bánh snack', 'Kẹo', 'Chocolate', 
    'Bánh gạo', 'Bánh tráng', 'Mứt', 'Hạt điều', 'Hạt hướng dương'
  ],
  'Nước giải khát': [
    'Nước ngọt', 'Nước suối', 'Trà', 'Cà phê', 'Nước tăng lực', 
    'Sữa', 'Nước ép', 'Nước khoáng', 'Bia'
  ],
  'Mì ăn liền': [
    'Mì Hảo Hảo', 'Mì Omachi', 'Mì Kokomi', 'Mì 3 Miền', 'Mì Cung Đình',
    'Mì Gấu Đỏ', 'Mì Vifon', 'Miến', 'Phở ăn liền', 'Hủ tiếu ăn liền'
  ],
  'Gia vị': [
    'Nước mắm', 'Nước tương', 'Dầu ăn', 'Muối', 'Đường', 'Bột ngọt',
    'Hạt nêm', 'Tương ớt', 'Tương đen', 'Giấm', 'Mắm tôm'
  ],
  'Vệ sinh': [
    'Bột giặt', 'Nước giặt', 'Xà phòng', 'Dầu gội', 'Sữa tắm', 
    'Kem đánh răng', 'Nước rửa chén', 'Nước lau nhà', 'Giấy vệ sinh'
  ],
  'Thực phẩm khô': [
    'Gạo', 'Đường', 'Muối', 'Bột mì', 'Bột năng', 'Đậu', 'Hạt sen',
    'Nấm khô', 'Mè', 'Vừng'
  ],
  'Đồ hộp': [
    'Sữa đặc', 'Sữa tươi hộp', 'Cá hộp', 'Thịt hộp', 'Ngô hộp',
    'Đậu hộp', 'Nước cốt dừa', 'Trái cây hộp'
  ]
};

const brands = [
  'Vinamilk', 'TH True Milk', 'Dutch Lady', 'Milo', 'Nestlé', 'Coca Cola', 
  'Pepsi', 'Lavie', 'Aquafina', 'Number 1', 'Sting', 'Red Bull', 'Oishi',
  'Hảo Hảo', 'Omachi', 'Kokomi', '3 Miền', 'Cung Đình', 'Vifon', 'Omo',
  'Tide', 'Ariel', 'Comfort', 'Downy', 'Sunlight', 'Vim', 'Clear', 'Dove',
  'Lifebuoy', 'P/S', 'Colgate', 'Close Up', 'Neptune', 'Tường An', 'Maggi',
  'Knorr', 'Chinsu', 'Nam Ngư', 'Phú Quốc', 'Staff', 'Oreo', 'Cosy'
];

const sizes = ['50g', '100g', '150g', '200g', '250g', '300g', '400g', '500g', '800g', '1kg', 
               '100ml', '200ml', '330ml', '500ml', '1L', '1.5L', '2L'];

const dvt = ['Gói', 'Chai', 'Lon', 'Hộp', 'Túi', 'Cái', 'Kg', 'Lít', 'Tuýp', 'Bánh', 'Thùng'];

function generateProductName(index) {
  const categoryKeys = Object.keys(categories);
  const category = categoryKeys[index % categoryKeys.length];
  const items = categories[category];
  const item = items[index % items.length];
  const brand = brands[index % brands.length];
  const size = sizes[index % sizes.length];
  
  // Tạo tên sản phẩm đa dạng
  const patterns = [
    `${item} ${brand} ${size}`,
    `${brand} ${item} ${size}`,
    `${item} vị ${brand} ${size}`,
    `${brand} ${item} cao cấp ${size}`,
    `${item} ${brand} loại ${index % 3 + 1} ${size}`,
  ];
  
  return patterns[index % patterns.length];
}

function generateProduct(index) {
  const masp = 'SP' + String(index + 1).padStart(8, '0');
  const tensp = generateProductName(index);
  const unit = dvt[index % dvt.length];
  
  // Giá bán từ 5,000 đến 200,000
  const giaban = Math.floor(Math.random() * 39 + 1) * 5000;
  // Giá nhập = 70-80% giá bán
  const gianhap = Math.floor(giaban * (0.7 + Math.random() * 0.1));
  // Tồn kho từ 10 đến 300
  const slton = Math.floor(Math.random() * 290) + 10;
  // Định mức tồn tối thiểu từ 5 đến 30
  const dmuctonmin = Math.floor(Math.random() * 26) + 5;
  
  return {
    MASP: masp,
    TENSP: tensp,
    DVT: unit,
    GIABAN: giaban,
    GIANHAP: gianhap,
    SL_TON: slton,
    DMUC_TON_MIN: dmuctonmin
  };
}

function addProducts() {
  const db = getDb();
  
  // Kiểm tra số sản phẩm hiện tại
  const current = db.prepare('SELECT COUNT(*) as cnt FROM HANGHOA').get();
  console.log(`Số sản phẩm hiện tại: ${current.cnt}`);
  
  if (current.cnt >= 600) {
    console.log('Đã có đủ 600 sản phẩm rồi!');
    return;
  }
  
  const needed = 600 - current.cnt;
  console.log(`Đang tạo thêm ${needed} sản phẩm...`);
  
  transaction(db, () => {
    const insP = db.prepare(`
      INSERT INTO HANGHOA (MASP, TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Đang bán')
    `);
    
    // Bắt đầu từ số sản phẩm hiện tại
    for (let i = current.cnt; i < 600; i++) {
      const product = generateProduct(i);
      try {
        insP.run(
          product.MASP,
          product.TENSP,
          product.DVT,
          product.GIABAN,
          product.GIANHAP,
          product.SL_TON,
          product.DMUC_TON_MIN
        );
        
        if ((i + 1) % 100 === 0) {
          console.log(`Đã tạo ${i + 1} sản phẩm...`);
        }
      } catch (err) {
        console.error(`Lỗi tạo sản phẩm ${product.MASP}:`, err.message);
      }
    }
  });
  
  const final = db.prepare('SELECT COUNT(*) as cnt FROM HANGHOA').get();
  console.log(`\n✅ Hoàn thành! Tổng số sản phẩm: ${final.cnt}`);
}

// Chạy script
try {
  addProducts();
} catch (err) {
  console.error('Lỗi:', err);
  process.exit(1);
}
