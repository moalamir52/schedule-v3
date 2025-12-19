const db = require('../../services/databaseService');
const { getCustomers, getInvoices } = require('../../services/googleSheetsService');

const getAvailableClients = async (req, res) => {
  try {
    const customers = await db.getCustomers();
    const invoices = await db.getInvoices();
    const activeCustomers = customers.filter(customer => customer.Status === 'Active');
    
    // Debug: Check if CUST-025 is in active customers
    const cust025 = activeCustomers.find(c => c.CustomerID === 'CUST-025');
    if (cust025) {
      console.log(`DEBUG: CUST-025 found in active customers`);
    } else {
      console.log(`DEBUG: CUST-025 NOT found in active customers`);
    }
    
    // Get current month invoices
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Helper to safely parse dates in formats like "2025-12-19" أو "19/12/2025"
    const parseInvoiceDate = (value) => {
      if (!value) return null;
      if (typeof value === 'string' && value.includes('/')) {
        const parts = value.split(/[\/\-]/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);
          if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
          if (year < 100) year += 2000;
          return new Date(year, month - 1, day);
        }
      }
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };
    
    // Helper to parse service end date in format "19/12/2025"
    const parseServiceDate = (dateStr) => {
      if (!dateStr) return null;
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month - 1, day);
          }
        }
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };
    
    // Helper to normalize strings (trim + lowercase)
    const normalize = (value) => (value || '').toString().trim().toLowerCase();

    // Helper to parse start date in formats like "19-Jan-25" or "19/01/2025"
    const parseStartDate = (startDateStr) => {
      if (!startDateStr) return null;
      
      // Handle format like "19-Jan-25"
      if (typeof startDateStr === 'string' && startDateStr.includes('-')) {
        const parts = startDateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthStr = parts[1];
          let year = parseInt(parts[2], 10);
          
          // Convert month name to number
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = months.indexOf(monthStr);
          
          if (monthIndex !== -1 && !isNaN(day) && !isNaN(year)) {
            if (year < 100) year += 2000; // Convert 25 to 2025
            return new Date(year, monthIndex, day);
          }
        }
      }
      
      // Fallback to standard date parsing
      const d = new Date(startDateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    // Separate available and invoiced clients
    const availableClients = activeCustomers.filter(customer => {
      if (customer.CustomerID === 'CUST-025') {
        console.log(`DEBUG CUST-025: Starting filter check`);
      }
      // أولاً: تحقق من أن تاريخ بداية الخدمة جه أو فات
      const startDate = parseStartDate(customer['start date']);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (startDate && startDate > today) {
        return false;
      }
      
      // ثانياً: ابحث عن آخر فاتورة للعميل
      const customerInvoices = invoices.filter(inv => {
        // Match by CustomerID first
        if (inv.CustomerID === customer.CustomerID) return true;
        
        // Fallback: match by Name + Villa
        const customerName = normalize(customer.Name || customer.CustomerName);
        const customerVilla = normalize(customer.Villa);
        const invoiceName = normalize(inv.CustomerName || inv.Name);
        const invoiceVilla = normalize(inv.Villa);
        return invoiceName === customerName && invoiceVilla === customerVilla;
      });
      
      if (customer.CustomerID === 'CUST-025') {
        console.log(`DEBUG CUST-025: Found ${customerInvoices.length} invoices`);
      }
      
      if (customerInvoices.length === 0) {
        return true;
      }
      
      // ابحث عن آخر فاتورة (بناءً على تاريخ الإنشاء)
      const latestInvoice = customerInvoices.reduce((latest, current) => {
        const latestDate = parseInvoiceDate(latest.CreatedAt || latest.InvoiceDate) || new Date(0);
        const currentDate = parseInvoiceDate(current.CreatedAt || current.InvoiceDate) || new Date(0);
        return currentDate > latestDate ? current : latest;
      });
      
      // تحقق من تاريخ انتهاء الخدمة في آخر فاتورة
      if (latestInvoice.End) {
        const serviceEndDate = parseServiceDate(latestInvoice.End);
        if (customer.CustomerID === 'CUST-025') {
          console.log(`DEBUG CUST-025: End=${latestInvoice.End}, Parsed=${serviceEndDate}, Today=${today}, Active=${serviceEndDate && serviceEndDate >= today}`);
        }
        if (serviceEndDate && serviceEndDate >= today) {
          return false;
        }
      }
      
      return true;
    });

    const invoicedClients = activeCustomers.filter(customer => !availableClients.includes(customer));
    

    
    res.json({
      success: true,
      availableClients,
      invoicedClients
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Get all customers from database
    const customers = await db.getCustomers();
    const customer = customers.find(c => c.CustomerID === customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json(customer);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllClients = async (req, res) => {
  try {
    const customers = await db.getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getNextCustomerId = async (req, res) => {
  try {
    const customers = await db.getCustomers();
    
    // Find highest customer number
    let maxNum = 0;
    customers.forEach(customer => {
      const match = customer.CustomerID?.match(/CUST-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    
    const nextId = `CUST-${String(maxNum + 1).padStart(3, '0')}`;
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    // Ensure all required fields are included
    const customerData = {
      ...req.body,
      Phone: req.body.Phone || req.body.phone || '',
      CarPlates: req.body.CarPlates || req.body.cars || req.body.Cars || '',
      'Number of car': req.body['Number of car'] || req.body.numberOfCars || 1,
      'start date': req.body['start date'] || req.body.startDate || (() => {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
      })()
    };
    
    const result = await db.addCustomer(customerData);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }
    
    // Prepare update data with proper field mapping
    const updateData = {
      Name: req.body.Name || req.body.name,
      Villa: req.body.Villa || req.body.villa,
      Phone: req.body.Phone || req.body.phone || '',
      CarPlates: req.body.CarPlates || req.body.cars || req.body.Cars || '',
      'Washman_Package': req.body['Washman_Package'] || req.body.package,
      Days: req.body.Days || req.body.days,
      Time: req.body.Time || req.body.time,
      Status: req.body.Status || req.body.status || 'Active',
      Fee: req.body.Fee || req.body.fee || 0,
      'Number of car': req.body['Number of car'] || req.body.numberOfCars || 1,
      'start date': req.body['start date'] || req.body.startDate || (() => {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
      })(),
      Notes: req.body.Notes || req.body.notes || ''
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const result = await db.updateCustomer(id, updateData);
    
    res.json({ success: true, data: result, message: 'Customer updated successfully' });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete customer's auto-generated appointments (preserve manual ones)
    try {
      const currentSchedule = await db.getScheduledTasks();
      const customerAppointments = currentSchedule.filter(task => 
        task.customerId === id || task.CustomerID === id
      );
      
      // Only delete auto-generated appointments (those with isLocked = 'FALSE')
      // Manual appointments have isLocked = 'TRUE' and should be preserved
      const autoAppointments = customerAppointments.filter(task => 
        task.isLocked === 'FALSE' || task.isLocked === false || !task.isLocked
      );
      
      // Delete auto-generated appointments
      for (const appointment of autoAppointments) {
        try {
          const customerID = appointment.customerId || appointment.CustomerID;
          const day = appointment.day || appointment.Day;
          const time = appointment.time || appointment.Time;
          const carPlate = appointment.carPlate || appointment.CarPlate || '';
          
          await db.deleteScheduledTask(customerID, day, time, carPlate);
        } catch (deleteError) {
          // Silent error handling
        }
      }
      
    } catch (scheduleError) {
      // Continue with customer deletion even if appointment cleanup fails
    }
    
    // Then delete the customer
    const result = await db.deleteCustomer(id);
    
    res.json({ 
      success: true, 
      data: result,
      message: 'Customer and auto-generated appointments deleted successfully. Manual appointments preserved.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAvailableClients,
  getCustomerById,
  getAllClients,
  getNextCustomerId,
  createClient,
  updateClient,
  deleteClient
};