// Script to help convert SQLite routes to PostgreSQL
// This provides helper functions for common conversions

const fs = require('fs');
const path = require('path');

function convertRoute(routeFile) {
  const filePath = path.join(__dirname, 'routes', routeFile);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Change require statement
  content = content.replace(
    /const { getDb(.*?) } = require\('\.\.\/db\/database'\);/g,
    "const { getPool$1 } = require('../db/database-pg');"
  );
  
  // 2. Change getDb() to getPool()
  content = content.replace(/const db = getDb\(\);/g, 'const pool = getPool();');
  content = content.replace(/getDb\(\)/g, 'getPool()');
  
  // 3. Change function signatures to async
  content = content.replace(/router\.(get|post|put|delete)\('([^']+)',\s*auth,\s*\(/g, 
    "router.$1('$2', auth, async (");
  content = content.replace(/router\.(get|post|put|delete)\('([^']+)',\s*\(/g, 
    "router.$1('$2', async (");
  
  // Save to new file
  const newFilePath = filePath.replace('.js', '-pg.js');
  fs.writeFileSync(newFilePath, content);
  console.log(`✅ Converted ${routeFile} → ${routeFile.replace('.js', '-pg.js')}`);
}

// Convert all routes
const routes = ['taikhoan.js', 'baocao.js'];
routes.forEach(convertRoute);

console.log('\n⚠️  Manual steps needed:');
console.log('1. Replace db.prepare().get() with await pool.query()');
console.log('2. Replace db.prepare().all() with await pool.query()');
console.log('3. Replace db.prepare().run() with await pool.query()');
console.log('4. Change ? to $1, $2, $3...');
console.log('5. Wrap in try-catch blocks');
