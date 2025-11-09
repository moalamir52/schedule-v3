const https = require('https');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

class SupabaseService {
  constructor() {
    console.log('✅ Supabase service initialized');
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
      const result = await this.request('GET', '/customers?status=eq.Active&order=customer_id');
      console.log('[SUPABASE] Found', result.length, 'customers');
      return result;
    } catch (error) {
      console.error('[SUPABASE] Error fetching customers:', error);
      throw error;
    }
  }

  async addCustomer(customerData) {
    const data = {
      customer_id: customerData.CustomerID || `CUST-${Date.now()}`,
      name: customerData.Name || customerData.CustomerName || 'Unknown Customer',
      villa: customerData.Villa,
      car_plates: customerData.CarPlates,
      package: customerData.Washman_Package,
      days: customerData.Days || customerData.WashDay,
      time: customerData.Time || customerData.WashTime,
      status: customerData.Status || 'Active',
      phone: customerData.Phone,
      notes: customerData.Notes,
      fee: customerData.Fee || 0,
      number_of_cars: customerData['Number of car'] || customerData.cars?.length || 1,
      start_date: customerData['start date'] || (() => {
        const now = new Date();
        const day = now.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
      })()
    };
    return await this.request('POST', '/customers', data);
  }

  async updateCustomer(customerID, updatedData) {
    return await this.request('PATCH', `/customers?customer_id=eq.${customerID}`, updatedData);
  }

  async deleteCustomer(customerID) {
    return await this.request('DELETE', `/customers?customer_id=eq.${customerID}`);
  }

  async searchCustomers(searchTerm) {
    if (!searchTerm) return await this.getCustomers();
    
    const path = `/customers?status=eq.Active&or=(name.ilike.%${searchTerm}%,villa.ilike.%${searchTerm}%,car_plates.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%)&order=name`;
    return await this.request('GET', path);
  }

  // Workers methods
  async getWorkers() {
    return await this.request('GET', '/workers?status=eq.Active&order=name');
  }

  async addWorker(workerData) {
    const data = {
      worker_id: workerData.WorkerID || `WORKER-${Date.now()}`,
      name: workerData.Name,
      job: workerData.Job,
      status: workerData.Status || 'Active'
    };
    return await this.request('POST', '/workers', data);
  }

  async deleteWorker(workerName) {
    return await this.request('PATCH', `/workers?name=eq.${workerName}`, { status: 'Inactive' });
  }

  // Scheduled tasks methods
  async getScheduledTasks() {
    const tasks = await this.request('GET', '/scheduled_tasks?order=appointment_date,time');
    console.log(`[SUPABASE] Retrieved ${tasks.length} tasks from scheduled_tasks`);
    return tasks;
  }

  async clearAndWriteSchedule(tasks) {
    console.log(`[SUPABASE] Starting to save ${tasks.length} tasks to scheduled_tasks`);
    
    try {
      // Clear existing tasks
      await this.request('DELETE', '/scheduled_tasks');
      console.log(`[SUPABASE] Cleared all existing tasks`);
      
      // Insert new tasks in batches
      const batchSize = 100;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize).map(task => ({
          day: task.day,
          appointment_date: task.appointmentDate,
          time: task.time,
          customer_id: task.customerId,
          customer_name: task.customerName,
          villa: task.villa,
          car_plate: task.carPlate,
          wash_type: task.washType,
          worker_name: task.workerName,
          worker_id: task.workerId,
          package_type: task.packageType,
          is_locked: task.isLocked || 'FALSE',
          schedule_date: task.scheduleDate || new Date().toISOString().split('T')[0]
        }));
        
        await this.request('POST', '/scheduled_tasks', batch);
      }
      
      console.log(`[SUPABASE] Successfully saved ${tasks.length} tasks to scheduled_tasks`);
      
    } catch (error) {
      console.error(`[SUPABASE] Error during schedule save:`, error);
      throw error;
    }
  }

  // Invoices methods
  async getInvoices() {
    return await this.request('GET', '/invoices?order=created_at.desc');
  }

  close() {
    // No connection to close for REST API
  }
}

module.exports = new SupabaseService();