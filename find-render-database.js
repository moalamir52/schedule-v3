// إضافة endpoint لمعرفة معلومات قاعدة البيانات على الإنتاج
// أضف هذا الكود لملف server.js

// إضافة endpoint للحصول على معلومات قاعدة البيانات
app.get('/api/database-info', (req, res) => {
  const dbInfo = {
    hasPostgresUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl2: !!process.env.POSTGRES_URL,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    // لا نعرض الـ URL كاملاً لأسباب أمنية
    dbType: process.env.DATABASE_URL ? 
      (process.env.DATABASE_URL.includes('postgres') ? 'PostgreSQL' : 'Other') : 
      'SQLite (Local)',
    timestamp: new Date().toISOString()
  };
  
  res.json(dbInfo);
});

console.log('أضف هذا الكود لملف server.js ثم ادخل على:');
console.log('https://your-site.onrender.com/api/database-info');