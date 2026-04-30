const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDb, generateMAHDB, transaction } = require('../db/database');

const OWNER_ROLE = 'chu_tiem';
const STATUS_CANCELLED = 'Đã hủy';

// GET /api/hoadonban
router.get('/', auth, (req, res) => {
  const db = getDb();
  const {
    page = 1,
    limit = 15,
    search = '',
    searchInvoice = '',
    searchItem = '',
    trangthai = '',
    pttt = '',
    tungay = '',
    denngay = ''
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = 'WHERE 1=1';
  const params = [];

  const invoiceKeyword = (searchInvoice || '').trim() || (searchItem ? '' : (search || '').trim());
  const itemKeyword = (searchItem || '').trim();

  if (invoiceKeyword) {
    where += ' AND MAHDB LIKE ?';
    params.push(`%${invoiceKeyword}%`);
  }

  if (itemKeyword) {
    where += ` AND (EXISTS (
      SELECT 1
      FROM CT_HOADONBAN ct
      JOIN HANGHOA hh ON hh.MASP = ct.MASP
      WHERE ct.MAHDB = HOADONBAN.MAHDB
      AND (ct.MASP LIKE ? OR hh.TENSP LIKE ?)
    ))`;
    params.push(`%${itemKeyword}%`, `%${itemKeyword}%`);
  }

  if (trangthai) {
    const statuses = trangthai.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      where += ` AND TRANGTHAI_HDB IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }
  }

  if (pttt) {
    const methods = pttt.split(',').map(s => s.trim()).filter(Boolean);
    if (methods.length > 0) {
      where += ` AND PTTT IN (${methods.map(() => '?').join(',')})`;
      params.push(...methods);
    }
  }

  if (tungay) {
    where += ' AND DATE(NGAYBAN) >= ?';
    params.push(tungay);
  }

  if (denngay) {
    where += ' AND DATE(NGAYBAN) <= ?';
    params.push(denngay);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM HOADONBAN ${where}`).get(...params).cnt;
  const items = db.prepare(`
    SELECT * FROM HOADONBAN
    ${where}
    ORDER BY ROWID DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ items, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/hoadonban/:id
router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const hdb = db.prepare(`
    SELECT h.*, t.TENHT AS TEN_NGUOITAO, t.TENDN AS TENDN_NGUOITAO
    FROM HOADONBAN h
    LEFT JOIN TAIKHOAN t ON h.NGUOITAO = t.MATK
    WHERE h.MAHDB = ?
  `).get(req.params.id);

  if (!hdb) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

  const items = db.prepare(`
    SELECT ct.MAHDB, ct.MASP, hh.TENSP, ct.SOLUONG, hh.DVT, hh.GIANHAP, ct.GIABAN,
           (ct.SOLUONG * ct.GIABAN) AS THANHTIEN
    FROM CT_HOADONBAN ct
    JOIN HANGHOA hh ON ct.MASP = hh.MASP
    WHERE ct.MAHDB = ?
  `).all(req.params.id);

  const tongTien = hdb.TONGTIENHANG_BAN || 0;

  res.json({
    ...hdb,
    items,
    maHoaDon: hdb.MAHDB,
    trangThai: hdb.TRANGTHAI_HDB,
    nguoiTao: {
      matk: hdb.NGUOITAO,
      tenht: hdb.TEN_NGUOITAO,
      tendn: hdb.TENDN_NGUOITAO,
    },
    ngayBan: hdb.NGAYBAN,
    tongTien,
    tienKhachCanTra: tongTien,
    tienKhachDaTra: tongTien,
  });
});

// POST /api/hoadonban
router.post('/', auth, (req, res) => {
  try {
    const db = getDb();
    const { items, pttt, ghichu } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ message: 'Hóa đơn phải có ít nhất 1 sản phẩm' });

    // Validate stock
    for (const item of items) {
      const product = db.prepare('SELECT * FROM HANGHOA WHERE MASP = ? AND TRANGTHAI_SP = ?').get(item.MASP, 'Đang bán');
      if (!product) return res.status(400).json({ message: `Sản phẩm ${item.MASP} không tồn tại hoặc đã ngừng bán` });
      if (product.SL_TON < item.SOLUONG) {
        return res.status(400).json({ message: `Sản phẩm "${product.TENSP}" không đủ tồn kho (còn ${product.SL_TON})` });
      }
    }

    const MAHDB = generateMAHDB();
    const total = items.reduce((s, i) => s + i.SOLUONG * i.GIABAN, 0);

    const insertHDB = db.prepare(`
      INSERT INTO HOADONBAN (MAHDB, NGUOITAO, TONGTIENHANG_BAN, NGAYBAN, PTTT, TRANGTHAI_HDB, GHICHU)
      VALUES (?, ?, ?, datetime('now','localtime'), ?, 'Hoàn thành', ?)
    `);
    const insertCT = db.prepare(`INSERT INTO CT_HOADONBAN (MAHDB, MASP, SOLUONG, GIABAN) VALUES (?, ?, ?, ?)`);
    const deductStock = db.prepare(`UPDATE HANGHOA SET SL_TON = SL_TON - ? WHERE MASP = ?`);

    const createInvoice = () => transaction(db, () => {
      insertHDB.run(MAHDB, req.user.matk, total, pttt || 'Tiền mặt', ghichu || null);
      for (const item of items) {
        insertCT.run(MAHDB, item.MASP, item.SOLUONG, item.GIABAN);
        deductStock.run(item.SOLUONG, item.MASP);
      }
    });

    createInvoice();

    const created = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(MAHDB);
    const createdItems = db.prepare(`
      SELECT ct.*, hh.TENSP, hh.DVT FROM CT_HOADONBAN ct JOIN HANGHOA hh ON ct.MASP = hh.MASP WHERE ct.MAHDB = ?
    `).all(MAHDB);

    res.status(201).json({ ...created, items: createdItems });
  } catch (error) {
    console.error('Lỗi tạo hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
});

// PATCH /api/hoadonban/:id/ghichu
router.patch('/:id/ghichu', auth, (req, res) => {
  const db = getDb();
  const hdb = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(req.params.id);
  if (!hdb) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

  db.prepare('UPDATE HOADONBAN SET GHICHU = ? WHERE MAHDB = ?').run(req.body.ghichu || null, req.params.id);
  res.json({ message: 'Đã cập nhật ghi chú' });
});

// PATCH /api/hoadonban/:id/huy
router.patch('/:id/huy', auth, (req, res) => {
  const db = getDb();
  const role = req.user.role || (req.user.tendn === 'admin' ? OWNER_ROLE : 'nhan_vien');

  if (role !== OWNER_ROLE) {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
  }

  const hdb = db.prepare('SELECT * FROM HOADONBAN WHERE MAHDB = ?').get(req.params.id);
  if (!hdb) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });

  if (hdb.TRANGTHAI_HDB === STATUS_CANCELLED) {
    return res.status(400).json({ message: 'Hóa đơn đã hủy, không thể thực hiện thao tác này' });
  }

  const items = db.prepare('SELECT * FROM CT_HOADONBAN WHERE MAHDB = ?').all(req.params.id);
  const restoreStock = db.prepare('UPDATE HANGHOA SET SL_TON = SL_TON + ? WHERE MASP = ?');

  const cancelInvoice = () => transaction(db, () => {
    db.prepare(`UPDATE HOADONBAN SET TRANGTHAI_HDB = ? WHERE MAHDB = ?`).run(STATUS_CANCELLED, req.params.id);
    for (const item of items) {
      restoreStock.run(item.SOLUONG, item.MASP);
    }
  });

  cancelInvoice();
  res.json({ message: 'Đã hủy hóa đơn và hoàn trả tồn kho' });
});

module.exports = router;
