require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedQuick() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Seeding products...');
    
    const products = [
      { MASP:'SP00000001', TENSP:'Bánh mì Staff chà bông 55g',     DVT:'Gói',  GIABAN:20000, GIANHAP:14000, SL_TON:85,  DMUC_TON_MIN:20 },
      { MASP:'SP00000002', TENSP:'Nước Ngọt Coca Cola 330ml',       DVT:'Lon',  GIABAN:12000, GIANHAP:9000,  SL_TON:120, DMUC_TON_MIN:20 },
      { MASP:'SP00000003', TENSP:'Mì Hảo Hảo Tôm Chua Cay',        DVT:'Gói',  GIABAN:5000,  GIANHAP:3500,  SL_TON:200, DMUC_TON_MIN:30 },
      { MASP:'SP00000004', TENSP:'Nước Suối Lavie 500ml',           DVT:'Chai', GIABAN:6000,  GIANHAP:4000,  SL_TON:180, DMUC_TON_MIN:30 },
      { MASP:'SP00000005', TENSP:'Snack Oishi Tôm 40g',             DVT:'Gói',  GIABAN:10000, GIANHAP:7000,  SL_TON:90,  DMUC_TON_MIN:15 },
      { MASP:'SP00000006', TENSP:'Trà Xanh Không Độ 500ml',         DVT:'Chai', GIABAN:10000, GIANHAP:7500,  SL_TON:100, DMUC_TON_MIN:20 },
      { MASP:'SP00000007', TENSP:'Bánh bao Thọ Phát trái đào 240g', DVT:'Cái',  GIABAN:15000, GIANHAP:10000, SL_TON:50,  DMUC_TON_MIN:10 },
      { MASP:'SP00000008', TENSP:'Dầu Ăn Neptune 1L',               DVT:'Chai', GIABAN:45000, GIANHAP:38000, SL_TON:30,  DMUC_TON_MIN:5  },
      { MASP:'SP00000009', TENSP:'Nước Mắm Phú Quốc 500ml',         DVT:'Chai', GIABAN:35000, GIANHAP:28000, SL_TON:25,  DMUC_TON_MIN:5  },
      { MASP:'SP00000010', TENSP:'Kẹo Dừa Bến Tre 200g',            DVT:'Gói',  GIABAN:15000, GIANHAP:10000, SL_TON:60,  DMUC_TON_MIN:10 },
      { MASP:'SP00000011', TENSP:'Bánh Oreo Vị Vani 137g',          DVT:'Gói',  GIABAN:25000, GIANHAP:18000, SL_TON:45,  DMUC_TON_MIN:5  },
      { MASP:'SP00000012', TENSP:'Sữa đặc Ông Thọ lon 380g',        DVT:'Lon',  GIABAN:22000, GIANHAP:16000, SL_TON:70,  DMUC_TON_MIN:10 },
      { MASP:'SP00000013', TENSP:'Nước tương Maggi 700ml',           DVT:'Chai', GIABAN:28000, GIANHAP:21000, SL_TON:40,  DMUC_TON_MIN:8  },
      { MASP:'SP00000014', TENSP:'Kẹo dẻo vị dâu 300g',             DVT:'Gói',  GIABAN:18000, GIANHAP:13000, SL_TON:35,  DMUC_TON_MIN:5  },
      { MASP:'SP00000015', TENSP:'Bột giặt Omo 800g',               DVT:'Túi',  GIABAN:55000, GIANHAP:44000, SL_TON:20,  DMUC_TON_MIN:5  },
      { MASP:'SP00000016', TENSP:'Kem đánh răng bạc hà 150g',       DVT:'Tuýp', GIABAN:45000, GIANHAP:35000, SL_TON:30,  DMUC_TON_MIN:5  },
      { MASP:'SP00000017', TENSP:'Xà phòng Lifebuoy 90g',           DVT:'Bánh', GIABAN:18000, GIANHAP:13000, SL_TON:55,  DMUC_TON_MIN:10 },
      { MASP:'SP00000018', TENSP:'Dầu gội Clear 170ml',             DVT:'Chai', GIABAN:38000, GIANHAP:29000, SL_TON:25,  DMUC_TON_MIN:5  },
      { MASP:'SP00000019', TENSP:'Nước rửa chén Sunlight 400g',     DVT:'Chai', GIABAN:22000, GIANHAP:16000, SL_TON:40,  DMUC_TON_MIN:8  },
      { MASP:'SP00000020', TENSP:'Sữa lúa mạnh Milo 180ml',         DVT:'Hộp',  GIABAN:32000, GIANHAP:24000, SL_TON:60,  DMUC_TON_MIN:10 },
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO HANGHOA (MASP, TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Đang bán')
         ON CONFLICT (MASP) DO NOTHING`,
        [p.MASP, p.TENSP, p.DVT, p.GIABAN, p.GIANHAP, p.SL_TON, p.DMUC_TON_MIN]
      );
    }
    
    console.log('✅ Seeded 20 products');
    
    console.log('🔄 Seeding invoices (100 invoices for testing)...');
    
    const adminId = 'TK00000001';
    const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const pick = (arr) => arr[ri(0, arr.length - 1)];
    const spList = products.map(p => ({ MASP: p.MASP, GIABAN: p.GIABAN }));
    const ptttList = ['Tiền mặt','Tiền mặt','Tiền mặt','Chuyển khoản'];
    const statusList = ['Hoàn thành','Hoàn thành','Hoàn thành','Hoàn thành','Đã hủy'];

    let hdbNum = 1;
    
    // Chỉ tạo 100 invoices cho nhanh (thay vì 3000+)
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-24');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const numInvoices = ri(3, 6); // 3-6 invoices per day

      for (let k = 0; k < numInvoices; k++) {
        const mahdb = 'HDB' + String(hdbNum).padStart(7, '0');
        hdbNum++;
        const hour = ri(7, 21);
        const min = ri(0, 59).toString().padStart(2, '0');
        const dateTime = `${dateStr} ${hour}:${min}:00`;
        const pttt = pick(ptttList);
        const status = pick(statusList);
        const numItems = ri(1, 5);
        const items = [];
        const used = new Set();
        
        for (let j = 0; j < numItems; j++) {
          let sp;
          do { sp = pick(spList); } while (used.has(sp.MASP));
          used.add(sp.MASP);
          items.push({ MASP: sp.MASP, SL: ri(1, 10), G: sp.GIABAN });
        }
        
        const total = items.reduce((s, i) => s + i.SL * i.G, 0);
        
        await client.query(
          `INSERT INTO HOADONBAN (MAHDB, NGUOITAO, TONGTIENHANG_BAN, NGAYBAN, PTTT, TRANGTHAI_HDB, GHICHU) 
           VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
          [mahdb, adminId, total, dateTime, pttt, status]
        );
        
        for (const it of items) {
          await client.query(
            `INSERT INTO CT_HOADONBAN (MAHDB, MASP, SOLUONG, GIABAN) VALUES ($1, $2, $3, $4)`,
            [mahdb, it.MASP, it.SL, it.G]
          );
        }
      }
    }

    console.log(`✅ Seeded ${hdbNum - 1} invoices`);
    
    await client.query('COMMIT');
    console.log('✅ Seeding complete!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedQuick().then(() => {
  console.log('✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed:', error);
  process.exit(1);
});
