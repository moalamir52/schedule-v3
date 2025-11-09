// تحليل المواعيد الغير مدعومة من اللوج
const unsupportedTimeFormats = [
  // من اللوج - مواعيد معقدة
  "6:00 AM Lincoln, 6:00 AM Cadillac, 11:00 AM Nissan",
  "9:00 AM Kia, 5:00 PM Jetour", 
  "11:00 AM Uni k, 5:00 PM Mazda",
  "Mon@7:00 AM, Fri@11:00 AM",
  "Sat@10:00 AM,Tue@7:00 AM,Thurs@7:00 AM",
  "Tue@8:00 AM, Sat@4:00 PM",
  "Mon@5:00 PM, Wed@5:00 PM, Sat@8:00 AM",
  "1:00 PM & 1:00 PM"
];

// الأوقات المدعومة حالياً في الجدول
const supportedTimeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

console.log('=== تحليل المواعيد الغير مدعومة ===\n');

unsupportedTimeFormats.forEach((timeFormat, index) => {
  console.log(`${index + 1}. "${timeFormat}"`);
  
  // استخراج الأوقات من النص
  const timePattern = /\d{1,2}:\d{2}\s*[AP]M/gi;
  const extractedTimes = timeFormat.match(timePattern);
  
  if (extractedTimes) {
    const uniqueTimes = [...new Set(extractedTimes.map(time => time.trim()))];
    console.log(`   الأوقات المستخرجة: [${uniqueTimes.join(', ')}]`);
    
    // فحص أي الأوقات مدعومة وأيها لا
    uniqueTimes.forEach(time => {
      const isSupported = supportedTimeSlots.includes(time);
      console.log(`   - ${time}: ${isSupported ? '✅ مدعوم' : '❌ غير مدعوم'}`);
    });
  } else {
    console.log(`   ❌ لا يمكن استخراج أوقات من هذا النص`);
  }
  console.log('');
});

console.log('=== التوصيات ===');
console.log('1. كل الأوقات المستخرجة مدعومة في الجدول');
console.log('2. المشكلة في الـ frontend - لا يتعامل مع الأوقات المعقدة');
console.log('3. نحتاج تحديث parseTimeSlots في WorkerScheduleView.jsx');