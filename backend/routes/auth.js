const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taphoanga_secret_2024';

// Simulate OTP store (in-memory for demo)
const otpStore = {};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { tendn, matkhau } = req.body;
  if (!tendn || !matkhau) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE TENDN = ?').get(tendn);
  if (!user) return res.status(401).json({ message: 'Tên đăng nhập không tồn tại' });

  const valid = bcrypt.compareSync(matkhau, user.MATKHAU);
  if (!valid) return res.status(401).json({ message: 'Mật khẩu không đúng' });

  const token = jwt.sign(
    { matk: user.MATK, tendn: user.TENDN, tenht: user.TENHT },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { matk: user.MATK, tendn: user.TENDN, tenht: user.TENHT, sdt: user.SDT }
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { sdt } = req.body;
  if (!sdt) return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE SDT = ?').get(sdt);
  if (!user) return res.status(404).json({ message: 'Số điện thoại không tồn tại trong hệ thống' });

  // Generate mock OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[sdt] = { otp, matk: user.MATK, expires: Date.now() + 5 * 60 * 1000 };

  // In production, send SMS. For demo, return OTP in response.
  res.json({ message: 'Mã OTP đã được gửi', otp_demo: otp });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { sdt, otp } = req.body;
  if (!sdt || !otp) return res.status(400).json({ message: 'Thiếu thông tin xác thực' });

  const record = otpStore[sdt];
  if (!record) return res.status(400).json({ message: 'OTP không tồn tại, vui lòng thử lại' });
  if (Date.now() > record.expires) {
    delete otpStore[sdt];
    return res.status(400).json({ message: 'OTP đã hết hạn' });
  }
  if (record.otp !== otp) return res.status(400).json({ message: 'OTP không đúng' });

  // Lấy mật khẩu gốc (demo: trả về plaintext lưu trong store)
  delete otpStore[sdt];
  // Demo: gửi SMS chứa mật khẩu - ở đây chỉ trả về thông báo thành công
  res.json({ message: 'Mật khẩu đã được gửi đến số điện thoại của bạn. Vui lòng kiểm tra và đăng nhập lại.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { sdt, matkhau_moi, xacnhan } = req.body;
  if (!sdt || !matkhau_moi || !xacnhan) return res.status(400).json({ message: 'Thiếu thông tin' });

  // 1. Kiểm tra xác nhận khớp
  if (matkhau_moi !== xacnhan)
    return res.status(400).json({ field: 'xacnhan', message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });

  // 2. Kiểm tra độ mạnh
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/;
  if (!pwRegex.test(matkhau_moi))
    return res.status(400).json({ field: 'matkhau_moi', message: 'Mật khẩu cần chứa 8-32 ký tự, bao gồm chữ hoa, chữ thường và số' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM TAIKHOAN WHERE SDT = ?').get(sdt);
  if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

  const hashed = bcrypt.hashSync(matkhau_moi, 10);
  db.prepare('UPDATE TAIKHOAN SET MATKHAU = ? WHERE SDT = ?').run(hashed, sdt);
  res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
});

module.exports = router;
