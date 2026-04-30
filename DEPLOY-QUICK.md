# 🚀 Hướng dẫn Deploy Nhanh

## Bước 1: Chuẩn bị

```bash
# Đảm bảo code đã commit
git add .
git commit -m "Ready for deployment"

# Push lên GitHub (nếu chưa có)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Bước 2: Deploy Backend (Render)

1. Vào https://render.com → Đăng ký/Đăng nhập
2. **New +** → **Web Service**
3. Connect GitHub repo
4. Cấu hình:
   ```
   Name: taphoanga-backend
   Region: Singapore
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```
5. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=change_this_secret_key_123456
   PORT=5000
   ```
6. **Create Web Service**
7. Copy URL: `https://YOUR-APP.onrender.com`

---

## Bước 3: Deploy Frontend (Vercel)

1. Cập nhật `frontend/.env.production`:
   ```
   VITE_API_URL=https://YOUR-APP.onrender.com/api
   ```

2. Commit:
   ```bash
   git add frontend/.env.production
   git commit -m "Update production API URL"
   git push
   ```

3. Vào https://vercel.com → Đăng ký/Đăng nhập
4. **Add New...** → **Project**
5. Import GitHub repo
6. Cấu hình:
   ```
   Framework: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
7. **Environment Variables**:
   ```
   VITE_API_URL=https://YOUR-APP.onrender.com/api
   ```
8. **Deploy**

---

## Bước 4: Cập nhật CORS

1. Mở `backend/server.js`
2. Thêm URL Vercel vào CORS:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'https://YOUR-APP.vercel.app',  // ← Thêm dòng này
       'https://tester-nhom08.vercel.app'
     ],
     credentials: true
   }));
   ```
3. Commit và push:
   ```bash
   git add backend/server.js
   git commit -m "Update CORS"
   git push
   ```

---

## ✅ Xong!

- Frontend: `https://YOUR-APP.vercel.app`
- Backend: `https://YOUR-APP.onrender.com`

**Đăng nhập:**
- Username: `admin`
- Password: `admin123`

---

## ⚠️ Lưu ý

- Backend free tier sẽ sleep sau 15 phút không dùng
- Lần đầu truy cập sẽ mất 30-60s để wake up
- SQLite database sẽ reset khi deploy lại
