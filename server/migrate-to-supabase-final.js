const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Supabase connection
const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function supabaseRequest(method, path, data = null) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: data ? JSON.stringify(data) : null
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function migrateCustomers() {
  console.log('🚀 Starting final migration...');
  
  // Connect to SQLite
  const dbPath = path.join(__dirname, 'database/database.db');
  const db = new sqlite3.Database(dbPath);
  
  // Get SQLite customers
  const customers = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM customers WHERE Status = ?', ['Active'], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  console.log(`📊 Found ${customers.length} customers in SQLite`);
  
  if (customers.length === 0) {
    console.log('❌ No customers found in SQLite!');
    return;
  }
  
  // Migrate each customer with correct column names
  for (const customer of customers) {
    const supabaseCustomer = {
      CustomerID: customer.CustomerID,
      Name: customer.Name,
      Villa: customer.Villa,
      CarPlates: customer.CarPlates,
      Washman_Package: customer.Washman_Package,
      Days: customer.Days,
      Time: customer.Time,
      Status: customer.Status || 'Active',
      Phone: customer.Phone,
      Notes: customer.Notes,
      Fee: customer.Fee || 0,
      'Number of car': customer['Number of car'] || 1,
      'start date': customer['start date']
    };
    
    try {
      await supabaseRequest('POST', '/customers', supabaseCustomer);
      console.log(`✅ Migrated: ${customer.Name}`);
    } catch (error) {
      console.log(`❌ Failed to migrate ${customer.Name}:`, error.message);
    }
  }
  
  // Verify migration
  const supabaseCustomers = await supabaseRequest('GET', '/customers');
  console.log(`🎉 Migration complete! ${supabaseCustomers.length} customers in Supabase`);
  
  db.close();
}

migrateCustomers().catch(console.error);