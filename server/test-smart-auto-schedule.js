async function testSmartAutoSchedule() {
  console.log('🤖 اختبار Smart Auto Schedule...\n');
  
  try {
    const db = require('./services/databaseService');
    
    // 1. فحص المهام الحالية
    console.log('1️⃣ فحص المهام الحالية...');
    const currentTasks = await db.getScheduledTasks();
    console.log(`📊 المهام الحالية: ${currentTasks.length}`);
    
    // 2. تشغيل Smart Auto Schedule مباشرة
    console.log('\n2️⃣ تشغيل Smart Auto Schedule...');
    const { smartAutoSchedule } = require('./api/controllers/autoScheduleController');
    
    // محاكاة req و res
    const req = {
      params: { weekOffset: '0' },
      body: { showAllSlots: false }
    };
    
    let result = null;
    const res = {
      json: (data) => {
        result = data;
        console.log('📤 Smart Auto Schedule Result:', data);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Error Response (${code}):`, data);
          result = { success: false, ...data };
          return data;
        }
      })
    };
    
    await smartAutoSchedule(req, res);
    
    // 3. التحقق من النتيجة
    console.log('\n3️⃣ التحقق من النتيجة...');
    const finalTasks = await db.getScheduledTasks();
    console.log(`📊 المهام بعد Smart Auto Schedule: ${finalTasks.length}`);
    
    if (result?.success) {
      console.log('✅ Smart Auto Schedule نجح!');
      console.log(`🎯 تم إنشاء ${result.assignments?.length || finalTasks.length} مهمة`);
    } else {
      console.log('❌ Smart Auto Schedule فشل');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testSmartAutoSchedule().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});