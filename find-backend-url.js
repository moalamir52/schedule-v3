// فحص إعدادات Vercel للعثور على Backend URL

console.log('🔍 البحث عن Backend URL...');
console.log('');

console.log('📋 أماكن البحث:');
console.log('1. Vercel Dashboard → Project → Settings → Environment Variables');
console.log('2. ابحث عن VITE_API_URL');
console.log('');

console.log('🌐 URLs محتملة للـ Backend:');
console.log('- https://schedule-v3-server.onrender.com');
console.log('- https://schedule-v3-api.railway.app');
console.log('- https://schedule-v3-backend.herokuapp.com');
console.log('');

console.log('🔧 للتحقق من Backend URL:');
console.log('1. افتح Developer Tools في المتصفح');
console.log('2. تبويب Network');
console.log('3. حدث أي عملية في الموقع');
console.log('4. شوف الـ API calls بتروح فين');
console.log('');

console.log('📊 أو جرب هذه الـ URLs:');
const possibleUrls = [
  'https://schedule-v3-server.onrender.com/api/database-info',
  'https://schedule-v3-api.railway.app/api/database-info', 
  'https://schedule-v3-backend.herokuapp.com/api/database-info'
];

possibleUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

console.log('');
console.log('✅ لما تلاقي الـ Backend URL الصحيح، هتقدر تعمل:');
console.log('- نسخة احتياطية من قاعدة البيانات');
console.log('- الوصول لمعلومات قاعدة البيانات');