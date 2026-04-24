require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',                                    // Local development
    process.env.FRONTEND_URL || 'https://tester-nhom08.vercel.app' // Production
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize PostgreSQL DB and seed on startup
const { getPool, initSchema } = require('./db/database-pg');
const { seed } = require('./db/seed-pg');

let dbReady = false;

(async () => {
  try {
    console.log('🔄 Initializing PostgreSQL connection...');
    getPool(); // Initialize connection pool
    
    console.log('🔄 Creating database schema...');
    await initSchema();
    
    console.log('🔄 Seeding database...');
    await seed();
    
    console.log('✅ Database ready!');
    dbReady = true;
  } catch (e) {
    console.error('❌ Database initialization failed:', e.message);
    console.error('📋 Full error:', e);
    // Don't exit, let server run for debugging
  }
})();

// Routes - Using PostgreSQL versions
app.use('/api/auth', require('./routes/auth-pg'));
app.use('/api/hanghoa', require('./routes/hanghoa'));
app.use('/api/hoadonban', require('./routes/hoadonban'));
app.use('/api/baocao', require('./routes/baocao'));
app.use('/api/taikhoan', require('./routes/taikhoan'));

// Health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok', 
  database: 'PostgreSQL',
  dbReady: dbReady,
  time: new Date().toISOString() 
}));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
});
