const https = require('https');

async function testExistingResetButton() {
  console.log('🧪 اختبار زر Reset الموجود...\n');
  
  try {
    // 1. فحص المهام الحالية
    console.log('1️⃣ فحص المهام الحالية...');
    const db = require('./services/databaseService');
    const currentTasks = await db.getScheduledTasks();
    console.log(`📊 المهام الحالية: ${currentTasks.length}`);
    
    // 2. اختبار الزر الموجود
    console.log('\n2️⃣ اختبار زر Reset الموجود...');
    
    const response = await fetch('http://localhost:3001/api/clear-all-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('نتيجة Reset:', result);
    
    // 3. التحقق من النتيجة
    console.log('\n3️⃣ التحقق من النتيجة...');
    const finalTasks = await db.getScheduledTasks();
    console.log(`📊 المهام بعد Reset: ${finalTasks.length}`);
    
    if (result.success) {
      console.log('✅ زر Reset يعمل بنجاح!');
      console.log(`🎯 تم إنشاء ${result.tasksCreated || finalTasks.length} مهمة جديدة`);
    } else {
      console.log('❌ زر Reset لا يعمل');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testExistingResetButton().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});