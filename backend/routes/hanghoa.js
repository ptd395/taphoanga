const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDb, generateMASP } = require('../db/database');
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

// GET /api/hanghoa
router.get('/', auth, (req, res) => {
  const db = getDb();
  const { page = 1, limit = 15, search = '', trangthai = '', tonkho = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (TENSP LIKE ? OR MASP LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (trangthai) {
    const statuses = trangthai.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      where += ` AND TRANGTHAI_SP IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
  }
  if (tonkho === 'thap') {
    where += ' AND SL_TON <= DMUC_TON_MIN AND SL_TON > 0';
  } else if (tonkho === 'het') {
    where += ' AND SL_TON = 0';
  } else if (tonkho === 'du') {
    where += ' AND SL_TON > DMUC_TON_MIN';
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM HANGHOA ${where}`).get(...params).cnt;
  const items = db.prepare(`SELECT * FROM HANGHOA ${where} ORDER BY MASP LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({ items, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/hanghoa/:masp
router.get('/:masp', auth, (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ?').get(req.params.masp);
  if (!item) return res.status(404).json({ message: 'Không tìm thấy hàng hóa' });
  res.json(item);
});

// POST /api/hanghoa
router.post('/', auth, upload.single('hinhanh'), (req, res) => {
  const db = getDb();
  let { TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP } = req.body;
  
  if (!TENSP) return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
  
  // Rule 1: Tên hàng hóa không được trùng với hàng đang còn hiệu lực
  const existingActive = db.prepare(`SELECT MASP FROM HANGHOA WHERE LOWER(TENSP) = LOWER(?) AND TRANGTHAI_SP = 'Đang bán'`).get(TENSP);
  if (existingActive) return res.status(400).json({ message: 'Hàng hóa đã tồn tại' });

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

  const MASP = generateMASP();
  const HINHANH = req.file ? `/uploads/${req.file.filename}` : null;

  db.prepare(`
    INSERT INTO HANGHOA (MASP, TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP, HINHANH)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(MASP, TENSP, DVT || 'Cái', GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP || 'Đang bán', HINHANH);

  const created = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ?').get(MASP);
  res.status(201).json(created);
});

// PUT /api/hanghoa/:masp
router.put('/:masp', auth, upload.single('hinhanh'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ?').get(req.params.masp);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy hàng hóa' });

  const { TENSP, DVT, GIABAN, GIANHAP, SL_TON, DMUC_TON_MIN, TRANGTHAI_SP } = req.body;
  const HINHANH = req.file ? `/uploads/${req.file.filename}` : existing.HINHANH;

  db.prepare(`
    UPDATE HANGHOA SET TENSP=?, DVT=?, GIABAN=?, GIANHAP=?, SL_TON=?, DMUC_TON_MIN=?, TRANGTHAI_SP=?, HINHANH=?
    WHERE MASP=?
  `).run(
    TENSP || existing.TENSP,
    DVT || existing.DVT,
    parseFloat(GIABAN) ?? existing.GIABAN,
    parseFloat(GIANHAP) ?? existing.GIANHAP,
    parseInt(SL_TON) ?? existing.SL_TON,
    parseInt(DMUC_TON_MIN) ?? existing.DMUC_TON_MIN,
    TRANGTHAI_SP || existing.TRANGTHAI_SP,
    HINHANH,
    req.params.masp
  );

  const updated = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ?').get(req.params.masp);
  res.json(updated);
});

// DELETE /api/hanghoa/:masp (soft delete)
router.delete('/:masp', auth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ?').get(req.params.masp);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy hàng hóa phù hợp' });

  db.prepare(`UPDATE HANGHOA SET TRANGTHAI_SP = 'Ngừng kinh doanh', SL_TON = 0 WHERE MASP = ?`).run(req.params.masp);
  res.json({ message: 'Xóa thành công' });
});

// GET /api/hanghoa/:masp/tonkho
router.get('/:masp/tonkho', auth, (req, res) => {
  const db = getDb();
  const history = db.prepare(`
    SELECT ct.MAHDB, ct.SOLUONG, ct.GIABAN, h.NGAYBAN, h.TRANGTHAI_HDB, h.PTTT
    FROM CT_HOADONBAN ct
    JOIN HOADONBAN h ON ct.MAHDB = h.MAHDB
    WHERE ct.MASP = ?
    ORDER BY h.NGAYBAN DESC
    LIMIT 50
  `).all(req.params.masp);
  res.json(history);
});

module.exports = router;
