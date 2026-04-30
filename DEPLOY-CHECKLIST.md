# ✅ Checklist Deploy Web

## 📋 Trước khi deploy

- [ ] Code đã test kỹ trên local
- [ ] Đã có tài khoản GitHub
- [ ] Code đã push lên GitHub repository
- [ ] Đã đọc file `DEPLOY-QUICK.md`

---

## 🔧 Deploy Backend (Render)

- [ ] Tạo tài khoản Render (https://render.com)
- [ ] Tạo Web Service mới
- [ ] Connect GitHub repository
- [ ] Cấu hình:
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
- [ ] Thêm Environment Variables:
  - [ ] `NODE_ENV=production`
  - [ ] `JWT_SECRET=your_secret_key`
  - [ ] `PORT=5000`
- [ ] Deploy và đợi hoàn tất
- [ ] Copy URL backend (ví dụ: `https://taphoanga-backend.onrender.com`)
- [ ] Test: Truy cập `https://YOUR-APP.onrender.com/api/health`

---

## 🎨 Deploy Frontend (Vercel)

- [ ] Cập nhật file `frontend/.env.production`:
  ```
  VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
  ```
- [ ] Commit và push lên GitHub
- [ ] Tạo tài khoản Vercel (https://vercel.com)
- [ ] Import GitHub repository
- [ ] Cấu hình:
  - [ ] Framework: `Vite`
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Thêm Environment Variable:
  - [ ] `VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com/api`
- [ ] Deploy và đợi hoàn tất
- [ ] Copy URL frontend (ví dụ: `https://taphoanga.vercel.app`)

---

## 🔄 Cập nhật CORS

- [ ] Mở file `backend/server.js`
- [ ] Thêm URL frontend vào mảng `origin`:
  ```javascript
  origin: [
    'http://localhost:5173',
    'https://YOUR-FRONTEND-URL.vercel.app',  // ← Thêm dòng này
    'https://tester-nhom08.vercel.app'
  ]
  ```
- [ ] Commit và push lên GitHub
- [ ] Đợi Render tự động deploy lại

---

## ✅ Kiểm tra

- [ ] Truy cập URL frontend
- [ ] Đăng nhập thành công (admin/admin123)
- [ ] Test chức năng Bán hàng
- [ ] Test chức năng Hóa đơn
- [ ] Test chức năng Hàng hóa
- [ ] Test chức năng Báo cáo

---

## 📝 Ghi chú

**URL của bạn:**
- Frontend: `_______________________________`
- Backend: `_______________________________`

**Tài khoản:**
- GitHub: `_______________________________`
- Render: `_______________________________`
- Vercel: `_______________________________`

**Ngày deploy:** `___/___/______`

---

## 🆘 Nếu gặp lỗi

### Lỗi CORS
→ Kiểm tra lại URL trong `backend/server.js`

### Lỗi kết nối API
→ Kiểm tra `VITE_API_URL` trong Vercel Environment Variables

### Backend sleep
→ Đợi 30-60s, backend sẽ tự wake up

### Database bị reset
→ Render free tier reset database khi deploy lại
→ Cân nhắc nâng cấp hoặc dùng PostgreSQL

---

## 🎉 Hoàn tất!

Chúc mừng bạn đã deploy thành công! 🚀
