const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Date/Time formatting utilities
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
};

const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString(); // Full ISO format
};

const formatTime = (time) => {
  if (!time) return null;
  // Keep full time format with AM/PM for consistency
  return time;
};

class DatabaseService {
  constructor() {
    this.pool = null;
    this.init();
  }

  init() {
    // Log all environment info
    console.log('🔍 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    // Check if PostgreSQL URL is available
    if (process.env.DATABASE_URL) {
      console.log('🐘 Using PostgreSQL database!');
      console.log('URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
      // Use PostgreSQL service
      this.postgres = require('./postgresService');
      this.isPostgres = true;
      return;
    } else {
      console.log('⚠️  No DATABASE_URL found, using SQLite');
      this.isPostgres = false;
    }
    
    // SQLite connection
    const dbPath = path.join(__dirname, '../database/database.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        this.createTables();
      }
    });
  }

  async createTables() {
    try {
      // SQLite schema - execute each table separately
      const tables = [
        `CREATE TABLE IF NOT EXISTS customers (
          CustomerID TEXT PRIMARY KEY,
          Name TEXT NOT NULL,
          Villa TEXT,
          CarPlates TEXT,
          Washman_Package TEXT,
          Days TEXT,
          Time TEXT,
          Status TEXT DEFAULT 'Active',
          Phone TEXT,
          Email TEXT,
          Notes TEXT,
          Fee REAL,
          "Number of car" INTEGER,
          "start date" TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS wash_history (
          WashID TEXT PRIMARY KEY,
          CustomerID TEXT,
          CarPlate TEXT,
          WashDate TEXT,
          PackageType TEXT,
          Villa TEXT,
          WashTypePerformed TEXT,
          VisitNumberInWeek INTEGER,
          WeekInCycle INTEGER,
          Status TEXT,
          WorkerName TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS workers (
          WorkerID TEXT,
          Name TEXT NOT NULL,
          Phone TEXT,
          Status TEXT DEFAULT 'Active',
          Specialization TEXT,
          HourlyRate REAL
        )`,
        
        `CREATE TABLE IF NOT EXISTS ScheduledTasks (
          Day TEXT,
          AppointmentDate TEXT,
          Time TEXT,
          CustomerID TEXT,
          CustomerName TEXT,
          Villa TEXT,
          CarPlate TEXT,
          WashType TEXT,
          WorkerName TEXT,
          WorkerID TEXT,
          PackageType TEXT,
          isLocked TEXT DEFAULT 'FALSE',
          ScheduleDate TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS invoices (
          InvoiceID TEXT PRIMARY KEY,
          Ref TEXT UNIQUE,
          CustomerID TEXT,
          CustomerName TEXT,
          Villa TEXT,
          InvoiceDate TEXT,
          DueDate TEXT,
          TotalAmount REAL,
          Status TEXT DEFAULT 'Pending',
          PaymentMethod TEXT,
          Start TEXT,
          End TEXT,
          Vehicle TEXT,
          PackageID TEXT,
          Services TEXT,
          Notes TEXT,
          CreatedBy TEXT,
          CreatedAt TEXT,
          SubTotal REAL,
          Phone TEXT,
          Payment TEXT,
          Subject TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS Users (
          UserID TEXT PRIMARY KEY,
          Username TEXT UNIQUE NOT NULL,
          Password TEXT NOT NULL,
          PlainPassword TEXT,
          Role TEXT NOT NULL,
          Status TEXT DEFAULT 'Active',
          CreatedAt TEXT
        )`,
        
        `CREATE TABLE IF NOT EXISTS Services (
          ServiceID TEXT,
          ServiceName TEXT NOT NULL,
          Price REAL,
          Description TEXT,
          Status TEXT DEFAULT 'Active'
        )`,
        
        `CREATE TABLE IF NOT EXISTS WashRules (
          RuleId TEXT PRIMARY KEY,
          RuleName TEXT NOT NULL,
          SingleCarPattern TEXT,
          MultiCarSettings TEXT,
          BiWeeklySettings TEXT,
          CreatedDate TEXT,
          Status TEXT DEFAULT 'Active'
        )`,
        
        `CREATE TABLE IF NOT EXISTS assignments (
          taskId TEXT PRIMARY KEY,
          customerName TEXT,
          carPlate TEXT,
          washDay TEXT,
          washTime TEXT,
          washType TEXT,
          assignedWorker TEXT,
          villa TEXT,
          isLocked TEXT DEFAULT 'FALSE',
          scheduleDate TEXT
        )`
      ];
      
      for (const table of tables) {
        await this.run(table);
      }
      
      await this.run(schema);
      console.log('Database tables verified successfully');
      this.seedCustomers();
    } catch (err) {
      console.error('Error creating tables:', err);
    }
  }

