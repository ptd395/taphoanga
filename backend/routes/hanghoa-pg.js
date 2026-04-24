const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPool } = require('../db/database-pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper function to generate MASP
async function generateMASP() {
  const pool = getPool();
  const result = await pool.query(`SELECT masp FROM hanghoa ORDER BY masp DESC LIMIT 1`);
  if (result.rows.length === 0) return 'SP00000001';
  
  const lastMASP = result.rows[0].masp;
  const num = parseInt(lastMASP.substring(2)) + 1;
  return 'SP' + num.toString().padStart(8, '0');
}

// GET /api/hanghoa
router.get('/', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { page = 1, limit = 15, search = '', trangthai = '', tonkho = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      where += ` AND (LOWER(tensp) LIKE LOWER($${paramIndex}) OR LOWER(masp) LIKE LOWER($${paramIndex + 1}))`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }
    if (trangthai) {
      const statuses = trangthai.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        const placeholders = statuses.map((_, i) => `$${paramIndex + i}`).join(',');
        where += ` AND trangthai_sp IN (${placeholders})`;
        params.push(...statuses);
        paramIndex += statuses.length;
      }
    }
    if (tonkho === 'thap') {
      where += ' AND sl_ton <= dmuc_ton_min AND sl_ton > 0';
    } else if (tonkho === 'het') {
      where += ' AND sl_ton = 0';
    } else if (tonkho === 'du') {
      where += ' AND sl_ton > dmuc_ton_min';
    }

    const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM hanghoa ${where}`, params);
    const total = parseInt(countResult.rows[0].cnt);

    const itemsResult = await pool.query(
      `SELECT * FROM hanghoa ${where} ORDER BY ngaytao DESC, masp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({ 
      items: itemsResult.rows, 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit), 
      totalPages: Math.ceil(total / parseInt(limit)) 
    });
  } catch (error) {
    console.error('Get hanghoa error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/hanghoa/:masp
router.get('/:masp', auth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM hanghoa WHERE masp = $1', [req.params.masp]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hàng hóa' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get hanghoa by ID error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// POST /api/hanghoa
router.post('/', auth, upload.single('hinhanh'), async (req, res) => {
  try {
    const pool = getPool();
    let { TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP } = req.body;
    
    if (!TENSP) return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
    
    // Rule 1: Tên hàng hóa không được trùng với hàng đang còn hiệu lực
    const existingResult = await pool.query(
      `SELECT masp FROM hanghoa WHERE LOWER(tensp) = LOWER($1) AND trangthai_sp = 'Đang bán'`,
      [TENSP]
    );
    if (existingResult.rows.length > 0) return res.status(400).json({ message: 'Hàng hóa đã tồn tại' });

    // Parse numbers
    GIANHAP = parseFloat(GIANHAP) || 0;
    SL_TON = parseInt(SL_TON) || 0;
    DMUC_TON_MIN = parseInt(DMUC_TON_MIN) || 0;

    // Rule 2, 3, 4: Validate inputs
    if (GIANHAP <= 0) return res.status(400).json({ message: 'Giá vốn phải là số dương' });
    if (SL_TON < 0) return res.status(400).json({ message: 'Tồn kho phải là số không âm' });
    if (DMUC_TON_MIN < 0) return res.status(400).json({ message: 'Định mức tồn kho tối thiểu phải là số không âm' });

    // Rule 5: Tự động tính giá bán = giá vốn * 1.3
    GIABAN = GIANHAP * 1.3;

    const MASP = await generateMASP();
    const HINHANH = req.file ? `/uploads/${req.file.filename}` : null;

    await pool.query(`
      INSERT INTO hanghoa (masp, tensp, dvt, giaban, gianhap, sl_ton, dmuc_ton_min, trangthai_sp, hinhanh)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [MASP, TENSP, DVT || 'Cái', GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP || 'Đang bán', HINHANH]);

    const createdResult = await pool.query('SELECT * FROM hanghoa WHERE masp = $1', [MASP]);
    res.status(201).json(createdResult.rows[0]);
  } catch (error) {
    console.error('Create hanghoa error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// PUT /api/hanghoa/:masp
router.put('/:masp', auth, upload.single('hinhanh'), async (req, res) => {
  try {
    const pool = getPool();
    const existingResult = await pool.query('SELECT * FROM hanghoa WHERE masp = $1', [req.params.masp]);
    if (existingResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hàng hóa' });
    
    const existing = existingResult.rows[0];
    let { TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP } = req.body;

    // Rule 5.1: Kiểm tra trùng tên (trừ sản phẩm hiện tại)
    if (TENSP && TENSP.toLowerCase() !== existing.tensp.toLowerCase()) {
      const duplicateResult = await pool.query(
        `SELECT masp FROM hanghoa WHERE LOWER(tensp) = LOWER($1) AND masp <> $2 AND trangthai_sp = 'Đang bán'`,
        [TENSP, req.params.masp]
      );
      if (duplicateResult.rows.length > 0) return res.status(400).json({ message: 'Hàng hóa đã tồn tại' });
    }

    // Parse and validate numbers
    const newGianhap = GIANHAP !== undefined ? parseFloat(GIANHAP) : existing.gianhap;
    if (newGianhap <= 0) return res.status(400).json({ message: 'Giá vốn phải là số dương' });
    
    const newSlTon = SL_TON !== undefined ? parseInt(SL_TON) : existing.sl_ton;
    if (newSlTon < 0) return res.status(400).json({ message: 'Tồn kho phải là số không âm' });

    const newDmuc = DMUC_TON_MIN !== undefined ? parseInt(DMUC_TON_MIN) : existing.dmuc_ton_min;
    if (newDmuc < 0) return res.status(400).json({ message: 'Định mức tồn kho tối thiểu phải là số không âm' });

    // Rule 5.3: Tính lại giá bán
    const newGiaban = newGianhap * 1.3;

    const HINHANH = req.file ? `/uploads/${req.file.filename}` : existing.hinhanh;

    await pool.query(`
      UPDATE hanghoa SET tensp=$1, dvt=$2, giaban=$3, gianhap=$4, sl_ton=$5, dmuc_ton_min=$6, trangthai_sp=$7, hinhanh=$8
      WHERE masp=$9
    `, [
      TENSP || existing.tensp,
      DVT || existing.dvt,
      newGiaban,
      newGianhap,
      newSlTon,
      newDmuc,
      TRANGTHAI_SP || existing.trangthai_sp,
      HINHANH,
      req.params.masp
    ]);

    const updatedResult = await pool.query('SELECT * FROM hanghoa WHERE masp = $1', [req.params.masp]);
    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Update hanghoa error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// DELETE /api/hanghoa/:masp (soft delete)
router.delete('/:masp', auth, async (req, res) => {
  try {
    const pool = getPool();
    const existingResult = await pool.query('SELECT * FROM hanghoa WHERE masp = $1', [req.params.masp]);
    if (existingResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hàng hóa phù hợp' });

    await pool.query(`UPDATE hanghoa SET trangthai_sp = 'Ngừng kinh doanh', sl_ton = 0 WHERE masp = $1`, [req.params.masp]);
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete hanghoa error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/hanghoa/:masp/tonkho
router.get('/:masp/tonkho', auth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT ct.mahdb, ct.soluong, ct.giaban, h.ngayban, h.trangthai_hdb, h.pttt
      FROM ct_hoadonban ct
      JOIN hoadonban h ON ct.mahdb = h.mahdb
      WHERE ct.masp = $1
      ORDER BY h.ngayban DESC
      LIMIT 50
    `, [req.params.masp]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tonkho error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

module.exports = router;
