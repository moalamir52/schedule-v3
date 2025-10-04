const { getCustomers, getInvoices } = require('../../services/googleSheetsService');

const getAvailableClients = async (req, res) => {
  try {
    const customers = await getCustomers();
    const invoices = await getInvoices();
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get customers who have invoices this month
    const invoicedCustomers = invoices.filter(invoice => {
      const dateField = invoice.InvoiceDate || invoice.CreatedAt;
      if (!dateField) return false;
      
      const invoiceDate = new Date(dateField);
      const invoiceMonth = invoiceDate.getMonth() + 1;
      const invoiceYear = invoiceDate.getFullYear();
      
      return invoiceMonth === currentMonth && invoiceYear === currentYear;
    }).map(invoice => invoice.CustomerID);
    
    // Split customers into available and invoiced
    const availableClients = customers.filter(customer => 
      !invoicedCustomers.includes(customer.CustomerID)
    );
    
    const invoicedClients = customers.filter(customer => 
      invoicedCustomers.includes(customer.CustomerID)
    );
    
    res.json({
      success: true,
      availableClients,
      invoicedClients
    });
  } catch (error) {
    console.error('Error getting available clients:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAvailableClients
};