  async seedCustomers() {
    try {
      const result = await this.pool.query('SELECT COUNT(*) as count FROM customers');
      if (parseInt(result.rows[0].count) === 0) {
        console.log('No existing customers found, database ready for data');
      }
    } catch (err) {
      console.error('Error checking customers:', err);
    }
  }

  // Generic query methods
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Customers methods
  async getCustomers() {
    if (this.isPostgres) {
      return await this.postgres.getCustomers();
    }
    
    try {
      console.log('[DB] Fetching customers...');
      const result = await this.all('SELECT * FROM customers WHERE Status = ? ORDER BY CustomerID COLLATE NOCASE', ['Active']);
      console.log('[DB] Found', result.length, 'customers');
      return result;
    } catch (error) {
      console.error('[DB] Error fetching customers:', error);
      throw error;
    }
  }

  async addCustomer(customerData) {
    if (this.isPostgres) {
      return await this.postgres.addCustomer(customerData);
    }
    
    const sql = `INSERT INTO customers (CustomerID, Name, Villa, CarPlates, Washman_Package, Days, Time, Status, Phone, Notes, Fee, \`Number of car\`, \`start date\`) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      customerData.CustomerID || `CUST-${Date.now()}`,
      customerData.Name || customerData.CustomerName || 'Unknown Customer',
      customerData.Villa,
      customerData.CarPlates,
      customerData.Washman_Package,
      customerData.Days || customerData.WashDay,
      customerData.Time || customerData.WashTime,
      customerData.Status || 'Active',
      customerData.Phone,
      customerData.Notes,
      customerData.Fee || 0,
      customerData['Number of car'] || customerData.cars?.length || 1,
      customerData['start date'] || (() => {
        const now = new Date();
        const day = now.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
      })()
    ];
    return await this.run(sql, params);
  }

  async updateCustomer(customerID, updatedData) {
    if (this.isPostgres) {
      return await this.postgres.updateCustomer(customerID, updatedData);
    }
    
    const fields = Object.keys(updatedData).map(key => {
      // Handle column names with spaces
      if (key.includes(' ')) {
        return `\`${key}\` = ?`;
      }
      return `${key} = ?`;
    }).join(', ');
    const values = Object.values(updatedData);
    values.push(customerID);
    
    const sql = `UPDATE customers SET ${fields} WHERE CustomerID = ?`;
    return await this.run(sql, values);
  }

  async deleteCustomer(customerID) {
    if (this.isPostgres) {
      return await this.postgres.deleteCustomer(customerID);
    }
    return await this.run('DELETE FROM customers WHERE CustomerID = ? COLLATE NOCASE', [customerID]);
  }

  async searchCustomers(searchTerm) {
    if (!searchTerm) return await this.getCustomers();
    
    const sql = `SELECT * FROM customers 
                 WHERE (Name LIKE ? COLLATE NOCASE 
                    OR Villa LIKE ? COLLATE NOCASE 
                    OR CarPlates LIKE ? COLLATE NOCASE 
                    OR Phone LIKE ? COLLATE NOCASE) 
                 AND Status = ? 
                 ORDER BY Name COLLATE NOCASE`;
    const searchPattern = `%${searchTerm}%`;
    return await this.all(sql, [searchPattern, searchPattern, searchPattern, searchPattern, 'Active']);
  }

  // Wash history methods
  async getAllHistory() {
    if (this.isPostgres) {
      return await this.postgres.getAllHistory();
    }
    return await this.all('SELECT * FROM wash_history ORDER BY WashDate DESC');
  }

  async getHistoryForCar(carPlate) {
    return await this.all('SELECT * FROM wash_history WHERE CarPlate = ? COLLATE NOCASE ORDER BY WashDate DESC', [carPlate]);
  }

  async addHistoryRecord(historyData) {
    const sql = `INSERT INTO wash_history (WashID, CustomerID, CarPlate, WashDate, PackageType, Villa, WashTypePerformed, VisitNumberInWeek, WeekInCycle, Status, WorkerName) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      historyData.WashID || `WASH-${Date.now()}`,
      historyData.CustomerID,
      historyData.CarPlate,
      historyData.WashDate, // Keep original format (DD-MMM-YYYY)
      historyData.PackageType,
      historyData.Villa,
      historyData.WashTypePerformed,
      historyData.VisitNumberInWeek,
      historyData.WeekInCycle,
      historyData.Status,
      historyData.WorkerName
    ];
    return await this.run(sql, params);
  }

  // Workers methods
  async getWorkers() {
    if (this.isPostgres) {
      return await this.postgres.getWorkers();
    }
    return await this.all('SELECT * FROM workers WHERE Status = ? ORDER BY Name COLLATE NOCASE', ['Active']);
  }

  async addWorker(workerData) {
    const sql = `INSERT INTO workers (WorkerID, Name, Phone, Status, Specialization, HourlyRate) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
      workerData.WorkerID || `WORKER-${Date.now()}`,
      workerData.Name,
      workerData.Phone,
      workerData.Status || 'Active',
      workerData.Specialization,
      workerData.HourlyRate
    ];
    return await this.run(sql, params);
  }

  async deleteWorker(workerName) {
    return await this.run('UPDATE workers SET Status = ? WHERE Name = ? COLLATE NOCASE', ['Inactive', workerName]);
  }

  // Scheduled tasks methods
  async getScheduledTasks() {
    const tasks = await this.all('SELECT * FROM ScheduledTasks ORDER BY AppointmentDate, Time');
    console.log(`[DB] Retrieved ${tasks.length} tasks from ScheduledTasks`);
    
    // Log specific tasks for debugging
    const debugTasks = tasks.filter(task => task.CustomerID === 'CUST-002' || task.CustomerID === 'CUST-009');
    if (debugTasks.length > 0) {
      console.log(`[DB] Debug tasks for CUST-002/009:`);
      debugTasks.forEach(task => {
        console.log(`[DB] - ${task.CustomerID}: ${task.Day} ${task.Time} -> ${task.WorkerName} (locked: ${task.isLocked})`);
      });
    }
    
    return tasks;
  }

  async clearAndWriteSchedule(tasks) {
    console.log(`[DB] Starting transaction to save ${tasks.length} tasks to ScheduledTasks`);
    
    try {
      // Start transaction
      await this.run('BEGIN TRANSACTION');
      
      // Clear existing tasks
      await this.run('DELETE FROM ScheduledTasks');
      console.log(`[DB] Cleared all existing tasks`);
      
      // Insert new tasks
      for (const task of tasks) {
        const sql = `INSERT INTO ScheduledTasks (Day, AppointmentDate, Time, CustomerID, CustomerName, Villa, CarPlate, WashType, WorkerName, WorkerID, PackageType, isLocked, ScheduleDate) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
          task.day,
          formatDate(task.appointmentDate),
          formatTime(task.time),
          task.customerId,
          task.customerName,
          task.villa,
          task.carPlate,
          task.washType,
          task.workerName,
          task.workerId,
          task.packageType,
          task.isLocked || 'FALSE',
          formatDate(task.scheduleDate) || formatDate(new Date())
        ];
        
        await this.run(sql, params);
      }
      
      // Commit transaction
      await this.run('COMMIT');
      console.log(`[DB] Successfully committed ${tasks.length} tasks to ScheduledTasks`);
      
      // Verify the data was actually saved
      const allSavedTasks = await this.all('SELECT COUNT(*) as count FROM ScheduledTasks');
      console.log(`[DB] Verification - Total tasks in database: ${allSavedTasks[0].count}`);
      
    } catch (error) {
      // Rollback on error
      console.error(`[DB] Error during transaction, rolling back:`, error);
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // Invoices methods
  async getInvoices() {
    if (this.isPostgres) {
      return await this.postgres.getInvoices();
    }
    return await this.all('SELECT * FROM invoices ORDER BY CreatedAt DESC');
  }

  async addInvoice(invoiceData) {
    if (this.isPostgres) {
      return await this.postgres.addInvoice(invoiceData);
    }
    const sql = `INSERT INTO invoices (InvoiceID, Ref, CustomerID, CustomerName, Villa, InvoiceDate, DueDate, TotalAmount, Status, PaymentMethod, Start, End, Vehicle, PackageID, Services, Notes, CreatedBy, SubTotal, Phone, Payment, Subject) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      invoiceData.InvoiceID || `INV-${Date.now()}`,
      invoiceData.Ref,
      invoiceData.CustomerID,
      invoiceData.CustomerName,
      invoiceData.Villa,
      formatDate(invoiceData.InvoiceDate) || formatDate(new Date()),
      formatDate(invoiceData.DueDate),
      invoiceData.TotalAmount,
      invoiceData.Status || 'Pending',
      invoiceData.PaymentMethod,
      formatDate(invoiceData.Start),
      formatDate(invoiceData.End),
      invoiceData.Vehicle,
      invoiceData.PackageID,
      invoiceData.Services,
      invoiceData.Notes,
      invoiceData.CreatedBy,
      invoiceData.SubTotal,
      invoiceData.Phone,
      invoiceData.Payment,
      invoiceData.Subject
    ];
    return await this.run(sql, params);
  }

  async getNextInvoiceRef() {
    if (this.isPostgres) {
      return await this.postgres.getNextInvoiceRef();
    }
    
    try {
      const result = await this.all('SELECT Ref FROM invoices WHERE Ref LIKE ? ORDER BY Ref DESC LIMIT 1', ['GLOGO-%']);
      
      if (result.length === 0) {
        return 'GLOGO-2511055';
      }
      
      const lastRef = result[0].Ref;
      const match = lastRef.match(/GLOGO-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return `GLOGO-${nextNum}`;
      }
      
      return 'GLOGO-2511055';
    } catch (error) {
      console.error('Error getting next invoice ref:', error);
      return 'GLOGO-2511055';
    }
  }

  async updateInvoice(invoiceId, updateData) {
    if (this.isPostgres) {
      return await this.postgres.updateInvoice(invoiceId, updateData);
    }
    
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(invoiceId);
    
    const sql = `UPDATE invoices SET ${fields} WHERE InvoiceID = ?`;
    return await this.run(sql, values);
  }

  async deleteInvoice(invoiceId) {
    if (this.isPostgres) {
      return await this.postgres.deleteInvoice(invoiceId);
    }
    
    return await this.run('DELETE FROM invoices WHERE InvoiceID = ?', [invoiceId]);
  }

  // Users methods
  async findUserByUsername(username) {
    if (this.isPostgres) {
      return await this.postgres.findUserByUsername(username);
    }
    return await this.get('SELECT * FROM Users WHERE Username = ? COLLATE NOCASE', [username]);
  }

  async addUser(userData) {
    if (this.isPostgres) {
      return await this.postgres.addUser(userData);
    }
    
    const sql = `INSERT INTO Users (UserID, Username, Password, PlainPassword, Role, Status, CreatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      userData.UserID || `USER-${Date.now()}`,
      userData.username || userData.Username,
      userData.password || userData.Password,
      userData.plainPassword || userData.PlainPassword,
      userData.role || userData.Role,
      userData.Status || 'Active',
      userData.CreatedAt || formatDateTime(new Date())
    ];
    return await this.run(sql, params);
  }

  async getUsers() {
    if (this.isPostgres) {
      return await this.postgres.getUsers();
    }
    return await this.all('SELECT * FROM Users ORDER BY Username COLLATE NOCASE');
  }

  // Services methods
  async getServices() {
    if (this.isPostgres) {
      return await this.postgres.getServices();
    }
    return await this.all('SELECT * FROM Services WHERE Status = ? ORDER BY ServiceName COLLATE NOCASE', ['Active']);
  }

  async addService(serviceData) {
    if (this.isPostgres) {
      return await this.postgres.addService(serviceData);
    }
    const sql = `INSERT INTO Services (ServiceID, ServiceName, Price, Description, Status) 
                 VALUES (?, ?, ?, ?, ?)`;
    const params = [
      serviceData.ServiceID || `SRV-${Date.now()}`,
      serviceData.ServiceName,
      serviceData.Price,
      serviceData.Description,
      serviceData.Status || 'Active'
    ];
    return await this.run(sql, params);
  }

  // Audit log methods
  async addAuditLog(auditData) {
    const sql = `INSERT INTO ScheduleAuditLog (LogID, Timestamp, UserID, UserName, Action, CustomerID, CustomerName, Villa, CarPlate, Day, Time, OldWorker, NewWorker, OldWashType, NewWashType, ChangeReason) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      formatDateTime(new Date()),
      auditData.userId || auditData.UserID,
      auditData.userName || auditData.UserName,
      auditData.action || auditData.Action,
      auditData.customerID || auditData.CustomerID,
      auditData.customerName || auditData.CustomerName,
      auditData.villa || auditData.Villa,
      auditData.carPlate || auditData.CarPlate,
      auditData.day || auditData.Day,
      auditData.time || auditData.Time,
      auditData.oldWorker || auditData.OldWorker,
      auditData.newWorker || auditData.NewWorker,
      auditData.oldWashType || auditData.OldWashType,
      auditData.newWashType || auditData.NewWashType,
      auditData.changeReason || auditData.ChangeReason
    ];
    return await this.run(sql, params);
  }

  // Assignment methods for drag & drop
  async saveAssignment(assignmentData) {
    console.log('[DB] Saving assignment:', assignmentData);
    
    const sql = `INSERT OR REPLACE INTO assignments (taskId, customerName, carPlate, washDay, washTime, washType, assignedWorker, villa, isLocked, scheduleDate) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      assignmentData.taskId,
      assignmentData.customerName,
      assignmentData.carPlate,
      assignmentData.washDay || assignmentData.sourceDay,
      assignmentData.washTime || assignmentData.sourceTime,
      assignmentData.washType,
      assignmentData.assignedWorker || assignmentData.targetWorkerName,
      assignmentData.villa,
      assignmentData.isLocked || 'FALSE',
      formatDate(new Date())
    ];
    
    const result = await this.run(sql, params);
    console.log('[DB] Assignment saved successfully:', result);
    return result;
  }

  async getAssignments() {
    return await this.all('SELECT * FROM assignments ORDER BY washDay, washTime');
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseService();