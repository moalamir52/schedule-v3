const { getCustomers } = require('../../services/googleSheetsService');
const { getInvoices } = require('../../services/googleSheetsService');

const getAvailableClients = async (req, res) => {
  try {
    const customers = await getCustomers();
    const invoices = await getInvoices();
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
    const customers = await getCustomers();
    
    const customer = customers.find(c => c.CustomerID === customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    console.log('Customer data:', customer); // Debug log
    res.json(customer);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAvailableClients,
  getCustomerById
};