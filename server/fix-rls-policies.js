const https = require('https');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function fixRLSPolicies() {
  console.log('🔧 إصلاح RLS Policies...\n');
  
  const policies = [
    {
      name: 'إلغاء RLS',
      sql: 'ALTER TABLE "ScheduledTasks" DISABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'إنشاء Policy شامل',
      sql: 'CREATE POLICY "allow_all_operations" ON "ScheduledTasks" FOR ALL USING (true) WITH CHECK (true);'
    }
  ];
  
  for (const policy of policies) {
    try {
      console.log(`⚡ ${policy.name}...`);
      const result = await executeSQL(policy.sql);
      
      if (result.status === 200) {
        console.log('✅ نجح');
      } else {
        console.log('❌ فشل:', result.data);
      }
    } catch (error) {
      console.log('❌ خطأ:', error.message);
    }
  }
  
  // اختبار النتيجة
  console.log('\n🧪 اختبار النتيجة...');
  try {
    const db = require('./services/databaseService');
    const tasks = await db.getScheduledTasks();
    console.log(`✅ تم جلب ${tasks.length} مهمة - RLS تم إصلاحه!`);
  } catch (error) {
    console.log('❌ لا يزال هناك مشكلة:', error.message);
  }
}

fixRLSPolicies().then(() => {
  console.log('\n🎉 انتهى الإصلاح');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الإصلاح:', error);
  process.exit(1);
});