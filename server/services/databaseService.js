



class DatabaseService {
  constructor() {
    this.init();
  }

  init() {
    console.log('🚀 Initializing Supabase database service...');
    this.supabase = require('./supabaseService');
    console.log('✅ Supabase service initialized');
  }



  // Customers methods
  async getCustomers() {
    console.log('[DB] Using Supabase for customers');
    return await this.supabase.getCustomers();
  }

  async addCustomer(customerData) {
    return await this.supabase.addCustomer(customerData);
  }

  async updateCustomer(customerID, updatedData) {
    return await this.supabase.updateCustomer(customerID, updatedData);
  }

  async deleteCustomer(customerID) {
    return await this.supabase.deleteCustomer(customerID);
  }

  async searchCustomers(searchTerm) {
    if (!searchTerm) return await this.getCustomers();
    return await this.supabase.searchCustomers(searchTerm);
  }

  // Wash history methods
  async getAllHistory() {
    return await this.supabase.getAllHistory();
  }

  async getHistoryForCar(carPlate) {
    return await this.supabase.getHistoryForCar(carPlate);
  }

  async addHistoryRecord(historyData) {
    return await this.supabase.addHistoryRecord(historyData);
  }

  // Workers methods
  async getWorkers() {
    try {
      return await this.supabase.getWorkers();
    } catch (error) {
      console.error('[DB] Error fetching workers:', error);
      return [];
    }
  }

  async addWorker(workerData) {
    return await this.supabase.addWorker(workerData);
  }

  async deleteWorker(workerName) {
    return await this.supabase.deleteWorker(workerName);
  }

  // Scheduled tasks methods
  async getScheduledTasks() {
    try {
      console.log('[DB] Fetching ScheduledTasks from Supabase...');
      const tasks = await this.supabase.request('GET', '/ScheduledTasks?order=AppointmentDate.asc,Time.asc');
      console.log(`[DB] Retrieved ${tasks.length} tasks from ScheduledTasks`);
      if (tasks.length > 0) {
        console.log('[DB] Sample task:', tasks[0]);
      }
      return tasks;
    } catch (error) {
      console.log(`[DB] Error fetching ScheduledTasks:`, error.message);
      // Try without ordering
      try {
        console.log('[DB] Trying without ordering...');
        const tasks = await this.supabase.request('GET', '/ScheduledTasks');
        console.log(`[DB] Retrieved ${tasks.length} tasks without ordering`);
        return tasks;
      } catch (error2) {
        console.log(`[DB] Second attempt failed:`, error2.message);
        return [];
      }
    }
  }

  async clearAndWriteSchedule(tasks) {
    return await this.supabase.clearAndWriteSchedule(tasks);
  }

  // Invoices methods
  async getInvoices() {
    return await this.supabase.getInvoices();
  }

  async addInvoice(invoiceData) {
    return await this.supabase.addInvoice(invoiceData);
  }

  async getNextInvoiceRef() {
    try {
      const invoices = await this.supabase.getInvoices();
      const glogoInvoices = invoices.filter(inv => inv.Ref && inv.Ref.startsWith('GLOGO-'));
      
      if (glogoInvoices.length === 0) {
        return 'GLOGO-2511055';
      }
      
      const lastRef = glogoInvoices.sort((a, b) => b.Ref.localeCompare(a.Ref))[0].Ref;
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
    return await this.supabase.request('PATCH', `/invoices?InvoiceID=eq.${invoiceId}`, updateData);
  }

  async deleteInvoice(invoiceId) {
    return await this.supabase.request('DELETE', `/invoices?InvoiceID=eq.${invoiceId}`);
  }

  // Users methods
  async findUserByUsername(username) {
    const result = await this.supabase.request('GET', `/Users?Username=eq.${username}`);
    return result && result.length > 0 ? result[0] : null;
  }

  async addUser(userData) {
    const data = {
      UserID: userData.UserID || `USER-${Date.now()}`,
      Username: userData.username || userData.Username,
      Password: userData.password || userData.Password,
      PlainPassword: userData.plainPassword || userData.PlainPassword,
      Role: userData.role || userData.Role,
      Status: userData.Status || 'Active',
      CreatedAt: userData.CreatedAt || new Date().toISOString()
    };
    return await this.supabase.request('POST', '/Users', data);
  }

  async getUsers() {
    return await this.supabase.request('GET', '/Users?order=Username');
  }

  // Services methods
  async getServices() {
    process.stdout.write('[DB] getServices called\n');
    try {
      const result = await this.supabase.getServices();
      process.stdout.write(`[DB] getServices result: ${result.length}\n`);
      return result;
    } catch (error) {
      process.stderr.write(`[DB] getServices error: ${error.message}\n`);
      throw error;
    }
  }

  async addService(serviceData) {
    return await this.supabase.addService(serviceData);
  }

  // Audit log methods
  async addAuditLog(auditData) {
    return await this.supabase.addAuditLog(auditData);
  }

  // Assignment methods for drag & drop
  async saveAssignment(assignmentData) {
    return await this.supabase.saveAssignment(assignmentData);
  }

  async getAssignments() {
    return await this.supabase.getAssignments();
  }

  close() {
    // Supabase connections are handled automatically
  }
}

module.exports = new DatabaseService();