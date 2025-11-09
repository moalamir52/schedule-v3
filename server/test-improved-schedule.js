async function testImprovedSchedule() {
  console.log('🧪 اختبار الجدولة المحسنة...\n');
  
  try {
    const { buildWeeklySchedule } = require('./services/logicService');
    
    console.log('1️⃣ بناء الجدولة المحسنة...');
    const schedule = await buildWeeklySchedule();
    console.log(`📊 تم إنشاء ${schedule.length} مهمة`);
    
    if (schedule.length > 0) {
      console.log('\n📋 عينة من المهام المحسنة:');
      schedule.slice(0, 10).forEach((task, i) => {
        console.log(`${i+1}. ${task.customerName} - ${task.villa}`);
        console.log(`   Day: ${task.day}, Time: ${task.time}`);
        console.log(`   Car: ${task.carPlate}, WashType: ${task.washType}`);
        console.log(`   Package: ${task.packageType}`);
        console.log(`   Worker: ${task.workerName}`);
        console.log('');
      });
      
      // تحليل أنواع الغسيل
      const washTypes = schedule.map(t => t.washType);
      const extCount = washTypes.filter(w => w === 'EXT').length;
      const intCount = washTypes.filter(w => w === 'INT').length;
      
      console.log('📊 إحصائيات أنواع الغسيل:');
      console.log(`   EXT (خارجي): ${extCount}`);
      console.log(`   INT (داخلي): ${intCount}`);
      
      // تحليل المواعيد
      const times = [...new Set(schedule.map(t => t.time))];
      console.log(`\n⏰ المواعيد المختلفة: ${times.length}`);
      console.log('   المواعيد:', times.slice(0, 10));
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error('Stack:', error.stack);
  }
}

testImprovedSchedule().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});