# 🚀 Deploy lên Render (Free)

## 🎯 Tổng quan

Bạn sẽ deploy:
- **Backend** → Render Web Service (Free)
- **Frontend** → Vercel (Free) hoặc Render Static Site
- **Database** → PostgreSQL trên Render (Đã có rồi!)

**Không cần Azure!** Render + Vercel hoàn toàn miễn phí!

---

## 📋 Phần 1: Deploy Backend lên Render

### Bước 1: Push code lên GitHub (Đã xong!)

Code đã ở: https://github.com/NhanLe134/Tester_Nhom08

---

### Bước 2: Tạo Web Service trên Render

1. **Vào Render Dashboard:** https://dashboard.render.com/
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub repository:**
   - Click "Connect account" (nếu chưa connect)
   - Chọn repository: `NhanLe134/Tester_Nhom08`
   - Click "Connect"

---

### Bước 3: Cấu hình Web Service

**Điền thông tin:**

```
Name:               taphoanga-backend
Region:             Singapore
Branch:             main
Root Directory:     backend
Runtime:            Node
Build Command:      npm install
Start Command:      npm run start:pg
Instance Type:      Free
```

---

### Bước 4: Thêm Environment Variables

Scroll xuống **"Environment Variables"**, click **"Add Environment Variable"**:

```
PORT                = 5000
NODE_ENV            = production
JWT_SECRET          = taphoanga-secret-2024
DATABASE_URL        = postgresql://taphoanga_user:tg6Lz0rm8w1nNgIQfLDGuCPiqN4WgfVx@dpg-d7loigfavr4c73b5oc9g-a.singapore-postgres.render.com/taphoanga
FRONTEND_URL        = https://tester-nhom08.vercel.app
```

⚠️ **Lưu ý:** `FRONTEND_URL` sẽ update sau khi deploy frontend

---

### Bước 5: Deploy

1. Click **"Create Web Service"**
2. Đợi 3-5 phút để Render build và deploy
3. Sau khi deploy xong, bạn sẽ có URL:
   ```
   https://taphoanga-backend.onrender.com
   ```

---

### Bước 6: Test Backend

```bash
curl https://taphoanga-backend.onrender.com/api/health
```

Kết quả:
```json
{
  "status": "ok",
  "database": "PostgreSQL",
  "time": "2026-04-24T..."
}
```

✅ Backend đã live!

---

## 📋 Phần 2: Deploy Frontend lên Vercel

### Bước 1: Cập nhật Frontend để dùng Backend URL

Tạo file `.env.production` trong `frontend/`:

```env
VITE_API_URL=https://taphoanga-backend.onrender.com
```

Cập nhật `frontend/src/api/axios.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// ... rest of code
```

---

### Bước 2: Push changes lên GitHub

```bash
git add .
git commit -m "feat: Add production API URL"
git push origin main
```

---

### Bước 3: Deploy lên Vercel

1. **Vào Vercel:** https://vercel.com/
2. **Click "Add New"** → **"Project"**
3. **Import Git Repository:**
   - Connect GitHub
   - Chọn repository: `NhanLe134/Tester_Nhom08`
   - Click "Import"

---

### Bước 4: Cấu hình Vercel

```
Project Name:       tester-nhom08
Framework Preset:   Vite
Root Directory:     frontend
Build Command:      npm run build
Output Directory:   dist
Install Command:    npm install
```

**Environment Variables:**
```
VITE_API_URL = https://taphoanga-backend.onrender.com
```

---

### Bước 5: Deploy

1. Click **"Deploy"**
2. Đợi 2-3 phút
3. Sau khi deploy xong, bạn sẽ có URL:
   ```
   https://tester-nhom08.vercel.app
   ```

---

### Bước 6: Update CORS trên Backend

Quay lại Render Dashboard → Backend Service → Environment:

**Update `FRONTEND_URL`:**
```
FRONTEND_URL = https://tester-nhom08.vercel.app
```

Click **"Save Changes"** → Backend sẽ tự động redeploy

---

### Bước 7: Test Production

