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

  async rpc(name, params) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
        port: 443,
        path: `/rest/v1/rpc/${name}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      };

      if (params) {
        const postData = JSON.stringify(params);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
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

      if (params) {
        req.write(JSON.stringify(params));
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
      'start date': customerData['start date'] || (() => {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
      })()
    };
    return await this.request('POST', '/customers', data);
  }

  // Update customer
  async updateCustomer(customerID, updatedData) {
    try {
      console.log(`[SUPABASE] Updating customer ${customerID} with data:`, updatedData);
      const result = await this.request('PATCH', `/customers?CustomerID=eq.${customerID}`, updatedData);
      console.log(`[SUPABASE] Customer update result:`, result);
      return result;
    } catch (error) {
      console.error(`[SUPABASE] Error updating customer ${customerID}:`, error);
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(customerID) {
    try {
      console.log(`[SUPABASE] Deleting customer ${customerID}`);
      const result = await this.request('DELETE', `/customers?CustomerID=eq.${customerID}`);
      console.log(`[SUPABASE] Customer delete result:`, result);
      return result;
    } catch (error) {
      console.error(`[SUPABASE] Error deleting customer ${customerID}:`, error);
      throw error;
    }
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
    console.log('[SUPABASE] Adding invoice with data:', invoiceData);
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
    console.log('[SUPABASE] Prepared invoice data for database:', data);
    const result = await this.request('POST', '/invoices', data);
    console.log('[SUPABASE] Invoice saved successfully:', result);
    return result;
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

  async getUsers() {
    try {
      const result = await this.request('GET', '/Users?order=Username');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching users:', error);
      return [];
    }
  }

  async addUser(userData) {
    try {
      const data = {
        UserID: userData.UserID || `USER-${Date.now()}`,
        Username: userData.Username || userData.username,
        Password: userData.Password || userData.password,
        PlainPassword: userData.PlainPassword || userData.plainPassword,
        Role: userData.Role || userData.role || 'User',
        Status: userData.Status || 'Active'
      };
      return await this.request('POST', '/Users', data);
    } catch (error) {
      console.error('[SUPABASE] Error adding user:', error);
      throw error;
    }
  }

  async deleteUser(userID) {
    try {
      return await this.request('DELETE', `/Users?UserID=eq.${userID}`);
    } catch (error) {
      console.error('[SUPABASE] Error deleting user:', error);
      throw error;
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
      console.log(`[SUPABASE] Updating schedule with ${tasks.length} tasks...`);
      
      // Get existing locked tasks to preserve them
      let lockedTasks = [];
      try {
        console.log('[SUPABASE] Getting locked tasks to preserve...');
        lockedTasks = await this.request('GET', '/ScheduledTasks?isLocked=eq.TRUE');
        console.log(`[SUPABASE] Found ${lockedTasks.length} locked tasks to preserve`);
      } catch (error) {
        console.log('[SUPABASE] Failed to get locked tasks:', error.message);
      }
      
      // Clear only unlocked tasks
      try {
        console.log('[SUPABASE] Clearing unlocked tasks...');
        await this.request('DELETE', '/ScheduledTasks?isLocked=neq.TRUE');
        console.log('[SUPABASE] Unlocked tasks cleared successfully');
      } catch (deleteError) {
        console.log('[SUPABASE] Failed to clear unlocked tasks:', deleteError.message);
        throw deleteError;
      }
      
      if (tasks.length === 0) {
        console.log('[SUPABASE] No new tasks to insert');
        console.log(`[SUPABASE] Schedule update complete - ${lockedTasks.length} locked tasks preserved`);
        return;
      }
      
      // Filter out tasks that would duplicate existing locked tasks
      const newTasks = tasks.filter(newTask => {
        return !lockedTasks.some(lockedTask => 
          lockedTask.CustomerID === newTask.customerId &&
          lockedTask.Day === newTask.day &&
          lockedTask.Time === newTask.time &&
          lockedTask.CarPlate === (newTask.carPlate || '')
        );
      });
      
      console.log(`[SUPABASE] Filtered ${tasks.length} new tasks to ${newTasks.length} (avoiding ${tasks.length - newTasks.length} duplicates with locked tasks)`);
      
      if (newTasks.length === 0) {
        console.log('[SUPABASE] No new tasks to insert after filtering');
        console.log(`[SUPABASE] Schedule update complete - ${lockedTasks.length} locked tasks preserved`);
        return;
      }
      
      // Prepare batch data
      const batchData = newTasks.map(task => ({
        Day: task.day,
        AppointmentDate: task.appointmentDate || '',
        Time: task.time,
        CustomerID: task.customerId,
        CustomerName: task.customerName,
        Villa: task.villa,
        CarPlate: task.carPlate || '',
        WashType: task.washType,
        WorkerName: task.workerName,
        WorkerID: task.workerId,
        PackageType: task.packageType || '',
        isLocked: task.isLocked || 'FALSE',
        ScheduleDate: task.scheduleDate || new Date().toISOString().split('T')[0]
      }));
      
      // Insert all tasks in one batch
      console.log('[SUPABASE] Inserting new tasks in batch...');
      await this.request('POST', '/ScheduledTasks', batchData);
      
      console.log(`[SUPABASE] Successfully saved ${newTasks.length} new tasks + ${lockedTasks.length} preserved locked tasks = ${newTasks.length + lockedTasks.length} total tasks`);
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

  // Save assignment - Update ScheduledTasks table and lock all customer cars
  async saveAssignment(assignmentData) {
    try {
      console.log('[DRAG-DROP] Saving assignment:', assignmentData);
      
      // Parse taskId to get filter parameters
      const taskId = assignmentData.taskId;
      const dashes = [];
      for (let i = 0; i < taskId.length; i++) {
        if (taskId[i] === '-') dashes.push(i);
      }
      
      if (dashes.length >= 3) {
        const dayStart = dashes[dashes.length - 3] + 1;
        const timeStart = dashes[dashes.length - 2] + 1;
        const carPlateStart = dashes[dashes.length - 1] + 1;
        
        const customerID = taskId.substring(0, dashes[dashes.length - 3]);
        const day = taskId.substring(dayStart, dashes[dashes.length - 2]);
        const time = taskId.substring(timeStart, dashes[dashes.length - 1]);
        const carPlate = taskId.substring(carPlateStart) || '';
        
        // Update data for worker assignment
        const updateData = {
          WorkerName: assignmentData.assignedWorker || assignmentData.targetWorkerName,
          WorkerID: (assignmentData.targetWorkerId || 'WORKER-001').replace('WORKER-', 'WORK-'),
          isLocked: 'TRUE'
        };
        
        console.log(`[DRAG-DROP] Updating customer ${customerID} tasks:`);
        console.log(`[DRAG-DROP] Old worker: ${assignmentData.sourceWorkerName || 'Unknown'}`);
        console.log(`[DRAG-DROP] New worker: ${updateData.WorkerName}`);
        
        // Update ALL tasks for this customer (all cars) with same worker and lock them
        const filter = `CustomerID=eq.${encodeURIComponent(customerID)}&Day=eq.${encodeURIComponent(day)}&Time=eq.${encodeURIComponent(time)}`;
        console.log(`[DRAG-DROP] Updating all cars for customer: ${filter}`);
        console.log(`[DRAG-DROP] Update data:`, updateData);
        
        try {
          const result = await this.request('PATCH', `/ScheduledTasks?${filter}`, updateData);
          console.log(`[DRAG-DROP] ✅ Database updated successfully:`, result);
          
          // Auto-lock all customer cars
          await this.lockAllCustomerCars(customerID, day, time);
          
          // Verify the update worked
          const verification = await this.request('GET', `/ScheduledTasks?${filter}`);
          console.log(`[DRAG-DROP] 🔍 Verification - Updated records:`, verification.length);
          if (verification.length > 0) {
            console.log(`[DRAG-DROP] 🔍 Sample updated record:`, verification[0]);
          }
          
          return result;
        } catch (updateError) {
          console.error(`[DRAG-DROP] ❌ Database update failed:`, updateError);
          throw updateError;
        }
        
        // Add audit log for the change
        try {
          await this.addAuditLog({
            userId: assignmentData.userId || 'SYSTEM',
            userName: assignmentData.userName || 'System User',
            action: 'WORKER_REASSIGNMENT_ALL_CARS',
            customerID: customerID,
            customerName: assignmentData.customerName,
            villa: assignmentData.villa,
            carPlate: 'ALL_CARS',
            day: day,
            time: time,
            oldWorker: assignmentData.sourceWorkerName || 'Unknown',
            newWorker: updateData.WorkerName,
            changeReason: 'Drag and Drop Assignment - All Customer Cars'
          });
          console.log('[DRAG-DROP] 📝 Audit log created for all cars');
        } catch (auditError) {
          console.warn('[DRAG-DROP] ⚠️ Failed to create audit log:', auditError.message);
        }
        
        console.log('[DRAG-DROP] ✅ All customer cars assigned and locked');
        return result;
      } else {
        throw new Error(`Invalid taskId format: ${taskId}`);
      }
    } catch (error) {
      console.error('[DRAG-DROP] ❌ Error saving assignment:', error);
      throw error;
    }
  }

  // Get assignments - Use ScheduledTasks table instead
  async getAssignments() {
    try {
      const result = await this.request('GET', '/ScheduledTasks?order=Day,Time');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching assignments:', error);
      return [];
    }
  }

  // Lock all customer cars
  async lockAllCustomerCars(customerID, day, time) {
    try {
      console.log(`[AUTO-LOCK] Locking all cars for customer ${customerID} on ${day} at ${time}`);
      
      const filter = `CustomerID=eq.${encodeURIComponent(customerID)}&Day=eq.${encodeURIComponent(day)}&Time=eq.${encodeURIComponent(time)}`;
      const updateData = { isLocked: 'TRUE' };
      
      await this.request('PATCH', `/ScheduledTasks?${filter}`, updateData);
      console.log(`[AUTO-LOCK] ✅ All customer cars locked`);
    } catch (error) {
      console.warn(`[AUTO-LOCK] ⚠️ Failed to lock customer cars:`, error.message);
    }
  }

  // Update wash type
  async updateWashType(washTypeData) {
    try {
      console.log('[WASH-TYPE] Updating wash type:', washTypeData);
      
      // Parse taskId to get filter parameters
      const taskId = washTypeData.taskId;
      const dashes = [];
      for (let i = 0; i < taskId.length; i++) {
        if (taskId[i] === '-') dashes.push(i);
      }
      
      if (dashes.length >= 3) {
        const dayStart = dashes[dashes.length - 3] + 1;
        const timeStart = dashes[dashes.length - 2] + 1;
        const carPlateStart = dashes[dashes.length - 1] + 1;
        
        const customerID = taskId.substring(0, dashes[dashes.length - 3]);
        const day = taskId.substring(dayStart, dashes[dashes.length - 2]);
        const time = taskId.substring(timeStart, dashes[dashes.length - 1]);
        const carPlate = taskId.substring(carPlateStart) || '';
        
        const filter = `CustomerID=eq.${encodeURIComponent(customerID)}&Day=eq.${encodeURIComponent(day)}&Time=eq.${encodeURIComponent(time)}&CarPlate=eq.${encodeURIComponent(carPlate)}`;
        
        // Get current task to preserve WorkerID format
        const currentTask = await this.request('GET', `/ScheduledTasks?${filter}`);
        let workerID = 'WORK-001'; // default
        if (currentTask && currentTask.length > 0 && currentTask[0].WorkerID) {
          workerID = currentTask[0].WorkerID.replace('WORKER-', 'WORK-');
        }
        
        // Update only this specific task
        const updateData = {
          WashType: washTypeData.newWashType,
          WorkerID: workerID,
          isLocked: 'TRUE'
        };
        console.log(`[WASH-TYPE] Updating task: ${filter}`);
        console.log(`[WASH-TYPE] Update data:`, updateData);
        
        const result = await this.request('PATCH', `/ScheduledTasks?${filter}`, updateData);
        console.log(`[WASH-TYPE] ✅ Wash type updated successfully`);
        
        // Auto-lock all customer cars
        await this.lockAllCustomerCars(customerID, day, time);
        
        // Add audit log
        try {
          await this.addAuditLog({
            userId: washTypeData.userId || 'SYSTEM',
            userName: washTypeData.userName || 'System User',
            action: 'WASH_TYPE_CHANGE',
            customerID: customerID,
            carPlate: carPlate,
            day: day,
            time: time,
            oldWashType: 'Unknown',
            newWashType: washTypeData.newWashType,
            changeReason: 'Manual Wash Type Change'
          });
          console.log('[WASH-TYPE] 📝 Audit log created');
        } catch (auditError) {
          console.warn('[WASH-TYPE] ⚠️ Failed to create audit log:', auditError.message);
        }
        
        return result;
      } else {
        throw new Error(`Invalid taskId format: ${taskId}`);
      }
    } catch (error) {
      console.error('[WASH-TYPE] ❌ Error updating wash type:', error);
      throw error;
    }
  }

  // Update scheduled task
  async updateScheduledTask(customerID, day, time, carPlate, updateData) {
    try {
      const filter = `CustomerID=eq.${customerID}&Day=eq.${day}&Time=eq.${time}&CarPlate=eq.${carPlate || ''}`;
      console.log(`[SUPABASE] Updating task: ${filter}`);
      const result = await this.request('PATCH', `/ScheduledTasks?${filter}`, updateData);
      console.log(`[SUPABASE] Task updated successfully`);
      return result;
    } catch (error) {
      console.error('[SUPABASE] Error updating task:', error);
      throw error;
    }
  }

  // Delete scheduled task
  async deleteScheduledTask(customerID, day, time, carPlate) {
    try {
      const encodedFilter = `CustomerID=eq.${encodeURIComponent(customerID)}&Day=eq.${encodeURIComponent(day)}&Time=eq.${encodeURIComponent(time)}&CarPlate=eq.${encodeURIComponent(carPlate || '')}`;
      console.log(`[SUPABASE] Deleting task: ${customerID} - ${day} - ${time} - ${carPlate}`);
      const result = await this.request('DELETE', `/ScheduledTasks?${encodedFilter}`);
      console.log(`[SUPABASE] Task deleted successfully`);
      return result;
    } catch (error) {
      console.error('[SUPABASE] Error deleting task:', error);
      throw error;
    }
  }

  // Delete multiple scheduled tasks by IDs
  async deleteScheduledTasks(taskIds) {
    try {
      console.log(`[SUPABASE] Deleting ${taskIds.length} tasks...`);
      
      for (const taskId of taskIds) {
        try {
          // Parse taskId format: CustomerID-Day-Time-CarPlate
          // Example: CUST-019-Monday-10:00 AM-Jeep
          const dashes = [];
          for (let i = 0; i < taskId.length; i++) {
            if (taskId[i] === '-') dashes.push(i);
          }
          
          if (dashes.length >= 3) {
            const dayStart = dashes[dashes.length - 3] + 1;
            const timeStart = dashes[dashes.length - 2] + 1;
            const carPlateStart = dashes[dashes.length - 1] + 1;
            
            const customerID = taskId.substring(0, dashes[dashes.length - 3]);
            const day = taskId.substring(dayStart, dashes[dashes.length - 2]);
            const time = taskId.substring(timeStart, dashes[dashes.length - 1]);
            const carPlate = taskId.substring(carPlateStart) || '';
            
            await this.deleteScheduledTask(customerID, day, time, carPlate);
          }
        } catch (error) {
          console.error(`[SUPABASE] Failed to delete task ${taskId}:`, error.message);
        }
      }
      
      console.log(`[SUPABASE] Successfully deleted ${taskIds.length} tasks`);
    } catch (error) {
      console.error('[SUPABASE] Error deleting tasks:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();