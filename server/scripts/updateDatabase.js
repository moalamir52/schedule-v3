const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseUpdater {
  constructor() {
    this.connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!this.connectionString) {
      console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
      process.exit(1);
    }
  }

  async updateCustomer(customerId, updates) {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const fields = Object.keys(updates).map(key => `"${key}" = $${Object.keys(updates).indexOf(key) + 2}`).join(', ');
      const values = [customerId, ...Object.values(updates)];
      
      const query = `UPDATE customers SET ${fields} WHERE "CustomerID" = $1`;
      const result = await client.query(query, values);
      
      console.log(`✅ تم تحديث العميل ${customerId}: ${result.rowCount} سجل`);
      return result;
      
    } catch (error) {
      console.error('❌ خطأ في تحديث العميل:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  async addCustomer(customerData) {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const columns = Object.keys(customerData).map(key => `"${key}"`).join(', ');
      const placeholders = Object.keys(customerData).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(customerData);
      
      const query = `INSERT INTO customers (${columns}) VALUES (${placeholders})`;
      const result = await client.query(query, values);
      
      console.log(`✅ تم إضافة العميل ${customerData.CustomerID}`);
      return result;
      
    } catch (error) {
      console.error('❌ خطأ في إضافة العميل:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  async deleteCustomer(customerId) {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const query = `DELETE FROM customers WHERE "CustomerID" = $1`;
      const result = await client.query(query, [customerId]);
      
      console.log(`✅ تم حذف العميل ${customerId}: ${result.rowCount} سجل`);
      return result;
      
    } catch (error) {
      console.error('❌ خطأ في حذف العميل:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  async bulkUpdateFromFile(filePath) {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.customers) {
        console.log(`🔄 تحديث ${data.customers.length} عميل...`);
        
        for (const customer of data.customers) {
          try {
            // محاولة التحديث أولاً
            const updateFields = Object.keys(customer).filter(key => key !== 'CustomerID')
              .map(key => `"${key}" = $${Object.keys(customer).filter(k => k !== 'CustomerID').indexOf(key) + 2}`)
              .join(', ');
            
            const updateValues = [customer.CustomerID, ...Object.keys(customer)
              .filter(key => key !== 'CustomerID')
              .map(key => customer[key])];
            
            const updateQuery = `UPDATE customers SET ${updateFields} WHERE "CustomerID" = $1`;
            const updateResult = await client.query(updateQuery, updateValues);
            
            if (updateResult.rowCount === 0) {
              // إذا لم يتم العثور على العميل، أضفه
              const columns = Object.keys(customer).map(key => `"${key}"`).join(', ');
              const placeholders = Object.keys(customer).map((_, i) => `$${i + 1}`).join(', ');
              const values = Object.values(customer);
              
              const insertQuery = `INSERT INTO customers (${columns}) VALUES (${placeholders})`;
              await client.query(insertQuery, values);
              console.log(`➕ تم إضافة العميل الجديد: ${customer.CustomerID}`);
            } else {
              console.log(`🔄 تم تحديث العميل: ${customer.CustomerID}`);
            }
            
          } catch (error) {
            console.error(`❌ خطأ مع العميل ${customer.CustomerID}:`, error.message);
          }
        }
      }
      
      console.log('✅ انتهى التحديث المجمع');
      
    } catch (error) {
      console.error('❌ خطأ في التحديث المجمع:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  async runCustomQuery(query, params = []) {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const result = await client.query(query, params);
      console.log(`✅ تم تنفيذ الاستعلام: ${result.rowCount} سجل متأثر`);
      
      if (result.rows && result.rows.length > 0) {
        console.log('📊 النتائج:', result.rows);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ خطأ في تنفيذ الاستعلام:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
}

module.exports = DatabaseUpdater;

// تشغيل مباشر
if (require.main === module) {
  const updater = new DatabaseUpdater();
  
  const command = process.argv[2];
  const param1 = process.argv[3];
  const param2 = process.argv[4];

  switch (command) {
    case 'update':
      if (!param1 || !param2) {
        console.error('❌ الاستخدام: node updateDatabase.js update CUST-001 \'{"Name":"اسم جديد"}\'');
        process.exit(1);
      }
      try {
        const updates = JSON.parse(param2);
        updater.updateCustomer(param1, updates).catch(console.error);
      } catch (error) {
        console.error('❌ خطأ في تحليل JSON:', error.message);
      }
      break;
      
    case 'add':
      if (!param1) {
        console.error('❌ الاستخدام: node updateDatabase.js add \'{"CustomerID":"CUST-999","Name":"عميل جديد"}\'');
        process.exit(1);
      }
      try {
        const customerData = JSON.parse(param1);
        updater.addCustomer(customerData).catch(console.error);
      } catch (error) {
        console.error('❌ خطأ في تحليل JSON:', error.message);
      }
      break;
      
    case 'delete':
      if (!param1) {
        console.error('❌ الاستخدام: node updateDatabase.js delete CUST-001');
        process.exit(1);
      }
      updater.deleteCustomer(param1).catch(console.error);
      break;
      
    case 'bulk':
      if (!param1) {
        console.error('❌ الاستخدام: node updateDatabase.js bulk backup-file.json');
        process.exit(1);
      }
      updater.bulkUpdateFromFile(param1).catch(console.error);
      break;
      
    case 'query':
      if (!param1) {
        console.error('❌ الاستخدام: node updateDatabase.js query "SELECT * FROM customers LIMIT 5"');
        process.exit(1);
      }
      updater.runCustomQuery(param1).catch(console.error);
      break;
      
    default:
      console.log('الاستخدام:');
      console.log('node updateDatabase.js update CUST-001 \'{"Name":"اسم جديد"}\'');
      console.log('node updateDatabase.js add \'{"CustomerID":"CUST-999","Name":"عميل جديد"}\'');
      console.log('node updateDatabase.js delete CUST-001');
      console.log('node updateDatabase.js bulk backup-file.json');
      console.log('node updateDatabase.js query "SELECT * FROM customers LIMIT 5"');
  }
}