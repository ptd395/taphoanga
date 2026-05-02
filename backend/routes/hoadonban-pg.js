const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPool, toUppercaseKeys } = require('../db/database-pg');

// Helper function to generate MAHDB
async function generateMAHDB() {
  const pool = getPool();
  const result = await pool.query(`SELECT mahdb FROM hoadonban ORDER BY mahdb DESC LIMIT 1`);
  if (result.rows.length === 0) return 'HDB00000001';
  
  const lastMAHDB = result.rows[0].mahdb;
  const num = parseInt(lastMAHDB.substring(3)) + 1;
  return 'HDB' + num.toString().padStart(8, '0');
}

// GET /api/hoadonban
router.get('/', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { page = 1, limit = 15, search = '', trangthai = '', pttt = '', tungay = '', denngay = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      where += ` AND mahdb LIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (trangthai) {
      const statuses = trangthai.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        const placeholders = statuses.map((_, i) => `$${paramIndex + i}`).join(',');
        where += ` AND trangthai_hdb IN (${placeholders})`;
        params.push(...statuses);
        paramIndex += statuses.length;
      }
    }
    if (pttt) {
      const methods = pttt.split(',').map(s => s.trim()).filter(Boolean);
      if (methods.length > 0) {
        const placeholders = methods.map((_, i) => `$${paramIndex + i}`).join(',');
        where += ` AND pttt IN (${placeholders})`;
        params.push(...methods);
        paramIndex += methods.length;
      }
    }
    if (tungay) {
      where += ` AND DATE(ngayban) >= $${paramIndex}`;
      params.push(tungay);
      paramIndex++;
    }
    if (denngay) {
      where += ` AND DATE(ngayban) <= $${paramIndex}`;
      params.push(denngay);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM hoadonban ${where}`, params);
    const total = parseInt(countResult.rows[0].cnt);

    const itemsResult = await pool.query(
      `SELECT hdb.*, 
              (SELECT string_agg(masp, ', ') FROM ct_hoadonban WHERE mahdb = hdb.mahdb) as mahang_list
       FROM hoadonban hdb ${where} ORDER BY ngayban DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({ 
      items: toUppercaseKeys(itemsResult.rows), 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit), 
      totalPages: Math.ceil(total / parseInt(limit)) 
    });
  } catch (error) {
    console.error('Get hoadonban error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/hoadonban/:mahdb
router.get('/:mahdb', auth, async (req, res) => {
  try {
    const pool = getPool();
    const hdbResult = await pool.query('SELECT * FROM hoadonban WHERE mahdb = $1', [req.params.mahdb]);
    if (hdbResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

    const itemsResult = await pool.query(`
      SELECT ct.*, hh.tensp, hh.dvt
      FROM ct_hoadonban ct
      JOIN hanghoa hh ON ct.masp = hh.masp
      WHERE ct.mahdb = $1
    `, [req.params.mahdb]);

    res.json({ ...toUppercaseKeys(hdbResult.rows[0]), items: toUppercaseKeys(itemsResult.rows) });
  } catch (error) {
    console.error('Get hoadonban by ID error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// POST /api/hoadonban
router.post('/', auth, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const { items, pttt, ghichu } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ message: 'Hóa đơn phải có ít nhất 1 sản phẩm' });

    // Start transaction
    await client.query('BEGIN');

    // Validate stock
    for (const item of items) {
      const productResult = await client.query(
        'SELECT * FROM hanghoa WHERE masp = $1 AND trangthai_sp = $2',
        [item.MASP, 'Đang bán']
      );
      const product = productResult.rows[0];
      
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Sản phẩm ${item.MASP} không tồn tại hoặc đã ngừng bán` });
      }
      if (product.sl_ton < item.SOLUONG) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Sản phẩm "${product.tensp}" không đủ tồn kho (còn ${product.sl_ton})` });
      }
    }

    const MAHDB = await generateMAHDB();
    const total = items.reduce((s, i) => s + i.SOLUONG * i.GIABAN, 0);
    const NGAYBAN = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Insert invoice
    await client.query(`
      INSERT INTO hoadonban (mahdb, nguoitao, tongtienhang_ban, ngayban, pttt, trangthai_hdb, ghichu)
      VALUES ($1, $2, $3, $4, $5, 'Hoàn thành', $6)
    `, [MAHDB, req.user.matk, total, NGAYBAN, pttt || 'Tiền mặt', ghichu || null]);

    // Insert invoice items and deduct stock
    for (const item of items) {
      await client.query(
        `INSERT INTO ct_hoadonban (mahdb, masp, soluong, giaban) VALUES ($1, $2, $3, $4)`,
        [MAHDB, item.MASP, item.SOLUONG, item.GIABAN]
      );
      await client.query(
        `UPDATE hanghoa SET sl_ton = sl_ton - $1 WHERE masp = $2`,
        [item.SOLUONG, item.MASP]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // Fetch created invoice
    const createdResult = await client.query('SELECT * FROM hoadonban WHERE mahdb = $1', [MAHDB]);
    const createdItemsResult = await client.query(`
      SELECT ct.*, hh.tensp, hh.dvt 
      FROM ct_hoadonban ct 
      JOIN hanghoa hh ON ct.masp = hh.masp 
      WHERE ct.mahdb = $1
    `, [MAHDB]);

    res.status(201).json({ ...toUppercaseKeys(createdResult.rows[0]), items: toUppercaseKeys(createdItemsResult.rows) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create hoadonban error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/hoadonban/:mahdb/ghichu
router.put('/:mahdb/ghichu', auth, async (req, res) => {
  try {
    const pool = getPool();
    const hdbResult = await pool.query('SELECT * FROM hoadonban WHERE mahdb = $1', [req.params.mahdb]);
    if (hdbResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

    await pool.query('UPDATE hoadonban SET ghichu = $1 WHERE mahdb = $2', [req.body.ghichu || null, req.params.mahdb]);
    res.json({ message: 'Đã cập nhật ghi chú' });
  } catch (error) {
    console.error('Update ghichu error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// PUT /api/hoadonban/:mahdb/huy
router.put('/:mahdb/huy', auth, async (req, res) => {
  const client = await getPool().connect();
  
  try {
    const hdbResult = await client.query('SELECT * FROM hoadonban WHERE mahdb = $1', [req.params.mahdb]);
    if (hdbResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    }
    
    const hdb = hdbResult.rows[0];
    if (hdb.trangthai_hdb === 'Đã hủy') {
      client.release();
      return res.status(400).json({ message: 'Hóa đơn đã được hủy trước đó' });
    }

    // Start transaction
    await client.query('BEGIN');

    // Get invoice items
    const itemsResult = await client.query('SELECT * FROM ct_hoadonban WHERE mahdb = $1', [req.params.mahdb]);

    // Update invoice status
    await client.query(`UPDATE hoadonban SET trangthai_hdb = 'Đã hủy' WHERE mahdb = $1`, [req.params.mahdb]);

    // Restore stock
    for (const item of itemsResult.rows) {
      await client.query('UPDATE hanghoa SET sl_ton = sl_ton + $1 WHERE masp = $2', [item.soluong, item.masp]);
    }

    // Commit transaction
    await client.query('COMMIT');

    res.json({ message: 'Đã hủy hóa đơn và hoàn trả tồn kho' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel hoadonban error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
