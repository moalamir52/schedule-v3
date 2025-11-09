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
      const result = await this.request('GET', '/customers?status=eq.Active&order=customer_id');
      console.log('[SUPABASE] Found', result.length, 'customers');
      
      // Convert snake_case to camelCase for compatibility
      return result.map(customer => ({
        CustomerID: customer.customer_id,
        Name: customer.name,
        Villa: customer.villa,
        CarPlates: customer.car_plates,
        Washman_Package: customer.package,
        Days: customer.days,
        Time: customer.time,
        Status: customer.status,
        Phone: customer.phone,
        Email: customer.email,
        Notes: customer.notes,
        Fee: customer.fee,
        'Number of car': customer.number_of_cars,
        'start date': customer.start_date
      }));
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
      start_date: customerData['start date'] || new Date().toLocaleDateString()
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
      console.error('[SUPABASE] Error fetching services:', error);
      return [];
    }
  }
}

module.exports = new SupabaseService();