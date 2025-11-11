const db = require('../../services/databaseService');
const { getCustomers, getInvoices } = require('../../services/googleSheetsService');

const getAvailableClients = async (req, res) => {
  try {
    const customers = await db.getCustomers();
    const invoices = await db.getInvoices();
    const activeCustomers = customers.filter(customer => customer.Status === 'Active');
    // Get current month invoices
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentMonthInvoices = invoices.filter(invoice => {
      const dateField = invoice.InvoiceDate || invoice.CreatedAt;
      if (!dateField) return false;
      
      const invoiceDate = new Date(dateField);
      const invoiceMonth = invoiceDate.getMonth() + 1;
      const invoiceYear = invoiceDate.getFullYear();
      
      return invoiceMonth === currentMonth && invoiceYear === currentYear;
    });
    
    // Separate available and invoiced clients
    const invoicedCustomerIDs = currentMonthInvoices.map(inv => inv.CustomerID);
    const availableClients = activeCustomers.filter(customer => !invoicedCustomerIDs.includes(customer.CustomerID));
    const invoicedClients = activeCustomers.filter(customer => invoicedCustomerIDs.includes(customer.CustomerID));
    
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
    res.json({ success: true, data: customers });
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
      
      console.log(`🗑️ Deleting ${autoAppointments.length} auto-generated appointments for customer ${id}`);
      
      // Delete auto-generated appointments
      for (const appointment of autoAppointments) {
        try {
          const customerID = appointment.customerId || appointment.CustomerID;
          const day = appointment.day || appointment.Day;
          const time = appointment.time || appointment.Time;
          const carPlate = appointment.carPlate || appointment.CarPlate || '';
          
          await db.deleteScheduledTask(customerID, day, time, carPlate);
        } catch (deleteError) {
          console.log(`⚠️ Failed to delete appointment for ${appointment.customerName}: ${deleteError.message}`);
        }
      }
      
      const manualCount = customerAppointments.length - autoAppointments.length;
      if (manualCount > 0) {
        console.log(`ℹ️ Preserved ${manualCount} manual appointments for customer ${id}`);
      }
      
    } catch (scheduleError) {
      console.log(`⚠️ Error cleaning up appointments: ${scheduleError.message}`);
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