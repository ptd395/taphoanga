const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { getPool } = require('../db/database-pg');

// GET /api/taikhoan/me
router.get('/me', auth, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT matk, tendn, sdt, tenht FROM taikhoan WHERE matk = $1', [req.user.matk]);
    const user = result.rows[0];
    
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// PUT /api/taikhoan/me
router.put('/me', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { tenht, sdt } = req.body;
    
    await pool.query('UPDATE taikhoan SET tenht = $1, sdt = $2 WHERE matk = $3', [tenht, sdt, req.user.matk]);
    
    const result = await pool.query('SELECT matk, tendn, sdt, tenht FROM taikhoan WHERE matk = $1', [req.user.matk]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
});

// PUT /api/taikhoan/me/password
router.put('/me/password', auth, async (req, res) => {
  try {
    const pool = getPool();
    const { matkhau_cu, matkhau_moi, xacnhan } = req.body;

    if (!matkhau_cu || !matkhau_moi || !xacnhan)
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

    // 1. Kiểm tra mật khẩu cũ
    const result = await pool.query('SELECT * FROM taikhoan WHERE matk = $1', [req.user.matk]);
    const user = result.rows[0];
    
    const valid = bcrypt.compareSync(matkhau_cu, user.matkhau);
    if (!valid) return res.status(400).json({ field: 'matkhau_cu', message: 'Mật khẩu cũ không đúng. Vui lòng kiểm tra lại.' });

    // 2. Kiểm tra xác nhận khớp
    if (matkhau_moi !== xacnhan)
      return res.status(400).json({ field: 'xacnhan', message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });

    // 3. Kiểm tra độ mạnh
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/;
    if (!pwRegex.test(matkhau_moi))
      return res.status(400).json({ field: 'matkhau_moi', message: 'Mật khẩu cần chứa 8-32 ký tự, bao gồm chữ hoa, chữ thường và số' });

    // 4. Kiểm tra trùng mật khẩu cũ
    const isSame = bcrypt.compareSync(matkhau_moi, user.matkhau);
    if (isSame) return res.status(400).json({ field: 'matkhau_moi', message: 'Mật khẩu mới không được trùng với mật khẩu cũ hiện tại.' });

    const hashed = bcrypt.hashSync(matkhau_moi, 10);
    await pool.query('UPDATE taikhoan SET matkhau = $1 WHERE matk = $2', [hashed, req.user.matk]);
    
    res.json({ message: 'Thay đổi mật khẩu thành công.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra, không thể đổi mật khẩu. Vui lòng thử lại.' });
  }
});

module.exports = router;
