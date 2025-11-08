// فحص نوع قاعدة البيانات المستخدمة
require('dotenv').config();

console.log('🔍 فحص إعدادات قاعدة البيانات:');
console.log('================================');

const databaseUrl = process.env.DATABASE_URL;
const postgresUrl = process.env.POSTGRES_URL;

if (databaseUrl) {
  console.log('✅ DATABASE_URL موجود');
  
  if (databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://')) {
    console.log('📊 نوع قاعدة البيانات: PostgreSQL');
    
    // استخراج معلومات الاتصال
    try {
      const url = new URL(databaseUrl);
      console.log('🌐 Host:', url.hostname);
      console.log('🔌 Port:', url.port || '5432');
      console.log('👤 Username:', url.username);
      console.log('🗄️ Database:', url.pathname.substring(1));
    } catch (error) {
      console.log('⚠️ خطأ في تحليل URL:', error.message);
    }
  } else if (databaseUrl.includes('sqlite')) {
    console.log('📊 نوع قاعدة البيانات: SQLite (محلي)');
  }
} else if (postgresUrl) {
  console.log('✅ POSTGRES_URL موجود');
  console.log('📊 نوع قاعدة البيانات: PostgreSQL');
} else {
  console.log('❌ لم يتم العثور على DATABASE_URL');
  console.log('🔍 يتم استخدام SQLite المحلي');
}

console.log('\n🔧 متغيرات البيئة الأخرى:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'غير محدد');
console.log('PORT:', process.env.PORT || 'غير محدد');

// فحص ملف قاعدة البيانات المحلي
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'database/database.db');

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('\n💾 ملف SQLite المحلي:');
  console.log('📁 المسار:', dbPath);
  console.log('📏 الحجم:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('📅 آخر تعديل:', stats.mtime.toLocaleString('ar-EG'));
} else {
  console.log('\n❌ ملف SQLite المحلي غير موجود');
}