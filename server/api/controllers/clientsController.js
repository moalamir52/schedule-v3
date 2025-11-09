const db = require('../../services/databaseService');

const getAvailableClients = async (req, res) => {
  try {
    console.log('[CLIENTS] Fetching available clients...');
    const customers = await db.getCustomers();
    console.log('[CLIENTS] Found', customers.length, 'customers');
    const invoices = await db.getInvoices();
    console.log('[CLIENTS] Found', invoices.length, 'invoices');
    const activeCustomers = customers.filter(customer => customer.status === 'Active' || customer.Status === 'Active');
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
    const invoicedCustomerIDs = currentMonthInvoices.map(inv => inv.customer_id || inv.CustomerID);
    const availableClients = activeCustomers.filter(customer => !invoicedCustomerIDs.includes(customer.customer_id || customer.CustomerID));
    const invoicedClients = activeCustomers.filter(customer => invoicedCustomerIDs.includes(customer.customer_id || customer.CustomerID));
    
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
    const customer = customers.find(c => c.customer_id === customerId || c.CustomerID === customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    console.log('Customer data:', customer);
    res.json(customer);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAvailableClients,
  getCustomerById
};