const https = require('https');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function testScheduleReset() {
  console.log('🧪 اختبار إعادة تعيين الجدولة...\n');
  
  try {
    // 1. فحص المهام الحالية
    console.log('1️⃣ فحص المهام الحالية...');
    const db = require('./services/databaseService');
    const currentTasks = await db.getScheduledTasks();
    console.log(`📊 المهام الحالية: ${currentTasks.length}`);
    
    // 2. اختبار حذف جميع المهام
    console.log('\n2️⃣ اختبار حذف جميع المهام...');
    const response = await fetch('http://localhost:3001/api/schedule-reset/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const clearResult = await response.json();
    console.log('نتيجة الحذف:', clearResult);
    
    // 3. التحقق من الحذف
    console.log('\n3️⃣ التحقق من الحذف...');
    const afterClear = await db.getScheduledTasks();
    console.log(`📊 المهام بعد الحذف: ${afterClear.length}`);
    
    // 4. اختبار إعادة الإنشاء
    console.log('\n4️⃣ اختبار إعادة الإنشاء...');
    const resetResponse = await fetch('http://localhost:3001/api/schedule-reset/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const resetResult = await resetResponse.json();
    console.log('نتيجة إعادة الإنشاء:', resetResult);
    
    // 5. التحقق النهائي
    console.log('\n5️⃣ التحقق النهائي...');
    const finalTasks = await db.getScheduledTasks();
    console.log(`📊 المهام النهائية: ${finalTasks.length}`);
    
    console.log('\n✅ اختبار إعادة التعيين مكتمل!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testScheduleReset().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});