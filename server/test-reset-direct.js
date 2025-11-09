async function testResetDirect() {
  console.log('🧪 اختبار Reset مباشر...\n');
  
  try {
    // 1. فحص المهام الحالية
    console.log('1️⃣ فحص المهام الحالية...');
    const db = require('./services/databaseService');
    const currentTasks = await db.getScheduledTasks();
    console.log(`📊 المهام الحالية: ${currentTasks.length}`);
    
    // 2. تشغيل Reset مباشرة
    console.log('\n2️⃣ تشغيل Reset مباشرة...');
    const { clearAllScheduleData } = require('./api/controllers/assignmentController');
    
    // محاكاة req و res
    const req = {};
    const res = {
      json: (data) => {
        console.log('📤 Response:', data);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Response (${code}):`, data);
          return data;
        }
      })
    };
    
    await clearAllScheduleData(req, res);
    
    // 3. التحقق من النتيجة
    console.log('\n3️⃣ التحقق من النتيجة...');
    const finalTasks = await db.getScheduledTasks();
    console.log(`📊 المهام بعد Reset: ${finalTasks.length}`);
    
    console.log('\n✅ اختبار Reset مكتمل!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testResetDirect().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});