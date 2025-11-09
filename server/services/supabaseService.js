const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

class SupabaseService {
  constructor() {
    console.log('✅ Supabase service initialized');
    console.log('🔗 URL:', SUPABASE_URL);
  }

  async request(method, path, data = null) {
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
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
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

  // Customers methods
  async getCustomers() {
    try {
      console.log('[SUPABASE] Fetching customers...');
      const result = await this.request('GET', '/customers?Status=eq.Active&order=CustomerID');
      console.log('[SUPABASE] Found', result.length, 'customers');
      return result;
    } catch (error) {
      console.error('[SUPABASE] Error fetching customers:', error);
      return [];
    }
  }

  // Workers methods
  async getWorkers() {
    try {
      console.log('[SUPABASE] Fetching workers...');
      const result = await this.request('GET', '/Workers?Status=eq.Active&order=Name');
      console.log('[SUPABASE] Found', result.length, 'workers');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching workers:', error);
      return [];
    }
  }

  // Add customer
  async addCustomer(customerData) {
    const data = {
      CustomerID: customerData.CustomerID || `CUST-${Date.now()}`,
      Name: customerData.Name || customerData.CustomerName || 'Unknown Customer',
      Villa: customerData.Villa,
      CarPlates: customerData.CarPlates,
      Washman_Package: customerData.Washman_Package,
      Days: customerData.Days || customerData.WashDay,
      Time: customerData.Time || customerData.WashTime,
      Status: customerData.Status || 'Active',
      Phone: customerData.Phone,
      Notes: customerData.Notes,
      Fee: customerData.Fee || 0,
      'Number of car': customerData['Number of car'] || customerData.cars?.length || 1,
      'start date': customerData['start date'] || new Date().toLocaleDateString()
    };
    return await this.request('POST', '/customers', data);
  }

  // Update customer
  async updateCustomer(customerID, updatedData) {
    return await this.request('PATCH', `/customers?customer_id=eq.${customerID}`, updatedData);
  }

  // Delete customer
  async deleteCustomer(customerID) {
    return await this.request('DELETE', `/customers?customer_id=eq.${customerID}`);
  }

  // Add worker
  async addWorker(workerData) {
    const data = {
      worker_id: workerData.WorkerID || `WORKER-${Date.now()}`,
      name: workerData.Name,
      job: workerData.Job,
      status: workerData.Status || 'Active'
    };
    return await this.request('POST', '/workers', data);
  }

  // Invoices methods
  async getInvoices() {
    try {
      const result = await this.request('GET', '/invoices?order=CreatedAt.desc');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching invoices:', error);
      return [];
    }
  }

  // Add invoice
  async addInvoice(invoiceData) {
    const data = {
      InvoiceID: invoiceData.InvoiceID || `INV-${Date.now()}`,
      Ref: invoiceData.Ref,
      CustomerID: invoiceData.CustomerID,
      CustomerName: invoiceData.CustomerName,
      Villa: invoiceData.Villa,
      DueDate: invoiceData.DueDate,
      TotalAmount: invoiceData.TotalAmount,
      Status: invoiceData.Status || 'Pending',
      PaymentMethod: invoiceData.PaymentMethod,
      Start: invoiceData.Start,
      End: invoiceData.End,
      Vehicle: invoiceData.Vehicle,
      PackageID: invoiceData.PackageID,
      Notes: invoiceData.Notes,
      CreatedBy: invoiceData.CreatedBy,
      CreatedAt: invoiceData.CreatedAt || new Date().toISOString(),
      Services: invoiceData.Services
    };
    return await this.request('POST', '/invoices', data);
  }

  // History methods
  async getAllHistory() {
    try {
      const result = await this.request('GET', '/wash_history?order=WashDate.desc');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching history:', error);
      return [];
    }
  }

  // Add history record
  async addHistoryRecord(historyData) {
    const data = {
      WashID: historyData.WashID || `WASH-${Date.now()}`,
      CustomerID: historyData.CustomerID,
      CarPlate: historyData.CarPlate,
      WashDate: historyData.WashDate,
      PackageType: historyData.PackageType,
      Villa: historyData.Villa,
      WashTypePerformed: historyData.WashTypePerformed,
      VisitNumberInWeek: historyData.VisitNumberInWeek,
      WeekInCycle: historyData.WeekInCycle,
      Status: historyData.Status,
      WorkerName: historyData.WorkerName
    };
    return await this.request('POST', '/wash_history', data);
  }

  // Users methods
  async findUserByUsername(username) {
    try {
      const result = await this.request('GET', `/Users?Username=eq.${username}`);
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('[SUPABASE] Error finding user:', error);
      return null;
    }
  }

  // Services methods
  async getServices() {
    try {
      const result = await this.request('GET', '/Services?Status=eq.Active&order=ServiceName');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.log('[SUPABASE] Services table not found, returning default services');
      return [
        { ServiceID: 'SERV-001', ServiceName: 'Car Wash - Exterior', Price: 25, Status: 'Active' },
        { ServiceID: 'SERV-002', ServiceName: 'Car Wash - Interior', Price: 35, Status: 'Active' },
        { ServiceID: 'SERV-003', ServiceName: 'Car Wash - Full Service', Price: 50, Status: 'Active' }
      ];
    }
  }

  // Add service
  async addService(serviceData) {
    try {
      const data = {
        ServiceID: serviceData.ServiceID,
        ServiceName: serviceData.ServiceName,
        Price: serviceData.Price || 0,
        Description: serviceData.Description || '',
        Status: serviceData.Status || 'Active'
      };
      return await this.request('POST', '/Services', data);
    } catch (error) {
      console.log('[SUPABASE] Services table not available for adding');
      throw new Error('Services functionality not available');
    }
  }

  // Search customers
  async searchCustomers(searchTerm) {
    try {
      const result = await this.request('GET', `/customers?or=(Name.ilike.%${searchTerm}%,Villa.ilike.%${searchTerm}%,CarPlates.ilike.%${searchTerm}%,Phone.ilike.%${searchTerm}%)&Status=eq.Active&order=Name`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error searching customers:', error);
      return [];
    }
  }

  // Get history for car
  async getHistoryForCar(carPlate) {
    try {
      const result = await this.request('GET', `/wash_history?CarPlate=eq.${carPlate}&order=WashDate.desc`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching car history:', error);
      return [];
    }
  }

  // Delete worker
  async deleteWorker(workerName) {
    return await this.request('PATCH', `/Workers?Name=eq.${workerName}`, { Status: 'Inactive' });
  }

  // Clear and write schedule
  async clearAndWriteSchedule(tasks) {
    try {
      // Clear existing tasks
      await this.request('DELETE', '/ScheduledTasks');
      
      // Insert new tasks
      for (const task of tasks) {
        const data = {
          Day: task.day,
          AppointmentDate: task.appointmentDate,
          Time: task.time,
          CustomerID: task.customerId,
          CustomerName: task.customerName,
          Villa: task.villa,
          CarPlate: task.carPlate,
          WashType: task.washType,
          WorkerName: task.workerName,
          WorkerID: task.workerId,
          PackageType: task.packageType,
          isLocked: task.isLocked || 'FALSE',
          ScheduleDate: task.scheduleDate || new Date().toISOString().split('T')[0]
        };
        await this.request('POST', '/ScheduledTasks', data);
      }
      
      console.log(`[SUPABASE] Successfully saved ${tasks.length} tasks`);
    } catch (error) {
      console.error('[SUPABASE] Error saving schedule:', error);
      throw error;
    }
  }

  // Add audit log
  async addAuditLog(auditData) {
    const data = {
      LogID: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      Timestamp: new Date().toISOString(),
      UserID: auditData.userId || auditData.UserID,
      UserName: auditData.userName || auditData.UserName,
      Action: auditData.action || auditData.Action,
      CustomerID: auditData.customerID || auditData.CustomerID,
      CustomerName: auditData.customerName || auditData.CustomerName,
      Villa: auditData.villa || auditData.Villa,
      CarPlate: auditData.carPlate || auditData.CarPlate,
      Day: auditData.day || auditData.Day,
      Time: auditData.time || auditData.Time,
      OldWorker: auditData.oldWorker || auditData.OldWorker,
      NewWorker: auditData.newWorker || auditData.NewWorker,
      OldWashType: auditData.oldWashType || auditData.OldWashType,
      NewWashType: auditData.newWashType || auditData.NewWashType,
      ChangeReason: auditData.changeReason || auditData.ChangeReason
    };
    return await this.request('POST', '/ScheduleAuditLog', data);
  }

  // Save assignment
  async saveAssignment(assignmentData) {
    const data = {
      taskId: assignmentData.taskId,
      customerName: assignmentData.customerName,
      carPlate: assignmentData.carPlate,
      washDay: assignmentData.washDay || assignmentData.sourceDay,
      washTime: assignmentData.washTime || assignmentData.sourceTime,
      washType: assignmentData.washType,
      assignedWorker: assignmentData.assignedWorker || assignmentData.targetWorkerName,
      villa: assignmentData.villa,
      isLocked: assignmentData.isLocked || 'FALSE',
      scheduleDate: new Date().toISOString().split('T')[0]
    };
    return await this.request('POST', '/assignments', data);
  }

  // Get assignments
  async getAssignments() {
    try {
      const result = await this.request('GET', '/assignments?order=washDay,washTime');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching assignments:', error);
      return [];
    }
  }
}

module.exports = new SupabaseService();