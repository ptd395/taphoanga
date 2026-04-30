# Hướng dẫn Deploy Web Tạp Hóa Nga

## 📋 Tổng quan
- **Frontend**: Deploy lên Vercel (miễn phí)
- **Backend**: Deploy lên Render (miễn phí)
- **Database**: SQLite (tích hợp sẵn trong backend)

---

## 🔧 BƯỚC 1: Deploy Backend lên Render

### 1.1. Tạo tài khoản Render
1. Truy cập: https://render.com
2. Đăng ký tài khoản (dùng GitHub để dễ dàng hơn)

### 1.2. Push code lên GitHub
```bash
# Nếu chưa có Git repository
git init
git add .
git commit -m "Initial commit"

# Tạo repository mới trên GitHub, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 1.3. Tạo Web Service trên Render
1. Đăng nhập vào Render
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository của bạn
4. Cấu hình:
   - **Name**: `taphoanga-backend` (hoặc tên bạn muốn)
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. **Environment Variables** (Click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secret_key_here_change_this
   PORT=5000
   ```

6. Click **"Create Web Service"**
7. Đợi 5-10 phút để deploy
8. Sau khi deploy xong, copy URL (ví dụ: `https://taphoanga-backend.onrender.com`)

### 1.4. Test Backend
- Truy cập: `https://taphoanga-backend.onrender.com/api/health`
- Nếu thấy `{"status":"ok"}` là thành công!

---

## 🎨 BƯỚC 2: Deploy Frontend lên Vercel

### 2.1. Cập nhật API URL
1. Mở file `frontend/.env.production`
2. Thay đổi URL backend:
   ```
   VITE_API_URL=https://taphoanga-backend.onrender.com/api
   ```
   (Thay `taphoanga-backend` bằng tên service của bạn)

### 2.2. Tạo tài khoản Vercel
1. Truy cập: https://vercel.com
2. Đăng ký bằng GitHub

### 2.3. Deploy Frontend
1. Đăng nhập Vercel
2. Click **"Add New..."** → **"Project"**
3. Import GitHub repository
4. Cấu hình:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables**:
   ```
   VITE_API_URL=https://taphoanga-backend.onrender.com/api
   ```

6. Click **"Deploy"**
7. Đợi 2-3 phút
8. Sau khi deploy xong, bạn sẽ có URL (ví dụ: `https://taphoanga.vercel.app`)

---

## 🔄 BƯỚC 3: Cập nhật CORS Backend

Sau khi có URL frontend, cần cập nhật CORS trong backend:

1. Mở file `backend/server.js`
2. Thêm URL frontend vào CORS:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'https://taphoanga.vercel.app',  // Thay bằng URL của bạn
       'https://tester-nhom08.vercel.app'
     ],
     credentials: true
   }));
   ```

3. Commit và push lên GitHub:
   ```bash
   git add .
   git commit -m "Update CORS for production"
   git push
   ```

4. Render sẽ tự động deploy lại backend

---

## ✅ BƯỚC 4: Kiểm tra

1. Truy cập URL frontend của bạn
2. Đăng nhập:
   - Username: `admin`
   - Password: `admin123`
3. Test các chức năng:
   - Bán hàng
   - Xem hóa đơn
   - Quản lý hàng hóa

---

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to backend"
- Kiểm tra URL backend trong `.env.production`
- Kiểm tra CORS trong `backend/server.js`
- Xem logs trên Render Dashboard

### Lỗi: "Database error"
- Render free tier có thể sleep sau 15 phút không dùng
- Lần đầu truy cập sẽ mất 30-60s để wake up

### Backend bị sleep
- Render free tier sẽ sleep sau 15 phút không hoạt động
- Có thể dùng UptimeRobot (miễn phí) để ping backend mỗi 5 phút

---

## 📝 Lưu ý quan trọng

1. **Database**: SQLite sẽ bị reset mỗi khi Render deploy lại
   - Nếu muốn lưu dữ liệu lâu dài, nên chuyển sang PostgreSQL
   - Render cung cấp PostgreSQL miễn phí (500MB)

2. **Free tier limitations**:
   - Render: 750 giờ/tháng, sleep sau 15 phút không dùng
   - Vercel: Unlimited bandwidth cho personal projects

3. **Custom domain** (tùy chọn):
   - Vercel: Miễn phí custom domain
   - Render: Miễn phí custom domain

---

## 🔄 Cập nhật code sau này

### Cập nhật Frontend:
```bash
git add .
git commit -m "Update frontend"
git push
```
→ Vercel tự động deploy

### Cập nhật Backend:
```bash
git add .
git commit -m "Update backend"
git push
```
→ Render tự động deploy

---

## 🆘 Cần giúp đỡ?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- GitHub: https://github.com/YOUR_USERNAME/YOUR_REPO/issues
