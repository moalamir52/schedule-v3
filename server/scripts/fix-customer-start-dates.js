const db = require('../services/databaseService');

async function fixStartDates() {
  try {
    console.log('🔧 Fixing customer start dates...');
    
    if (db.isPostgres) {
      await db.postgres.connect();
      
      // Get customers without start date
      const result = await db.postgres.client.query(`
        SELECT "CustomerID", "Name" FROM customers 
        WHERE "start date" IS NULL OR "start date" = ''
      `);
      
      console.log(`Found ${result.rows.length} customers without start date`);
      
      // Add default start date (current date)
      const now = new Date();
      const day = now.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getMonth()];
      const year = now.getFullYear().toString().slice(-2);
      const defaultStartDate = `${day}-${month}-${year}`;
      
      for (const customer of result.rows) {
        await db.postgres.client.query(`
          UPDATE customers 
          SET "start date" = $1 
          WHERE "CustomerID" = $2
        `, [defaultStartDate, customer.CustomerID]);
        
        console.log(`✅ Updated ${customer.Name} with start date: ${defaultStartDate}`);
      }
      
      console.log('🎉 All customer start dates fixed!');
    } else {
      console.log('⚠️ Using SQLite - no fix needed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing start dates:', error);
  }
}

fixStartDates();