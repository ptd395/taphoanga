# 👥 Hướng dẫn cho Thành viên (Team Members)

## 🎯 Bạn cần làm gì để test chung database?

### Bước 1: Pull code từ GitHub

```bash
git clone https://github.com/NhanLe134/Tester_Nhom08.git
cd Tester_Nhom08
```

Hoặc nếu đã clone rồi:
```bash
git pull origin main
```

---

### Bước 2: Cài đặt dependencies

```bash
# Backend
cd backend
npm install

# Frontend (terminal mới)
cd frontend
npm install
```

---

### Bước 3: Lấy DATABASE_URL từ Team Lead

**Yêu cầu Team Lead gửi cho bạn:**
```
DATABASE_URL=postgresql://taphoanga_user:tg6Lz0rm8w1nNgIQfLDGuCPiqN4WgfVx@dpg-d7loigfavr4c73b5oc9g-a.singapore-postgres.render.com/taphoanga
```

⚠️ **Lưu ý:** Đây là thông tin nhạy cảm, nhận qua chat riêng (Telegram/Discord)

---

### Bước 4: Tạo file .env

```bash
cd backend
cp .env.example .env
```

**Mở file `.env` và paste DATABASE_URL:**

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=taphoanga-secret-2024
DATABASE_URL=postgresql://taphoanga_user:tg6Lz0rm8w1nNgIQfLDGuCPiqN4WgfVx@dpg-d7loigfavr4c73b5oc9g-a.singapore-postgres.render.com/taphoanga
FRONTEND_URL=http://localhost:5173
```

**Save file** (Ctrl+S)

---

### Bước 5: Chạy Backend

```bash
cd backend
npm run start:pg
```

**Kết quả mong đợi:**
```
✅ PostgreSQL connection pool created
✅ PostgreSQL schema initialized
Database already seeded.
✅ Server đang chạy tại http://localhost:5000
```

---

### Bước 6: Chạy Frontend (Terminal mới)

```bash
cd frontend
npm run dev
```

**Kết quả mong đợi:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### Bước 7: Test

1. **Mở browser:** http://localhost:5173
2. **Login:**
   - Username: `admin`
   - Password: `Admin123`
3. **Xem data:**
   - Hàng hóa: 20 sản phẩm
   - Hóa đơn: 105 hóa đơn
4. **Thử thêm sản phẩm mới**
5. **Yêu cầu người khác refresh** → Họ sẽ thấy sản phẩm bạn vừa thêm! ✅

---

## ✅ Checklist

- [ ] Pull code từ GitHub
- [ ] Cài npm install (backend + frontend)
- [ ] Nhận DATABASE_URL từ Team Lead
- [ ] Tạo file .env và paste DATABASE_URL
- [ ] Chạy backend: `npm run start:pg`
- [ ] Chạy frontend: `npm run dev`
- [ ] Mở http://localhost:5173
- [ ] Login: admin / Admin123
- [ ] Test thêm/sửa/xóa data

---

## 🆘 Troubleshooting

### "DATABASE_URL environment variable is not set"
→ Chưa tạo file `.env` hoặc chưa paste DATABASE_URL

**Fix:**
```bash
cd backend
cp .env.example .env
# Mở .env và paste DATABASE_URL
```

---

### "Connection refused"
→ DATABASE_URL sai hoặc database không available

**Fix:**
1. Check lại DATABASE_URL trong `.env`
2. Yêu cầu Team Lead gửi lại
3. Check database trên Render có status "Available" không

---

### "Port 5000 already in use"
→ Backend đang chạy rồi

**Fix:**
```bash
# Windows
Get-Process node | Stop-Process -Force

# Linux/Mac
killall node
```

---

### Backend chạy nhưng không thấy data
→ Đây là bình thường! Database đã có data từ Team Lead seed rồi.

Message "Database already seeded" là OK!

---

## 💡 Tips

### Test chung nhóm:
1. Người A thêm sản phẩm
2. Người B refresh trang → Thấy sản phẩm của A
3. Người C sửa sản phẩm → A và B refresh thấy thay đổi

### Không xóa data của người khác!
- ⚠️ Mọi người dùng chung 1 database
- ⚠️ Xóa data sẽ ảnh hưởng đến cả nhóm

---

## 🎉 Xong!

Bạn đã sẵn sàng test chung với nhóm! 🚀
