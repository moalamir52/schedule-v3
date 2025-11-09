const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing PostgreSQL Service to Match SQLite');
console.log('===========================================');

const postgresServicePath = path.join(__dirname, 'services', 'postgresService.js');

const fixedPostgresService = `// PostgreSQL Database Service - Fixed to match SQLite exactly
const { Client } = require('pg');

class PostgresService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    console.log('🐘 Initializing PostgreSQL connection...');
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async connect() {
    if (!this.client._connected) {
      await this.client.connect();
    }
  }

  async getCustomers() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM customers WHERE "Status" = $1 ORDER BY "CustomerID"', ['Active']);
      return result.rows.map(customer => ({
        ...customer,
        CustomerName: customer.Name, // Add alias for compatibility
        WashDay: customer.Days,      // Add alias for compatibility  
        WashTime: customer.Time      // Add alias for compatibility
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async getWorkers() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM workers WHERE "Status" = $1 ORDER BY "Name"', ['Active']);
      return result.rows;
    } catch (error) {
      console.error('Error fetching workers:', error);
      return [];
    }
  }

  async getAllHistory() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM wash_history ORDER BY "WashDate" DESC');
      return result.rows;
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  async getScheduledTasks() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM "ScheduledTasks" ORDER BY "AppointmentDate", "Time"');
      console.log(\`[POSTGRES] Retrieved \${result.rows.length} tasks from ScheduledTasks\`);
      return result.rows;
    } catch (error) {
      console.error('Error fetching scheduled tasks:', error);
      return [];
    }
  }

  async clearAndWriteSchedule(tasks) {
    console.log(\`[POSTGRES] Starting transaction to save \${tasks.length} tasks to ScheduledTasks\`);
    
    try {
      await this.connect();
      
      // Start transaction
      await this.client.query('BEGIN');
      
      // Clear existing tasks
      await this.client.query('DELETE FROM "ScheduledTasks"');
      console.log(\`[POSTGRES] Cleared all existing tasks\`);
      
      // Insert new tasks
      for (const task of tasks) {
        await this.client.query(\`
          INSERT INTO "ScheduledTasks" 
          ("Day", "AppointmentDate", "Time", "CustomerID", "CustomerName", "Villa", "CarPlate", "WashType", "WorkerName", "WorkerID", "PackageType", "isLocked", "ScheduleDate") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        \`, [
          task.day,
          task.appointmentDate,
          task.time,
          task.customerId,
          task.customerName,
          task.villa,
          task.carPlate,
          task.washType,
          task.workerName,
          task.workerId,
          task.packageType,
          task.isLocked || 'FALSE',
          task.scheduleDate || new Date().toISOString().split('T')[0]
        ]);
      }
      
      // Commit transaction
      await this.client.query('COMMIT');
      console.log(\`[POSTGRES] Successfully committed \${tasks.length} tasks to ScheduledTasks\`);
      
    } catch (error) {
      console.error(\`[POSTGRES] Error during transaction, rolling back:\`, error);
      await this.client.query('ROLLBACK');
      throw error;
    }
  }

  async addCustomer(customerData) {
    try {
      await this.connect();
      const result = await this.client.query(\`
        INSERT INTO customers ("CustomerID", "Name", "Villa", "CarPlates", "Washman_Package", "Days", "Time", "Status", "Phone", "Notes", "Fee", "Number of car", "start date") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
      \`, [
        customerData.CustomerID || \`CUST-\${Date.now()}\`,
        customerData.Name || customerData.CustomerName,
        customerData.Villa,
        customerData.CarPlates,
        customerData.Washman_Package,
        customerData.Days || customerData.WashDay,
        customerData.Time || customerData.WashTime,
        'Active',
        customerData.Phone,
        customerData.Notes,
        customerData.Fee || 0,
        customerData['Number of car'] || 1,
        customerData['start date'] || (() => {
          const now = new Date();
          const day = now.getDate();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = months[now.getMonth()];
          const year = now.getFullYear().toString().slice(-2);
          return \`\${day}-\${month}-\${year}\`;
        })()
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  async findUserByUsername(username) {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM "Users" WHERE "Username" = $1', [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  async getUsers() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM "Users" ORDER BY "Username"');
      return result.rows;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async addUser(userData) {
    try {
      await this.connect();
      const result = await this.client.query(\`
        INSERT INTO "Users" ("UserID", "Username", "Password", "PlainPassword", "Role", "Status", "CreatedAt") 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      \`, [
        userData.UserID || \`USER-\${Date.now()}\`,
        userData.username || userData.Username,
        userData.password || userData.Password,
        userData.plainPassword || userData.PlainPassword,
        userData.role || userData.Role,
        'Active',
        new Date().toISOString()
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async getServices() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM "Services" WHERE "Status" = $1 ORDER BY "ServiceName"', ['Active']);
      return result.rows;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async getInvoices() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM invoices ORDER BY "CreatedAt" DESC');
      return result.rows;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async addInvoice(invoiceData) {
    try {
      await this.connect();
      const result = await this.client.query(\`
        INSERT INTO invoices ("InvoiceID", "Ref", "CustomerID", "CustomerName", "Villa", "TotalAmount", "Status", "CreatedAt") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      \`, [
        invoiceData.InvoiceID || \`INV-\${Date.now()}\`,
        invoiceData.Ref,
        invoiceData.CustomerID,
        invoiceData.CustomerName,
        invoiceData.Villa,
        invoiceData.TotalAmount || 0,
        'Pending',
        new Date().toISOString()
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  }

  async getNextInvoiceRef() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT "Ref" FROM invoices WHERE "Ref" LIKE $1 ORDER BY "Ref" DESC LIMIT 1', ['GLOGO-%']);
      
      if (result.rows.length === 0) {
        return 'GLOGO-2511055';
      }
      
      const lastRef = result.rows[0].Ref;
      const match = lastRef.match(/GLOGO-(\\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return \`GLOGO-\${nextNum}\`;
      }
      
      return 'GLOGO-2511055';
    } catch (error) {
      console.error('Error getting next invoice ref:', error);
      return 'GLOGO-2511055';
    }
  }

  async updateCustomer(customerId, updateData) {
    try {
      await this.connect();
      const fields = Object.keys(updateData).map((key, index) => \`"\${key}" = $\${index + 1}\`).join(', ');
      const values = Object.values(updateData);
      values.push(customerId);
      
      const result = await this.client.query(\`UPDATE customers SET \${fields} WHERE "CustomerID" = $\${values.length}\`, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(customerId) {
    try {
      await this.connect();
      const result = await this.client.query('DELETE FROM customers WHERE "CustomerID" = $1', [customerId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
}

module.exports = new PostgresService();`;

console.log('💾 Writing fixed PostgreSQL service...');
fs.writeFileSync(postgresServicePath, fixedPostgresService);

console.log('✅ PostgreSQL service fixed to match SQLite exactly!');
console.log('🔄 Please restart your server to apply the changes.');