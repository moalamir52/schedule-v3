// Create Supabase schema using REST API
const https = require('https');

// Replace with your actual Supabase project details
const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function createSupabaseSchema() {
  console.log('🧹 Creating Supabase Schema via API');
  console.log('===================================');
  
  if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY') {
    console.log('❌ Please update SUPABASE_ANON_KEY');
    console.log('Get it from: Supabase Dashboard -> Settings -> API -> anon public key');
    return;
  }
  
  // SQL commands to create tables
  const createTables = [
    `CREATE TABLE IF NOT EXISTS customers (
      "CustomerID" TEXT PRIMARY KEY,
      "Name" TEXT,
      "Villa" TEXT,
      "Phone" TEXT,
      "Number of car" INTEGER,
      "CarPlates" TEXT,
      "Days" TEXT,
      "Time" TEXT,
      "Notes" TEXT,
      "Washman_Package" TEXT,
      "Fee" INTEGER,
      "start date" TEXT,
      "payment" TEXT,
      "Status" TEXT,
      "Serves" TEXT,
      "Serves Active" TEXT,
      "Car A" TEXT,
      "Car B" TEXT,
      "Car C" TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS "ScheduledTasks" (
      "Day" TEXT,
      "AppointmentDate" TEXT,
      "Time" TEXT,
      "CustomerID" TEXT,
      "CustomerName" TEXT,
      "Villa" TEXT,
      "CarPlate" TEXT,
      "WashType" TEXT,
      "WorkerName" TEXT,
      "WorkerID" TEXT,
      "PackageType" TEXT,
      "isLocked" TEXT,
      "ScheduleDate" TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS invoices (
      "InvoiceID" TEXT PRIMARY KEY,
      "CustomerID" TEXT,
      "CustomerName" TEXT,
      "Villa" TEXT,
      "DueDate" TEXT,
      "TotalAmount" INTEGER,
      "Status" TEXT,
      "PaymentMethod" TEXT,
      "Start" TEXT,
      "End" TEXT,
      "Vehicle" TEXT,
      "PackageID" TEXT,
      "Notes" TEXT,
      "CreatedBy" TEXT,
      "CreatedAt" TEXT,
      "Ref" TEXT,
      "Services" TEXT
    )`
  ];
  
  try {
    for (let i = 0; i < createTables.length; i++) {
      const sql = createTables[i];
      console.log(`Creating table ${i + 1}...`);
      
      const result = await executeSQL(sql);
      console.log(`✅ Table ${i + 1} created`);
    }
    
    console.log('\n🎉 Schema created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Run if called directly
if (require.main === module) {
  createSupabaseSchema();
}

module.exports = { createSupabaseSchema };