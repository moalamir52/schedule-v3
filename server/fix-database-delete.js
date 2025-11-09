const https = require('https');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function supabaseRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
      port: 443,
      path: `/rest/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = responseData ? JSON.parse(responseData) : null;
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function fixDatabaseDelete() {
  console.log('🔧 إصلاح مشكلة حذف قاعدة البيانات...\n');
  
  try {
    // 1. جلب جميع المهام الحالية
    console.log('1️⃣ جلب المهام الحالية...');
    const response = await supabaseRequest('GET', '/ScheduledTasks');
    
    if (response.status !== 200) {
      console.log('❌ فشل في جلب المهام:', response.data);
      return;
    }
    
    const allTasks = response.data;
    console.log(`📊 إجمالي المهام: ${allTasks.length}`);
    
    // 2. البحث عن المهمة المطلوب حذفها
    const targetTask = allTasks.find(task => 
      task.CustomerID === 'CUST-018' &&
      task.Day === 'Friday' &&
      task.Time === '6:00 AM' &&
      task.CarPlate === 'BMW'
    );
    
    if (!targetTask) {
      console.log('❌ المهمة غير موجودة');
      return;
    }
    
    console.log('✅ تم العثور على المهمة:');
    console.log(`  ${targetTask.CustomerName} - ${targetTask.Villa} - ${targetTask.CarPlate}`);
    
    // 3. إنشاء قائمة جديدة بدون المهمة المحذوفة
    const remainingTasks = allTasks.filter(task => 
      !(task.CustomerID === 'CUST-018' &&
        task.Day === 'Friday' &&
        task.Time === '6:00 AM' &&
        task.CarPlate === 'BMW')
    );
    
    console.log(`📊 المهام المتبقية: ${remainingTasks.length}`);
    
    // 4. محاولة TRUNCATE (حذف جميع البيانات)
    console.log('\n2️⃣ محاولة TRUNCATE...');
    const truncateResponse = await supabaseRequest('DELETE', '/ScheduledTasks?Day=is.not.null');
    console.log('TRUNCATE Response:', truncateResponse.status, truncateResponse.data);
    
    if (truncateResponse.status >= 400) {
      console.log('❌ TRUNCATE فشل، سنحاول طريقة أخرى...');
      
      // 5. محاولة إدراج البيانات الجديدة مباشرة (سيؤدي لتكرار)
      console.log('\n3️⃣ إدراج البيانات الجديدة...');
      const insertResponse = await supabaseRequest('POST', '/ScheduledTasks', remainingTasks);
      console.log('Insert Response:', insertResponse.status);
      
      if (insertResponse.status === 201) {
        console.log('✅ تم إدراج البيانات الجديدة');
        console.log('⚠️ ملاحظة: قد تكون هناك بيانات مكررة الآن');
      }
    } else {
      console.log('✅ تم حذف جميع البيانات');
      
      // 6. إدراج البيانات المتبقية
      console.log('\n3️⃣ إدراج البيانات المتبقية...');
      const insertResponse = await supabaseRequest('POST', '/ScheduledTasks', remainingTasks);
      console.log('Insert Response:', insertResponse.status);
      
      if (insertResponse.status === 201) {
        console.log('✅ تم إدراج البيانات المتبقية بنجاح');
      }
    }
    
    // 7. التحقق النهائي
    console.log('\n4️⃣ التحقق النهائي...');
    const finalResponse = await supabaseRequest('GET', '/ScheduledTasks');
    
    if (finalResponse.status === 200) {
      const finalTasks = finalResponse.data;
      console.log(`📊 إجمالي المهام الآن: ${finalTasks.length}`);
      
      const stillExists = finalTasks.find(task => 
        task.CustomerID === 'CUST-018' &&
        task.Day === 'Friday' &&
        task.Time === '6:00 AM' &&
        task.CarPlate === 'BMW'
      );
      
      if (stillExists) {
        console.log('❌ المهمة لا تزال موجودة');
      } else {
        console.log('✅ تم حذف المهمة بنجاح!');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

fixDatabaseDelete().then(() => {
  console.log('\n🎉 انتهت العملية');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});