1. **Mở:** https://tester-nhom08.vercel.app
2. **Login:** admin / Admin123
3. **Test:** Thêm sản phẩm, bán hàng, xem báo cáo

✅ Frontend + Backend đã kết nối!

---

## 📋 Phần 3: Hoặc Deploy Frontend lên Render (Alternative)

Nếu không muốn dùng Vercel, có thể deploy frontend lên Render:

### Bước 1: Tạo Static Site

1. Render Dashboard → **"New +"** → **"Static Site"**
2. Connect repository: `NhanLe134/Tester_Nhom08`

### Bước 2: Cấu hình

```
Name:               taphoanga-frontend
Branch:             main
Root Directory:     frontend
Build Command:      npm run build
Publish Directory:  dist
```

**Environment Variables:**
```
VITE_API_URL = https://taphoanga-backend.onrender.com
```

### Bước 3: Deploy

Click **"Create Static Site"** → Đợi deploy xong

URL: `https://taphoanga-frontend.onrender.com`

---

## 🔗 Tổng kết URLs

Sau khi deploy xong, bạn sẽ có:

```
Database:   dpg-d7loigfavr4c73b5oc9g-a.singapore-postgres.render.com
Backend:    https://taphoanga-backend.onrender.com
Frontend:   https://tester-nhom08.vercel.app
            (hoặc https://taphoanga-frontend.onrender.com)
```

---

## ⚠️ Lưu ý quan trọng

### 1. Render Free Tier Limitations

**Backend (Web Service):**
- ✅ Free
- ⚠️ Sleep sau 15 phút không dùng
- ⚠️ Cold start: 30-60 giây khi wake up
- ⚠️ 750 giờ/tháng (đủ cho 1 service chạy 24/7)

**Database (PostgreSQL):**
- ✅ Free
- ⚠️ 1GB storage
- ⚠️ 97 concurrent connections
- ⚠️ Tự động xóa sau 90 ngày không dùng

**Frontend (Static Site):**
- ✅ Free
- ✅ Không sleep
- ✅ CDN global

---

### 2. Vercel Free Tier

- ✅ 100GB bandwidth/tháng
- ✅ Không sleep
- ✅ CDN global
- ✅ Auto SSL

---

### 3. Keep Backend Awake

Backend sẽ sleep sau 15 phút. Để keep awake:

**Option 1: Cron Job (UptimeRobot)**
1. Vào: https://uptimerobot.com/
2. Tạo monitor:
   - URL: `https://taphoanga-backend.onrender.com/api/health`
   - Interval: 5 minutes

**Option 2: GitHub Actions**
Tạo file `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Backend Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: curl https://taphoanga-backend.onrender.com/api/health
```

---

## 🆘 Troubleshooting

### Backend deploy failed

**Check logs:**
1. Render Dashboard → Backend Service
2. Tab "Logs"
3. Xem lỗi gì

**Common issues:**
- Missing environment variables
- Wrong start command
- Database connection failed

---

### Frontend không connect Backend

**Check:**
1. `VITE_API_URL` đúng chưa?
2. CORS trên backend có allow frontend URL chưa?
3. Backend có đang chạy không?

**Fix:**
```bash
# Test backend
curl https://taphoanga-backend.onrender.com/api/health

# Check CORS
curl -H "Origin: https://tester-nhom08.vercel.app" \
     https://taphoanga-backend.onrender.com/api/health
```

---

### Backend sleep (503 error)

**Nguyên nhân:** Free tier sleep sau 15 phút

**Fix:**
1. Đợi 30-60 giây để wake up
2. Hoặc setup UptimeRobot để keep awake

---

## 💰 Chi phí

**Tổng chi phí: $0 (FREE!)**

- ✅ Render Backend: Free
- ✅ Render Database: Free
- ✅ Vercel Frontend: Free
- ✅ GitHub: Free

**Không cần thẻ tín dụng!**

---

## 🎉 Xong!

Bạn đã deploy thành công lên production!

**Share link cho nhóm:**
```
https://tester-nhom08.vercel.app
Login: admin / Admin123
```

🚀 Happy deploying!
