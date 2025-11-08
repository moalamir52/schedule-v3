const db = require('../../services/databaseService');
const { getCustomers, getInvoices } = require('../../services/googleSheetsService');

const getAvailableClients = async (req, res) => {
  try {
    console.log('[CLIENTS] Fetching available clients...');
    const customers = await db.getCustomers();
    console.log('[CLIENTS] Found', customers.length, 'customers');
    const invoices = await db.getInvoices();
    console.log('[CLIENTS] Found', invoices.length, 'invoices');
    const activeCustomers = customers.filter(customer => customer.Status === 'Active');
    console.log('[CLIENTS] Found', activeCustomers.length, 'active customers');
    
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
    
    console.log('[CLIENTS] Available clients:', availableClients.length);
    console.log('[CLIENTS] Invoiced clients:', invoicedClients.length);
    
    res.json({
      success: true,
      availableClients,
      invoicedClients
    });
    
  } catch (error) {
    console.error('[CLIENTS] Error getting available clients:', error);
    console.error('[CLIENTS] Stack trace:', error.stack);
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
    
    console.log('Customer data:', customer);
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
    const result = await db.addCustomer(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.updateCustomer(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteCustomer(id);
    res.json({ success: true, data: result });
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