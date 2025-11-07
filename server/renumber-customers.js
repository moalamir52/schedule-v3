const db = require('./services/databaseService');

async function renumberCustomers() {
  try {
    console.log('إعادة ترقيم العملاء...');
    
    // Get all customers ordered by current ID
    const customers = await db.all('SELECT * FROM customers ORDER BY CustomerID');
    console.log(`وجد ${customers.length} عميل`);
    
    // Renumber sequentially
    for (let i = 0; i < customers.length; i++) {
      const newId = `CUST-${String(i + 1).padStart(3, '0')}`;
      const oldId = customers[i].CustomerID;
      
      if (oldId !== newId) {
        await db.run('UPDATE customers SET CustomerID = ? WHERE CustomerID = ?', [newId, oldId]);
        console.log(`تم تغيير ${oldId} إلى ${newId}`);
      }
    }
    
    console.log('تم الانتهاء من إعادة الترقيم بنجاح!');
  } catch (error) {
    console.error('خطأ:', error);
  }
}

renumberCustomers();