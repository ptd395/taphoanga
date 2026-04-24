const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPool } = require('../db/database-pg');

// GET /api/baocao/doanhthu?tungay=&denngay=
router.get('/doanhthu', auth, async (req, res) => {
  try {
    const pool = getPool();
    let { tungay, denngay, loai = 'ngay' } = req.query;

    if (!tungay) {
      const now = new Date();
      tungay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      denngay = now.toISOString().split('T')[0];
    }
    if (!denngay) denngay = tungay;

    const result = await pool.query(`
      SELECT
        DATE(ngayban) as thoigian,
        SUM(CASE WHEN trangthai_hdb = 'Hoàn thành' THEN tongtienhang_ban ELSE 0 END) as doanhthu,
        SUM(CASE WHEN trangthai_hdb = 'Đã hủy' THEN tongtienhang_ban ELSE 0 END) as giatri_tra,
        COUNT(CASE WHEN trangthai_hdb = 'Hoàn thành' THEN 1 END) as so_don
      FROM hoadonban
      WHERE DATE(ngayban) BETWEEN $1 AND $2
      GROUP BY DATE(ngayban)
      ORDER BY thoigian ASC
    `, [tungay, denngay]);

    const rows = result.rows.map(r => ({
      ...r,
      doanhthu: parseFloat(r.doanhthu) || 0,
      giatri_tra: parseFloat(r.giatri_tra) || 0,
      so_don: parseInt(r.so_don) || 0,
      doanhthu_thuan: (parseFloat(r.doanhthu) || 0) - (parseFloat(r.giatri_tra) || 0)
    }));

    const totals = {
      doanhthu: rows.reduce((s, r) => s + r.doanhthu, 0),
      giatri_tra: rows.reduce((s, r) => s + r.giatri_tra, 0),
      doanhthu_thuan: rows.reduce((s, r) => s + r.doanhthu_thuan, 0),
      so_don: rows.reduce((s, r) => s + r.so_don, 0),
    };

    res.json({ rows, totals, tungay, denngay });
  } catch (error) {
    console.error('Báo cáo doanh thu error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/baocao/hanghoa?tungay=&denngay=&search=
router.get('/hanghoa', auth, async (req, res) => {
  try {
    const pool = getPool();
    let { tungay, denngay, search = '' } = req.query;

    if (!tungay) {
      const now = new Date();
      tungay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      denngay = now.toISOString().split('T')[0];
    }
    if (!denngay) denngay = tungay;

    const searchParam = `%${search}%`;

    const result = await pool.query(`
      SELECT
        ct.masp,
        hh.tensp,
        hh.dvt,
        SUM(CASE WHEN h.trangthai_hdb = 'Hoàn thành' THEN ct.soluong ELSE 0 END) as sl_ban,
        SUM(CASE WHEN h.trangthai_hdb = 'Hoàn thành' THEN ct.soluong * ct.giaban ELSE 0 END) as doanhthu,
        SUM(CASE WHEN h.trangthai_hdb = 'Đã hủy' THEN ct.soluong ELSE 0 END) as sl_tra,
        SUM(CASE WHEN h.trangthai_hdb = 'Đã hủy' THEN ct.soluong * ct.giaban ELSE 0 END) as giatri_tra,
        SUM(CASE WHEN h.trangthai_hdb = 'Hoàn thành' THEN ct.soluong * ct.giaban ELSE 0 END)
          - SUM(CASE WHEN h.trangthai_hdb = 'Đã hủy' THEN ct.soluong * ct.giaban ELSE 0 END) as doanhthu_thuan
      FROM ct_hoadonban ct
      JOIN hanghoa hh ON ct.masp = hh.masp
      JOIN hoadonban h ON ct.mahdb = h.mahdb
      WHERE DATE(h.ngayban) BETWEEN $1 AND $2
        AND (hh.tensp ILIKE $3 OR hh.masp ILIKE $4)
      GROUP BY ct.masp, hh.tensp, hh.dvt
      ORDER BY doanhthu DESC
    `, [tungay, denngay, searchParam, searchParam]);

    const rows = result.rows.map(r => ({
      ...r,
      sl_ban: parseInt(r.sl_ban) || 0,
      doanhthu: parseFloat(r.doanhthu) || 0,
      sl_tra: parseInt(r.sl_tra) || 0,
      giatri_tra: parseFloat(r.giatri_tra) || 0,
      doanhthu_thuan: parseFloat(r.doanhthu_thuan) || 0
    }));

    const totals = {
      sl_ban: rows.reduce((s, r) => s + r.sl_ban, 0),
      doanhthu: rows.reduce((s, r) => s + r.doanhthu, 0),
      sl_tra: rows.reduce((s, r) => s + r.sl_tra, 0),
      giatri_tra: rows.reduce((s, r) => s + r.giatri_tra, 0),
      doanhthu_thuan: rows.reduce((s, r) => s + r.doanhthu_thuan, 0),
      sl_mat_hang: rows.length,
    };

    res.json({ rows, totals, tungay, denngay });
  } catch (error) {
    console.error('Báo cáo hàng hóa error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/baocao/doanhthu/detail?ngay=2025-11-14
router.get('/doanhthu/detail', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { ngay } = req.query;
    if (!ngay) return res.json({ rows: [] });
    
    const result = await pool.query(`
      SELECT mahdb, tongtienhang_ban as doanhthu, trangthai_hdb
      FROM hoadonban
      WHERE DATE(ngayban) = $1
      ORDER BY ngayban ASC
    `, [ngay]);
    
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Báo cáo doanh thu detail error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/baocao/hanghoa/detail?masp=SP00000001&tungay=&denngay=
router.get('/hanghoa/detail', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { masp, tungay, denngay } = req.query;
    if (!masp) return res.json({ rows: [] });
    
    const result = await pool.query(`
      SELECT ct.mahdb, ct.soluong, ct.soluong * ct.giaban as doanhthu, h.trangthai_hdb
      FROM ct_hoadonban ct
      JOIN hoadonban h ON ct.mahdb = h.mahdb
      WHERE ct.masp = $1
        AND DATE(h.ngayban) BETWEEN $2 AND $3
      ORDER BY h.ngayban ASC
    `, [masp, tungay || '2000-01-01', denngay || '2099-12-31']);
    
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Báo cáo hàng hóa detail error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

module.exports = router;
