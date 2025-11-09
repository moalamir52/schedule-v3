// اختبار سريع لتحليل taskId
const taskId = 'CUST-019-Monday-10:00 AM-Jeep';

console.log('🧪 اختبار تحليل taskId...');
console.log('📋 taskId:', taskId);

// الطريقة الجديدة المحسنة - البحث عن آخر 3 فواصل
const dashes = [];
for (let i = 0; i < taskId.length; i++) {
  if (taskId[i] === '-') {
    dashes.push(i);
  }
}

if (dashes.length >= 3) {
  // آخر 3 فواصل تفصل Day-Time-CarPlate
  const dayStart = dashes[dashes.length - 3] + 1;
  const timeStart = dashes[dashes.length - 2] + 1;
  const carPlateStart = dashes[dashes.length - 1] + 1;
  
  const customerID = taskId.substring(0, dashes[dashes.length - 3]);
  const day = taskId.substring(dayStart, dashes[dashes.length - 2]);
  const time = taskId.substring(timeStart, dashes[dashes.length - 1]);
  const carPlate = taskId.substring(carPlateStart) || '';
  
  console.log('✅ تحليل صحيح:');
  console.log('  CustomerID:', customerID);
  console.log('  Day:', day);
  console.log('  Time:', time);
  console.log('  CarPlate:', carPlate);
} else {
  console.log('❌ فشل في التحليل');
}

console.log('\n🎉 الاختبار مكتمل!');