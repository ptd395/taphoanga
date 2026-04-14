const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

// GET /api/taikhoan/me
router.get('/me', auth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT MATK, TENDN, SDT, TENHT FROM TAIKHOAN WHERE MATK = ?').get(req.user.matk);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
  res.json(user);
});

// PUT /api/taikhoan/me
router.put('/me', auth, (req, res) => {
  const db = getDb();
  const { tenht, sdt } = req.body;
  db.prepare('UPDATE TAIKHOAN SET TENHT = ?, SDT = ? WHERE MATK = ?').run(tenht, sdt, req.user.matk);
  const updated = db.prepare('SELECT MATK, TENDN, SDT, TENHT FROM TAIKHOAN WHERE MATK = ?').get(req.user.matk);
  res.json(updated);
});

// PUT /api/taikhoan/me/password
router.put('/me/password', auth, (req, res) => {
  const db = getDb();
  const { matkhau_cu, matkhau_moi, xacnhan } = req.body;

  if (!matkhau_cu || !matkhau_moi || !xacnhan)
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

  // 1. Kiểm tra mật khẩu cũ
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE MATK = ?').get(req.user.matk);
  const valid = bcrypt.compareSync(matkhau_cu, user.MATKHAU);
  if (!valid) return res.status(400).json({ field: 'matkhau_cu', message: 'Mật khẩu cũ không đúng. Vui lòng kiểm tra lại.' });

  // 2. Kiểm tra xác nhận khớp
  if (matkhau_moi !== xacnhan)
    return res.status(400).json({ field: 'xacnhan', message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });

  // 3. Kiểm tra độ mạnh
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/;
  if (!pwRegex.test(matkhau_moi))
    return res.status(400).json({ field: 'matkhau_moi', message: 'Mật khẩu cần chứa 8-32 ký tự, bao gồm chữ hoa, chữ thường và số' });

  // 4. Kiểm tra trùng mật khẩu cũ
  const isSame = bcrypt.compareSync(matkhau_moi, user.MATKHAU);
  if (isSame) return res.status(400).json({ field: 'matkhau_moi', message: 'Mật khẩu mới không được trùng với mật khẩu cũ hiện tại.' });

  try {
    const hashed = bcrypt.hashSync(matkhau_moi, 10);
    db.prepare('UPDATE TAIKHOAN SET MATKHAU = ? WHERE MATK = ?').run(hashed, req.user.matk);
    res.json({ message: 'Thay đổi mật khẩu thành công.' });
  } catch (e) {
    res.status(500).json({ message: 'Có lỗi xảy ra, không thể đổi mật khẩu. Vui lòng thử lại.' });
  }
});

module.exports = router;
