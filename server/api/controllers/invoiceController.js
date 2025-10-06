const { addRowToSheet, getInvoices, addInvoiceRecord, deleteInvoiceRecord, getCustomers, updateInvoiceStatus, getOrCreateInvoiceNumber } = require('../../services/googleSheetsService');

const createInvoice = async (req, res) => {
  try {
    const {
      ref,
      clientName,
      villa,
      phone,
      packageId,
      vehicleType,
      serves,
      amount,
      paymentStatus,
      startDate,
      customerID,
      totalAmount,
      dueDate,
      notes
    } = req.body;

    const isRegularInvoice = customerID && customerID !== 'ONE_TIME';
    
    console.log('customerID:', customerID);
    console.log('isRegularInvoice:', isRegularInvoice);
    console.log('paymentStatus received:', paymentStatus);
    console.log('paymentStatus type:', typeof paymentStatus);
    console.log('paymentMethod received:', req.body.paymentMethod);
    
    let customerData = null;
    let billingCycle = null;
    
    if (isRegularInvoice) {
      // Check if customer already has invoice this month
      const existingInvoices = await getInvoices();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const existingInvoice = existingInvoices.find(invoice => {
        if (invoice.CustomerID !== customerID) return false;
        
        const invoiceDate = new Date(invoice.InvoiceDate || invoice.CreatedAt);
        const invoiceMonth = invoiceDate.getMonth() + 1;
        const invoiceYear = invoiceDate.getFullYear();
        
        return invoiceMonth === currentMonth && invoiceYear === currentYear;
      });
      
      if (existingInvoice) {
        throw new Error(`Customer already has an invoice for this month: ${existingInvoice.Ref || existingInvoice.InvoiceID}`);
      }
      
      const customers = await getCustomers();
      customerData = customers.find(c => c.CustomerID === customerID);
      
      if (!customerData) {
        throw new Error('Customer not found');
      }
      
      const startDateStr = customerData['start date'] || customerData.Start_Date || customerData['Start Date'] || customerData.StartDate;
      if (!startDateStr) {
        throw new Error('Customer start date not found');
      }
      
      const contractStartDate = new Date(startDateStr);
      if (isNaN(contractStartDate.getTime())) {
        throw new Error('Invalid customer start date');
      }
      
      console.log('Contract start date:', contractStartDate);
      console.log('Contract start day:', contractStartDate.getDate());
      
      const today = new Date();
      
      const monthsPassed = (today.getFullYear() - contractStartDate.getFullYear()) * 12 + 
                          (today.getMonth() - contractStartDate.getMonth());
      
      console.log('Months passed:', monthsPassed);
      
      const billingStartDate = new Date(contractStartDate.getFullYear(), contractStartDate.getMonth() + monthsPassed, contractStartDate.getDate());
      
      console.log('Calculated billing start date:', billingStartDate);
      console.log('Billing start day:', billingStartDate.getDate());
      
      const billingEndDate = new Date(billingStartDate);
      billingEndDate.setDate(billingEndDate.getDate() + 29);
      
      billingCycle = {
        startDate: billingStartDate,
        endDate: billingEndDate
      };
    }
    
    const invoiceData = {
      invoiceId: ref || (isRegularInvoice ? `REG-${Date.now()}` : `OT-${Date.now()}`),
      customerName: isRegularInvoice ? (customerData?.Name || customerData?.name || 'Unknown Customer') : (clientName || 'Walk-in Customer'),
      villa: isRegularInvoice ? (customerData?.Villa || customerData?.villa || 'N/A') : (villa || 'N/A'),
      phone: isRegularInvoice ? (customerData?.Phone || customerData?.phone || 'N/A') : (phone || 'N/A'),
      packageId: isRegularInvoice ? (customerData?.['Washman Package'] || customerData?.Washman_Package || 'Standard Package') : (packageId || 'One-Time Service'),
      vehicleType: isRegularInvoice ? (customerData?.['Car Type'] || customerData?.CarPlates || customerData?.CarType || 'N/A') : (vehicleType || 'N/A'),
      services: isRegularInvoice ? (customerData?.Serves || customerData?.serves || 'Car wash service') : (serves || 'Car wash service'),
      totalAmount: isRegularInvoice ? (totalAmount || customerData?.Fee || customerData?.fee) : amount,
      status: isRegularInvoice ? (paymentStatus === 'PAID' ? 'Paid' : 'Pending') : (paymentStatus === 'yes/cash' || paymentStatus === 'yes/bank' ? 'Paid' : 'Pending'),
      paymentMethod: isRegularInvoice ? (paymentStatus === 'PAID' ? (req.body.paymentMethod || 'Cash') : '') : (paymentStatus === 'yes/cash' ? 'Cash' : paymentStatus === 'yes/bank' ? 'Bank' : ''),
      invoiceDate: isRegularInvoice ? `${billingCycle.startDate.getFullYear()}-${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}-${String(billingCycle.startDate.getDate()).padStart(2, '0')}` : new Date().toISOString().split('T')[0],
      dueDate: isRegularInvoice ? `${billingCycle.endDate.getFullYear()}-${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}-${String(billingCycle.endDate.getDate()).padStart(2, '0')}` : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      serviceDate: isRegularInvoice ? `${String(billingCycle.startDate.getDate()).padStart(2, '0')}/${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.startDate.getFullYear()} - ${String(billingCycle.endDate.getDate()).padStart(2, '0')}/${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.endDate.getFullYear()}` : (startDate || new Date().toLocaleDateString('en-GB')),
      createdAt: new Date().toISOString()
    };

    console.log('Final invoice data:', invoiceData);

    const glogoRef = await addInvoiceRecord({
      InvoiceID: invoiceData.invoiceId,
      Ref: ref,
      CustomerID: isRegularInvoice ? customerID : 'ONE_TIME',
      CustomerName: invoiceData.customerName,
      Villa: invoiceData.villa,
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: invoiceData.dueDate,
      TotalAmount: invoiceData.totalAmount,
      Status: invoiceData.status,
      PaymentMethod: invoiceData.paymentMethod,
      Start: isRegularInvoice ? `${String(billingCycle.startDate.getDate()).padStart(2, '0')}/${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.startDate.getFullYear()}` : (startDate || new Date().toLocaleDateString('en-GB')),
      End: isRegularInvoice ? `${String(billingCycle.endDate.getDate()).padStart(2, '0')}/${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.endDate.getFullYear()}` : '',
      Vehicle: invoiceData.vehicleType,
      PackageID: invoiceData.packageId,
      Notes: isRegularInvoice ? (notes || `Service Period: ${invoiceData.serviceDate}`) : `Phone: ${invoiceData.phone}, Vehicle: ${invoiceData.vehicleType}, Services: ${invoiceData.services}`,
      Services: invoiceData.services,
      CreatedBy: 'System',
      CreatedAt: invoiceData.createdAt
    });
    
    invoiceData.invoiceId = glogoRef;

    res.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await getInvoices();
    res.json({
      success: true,
      invoices: invoices
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, customerName, villa, totalAmount, dueDate } = req.body;
    
    if (status && !customerName) {
      await updateInvoiceStatus(id, status, paymentMethod);
    } else {
      const { updateInvoiceRecord } = require('../../services/googleSheetsService');
      await updateInvoiceRecord(id, {
        CustomerName: customerName,
        Villa: villa,
        TotalAmount: totalAmount,
        DueDate: dueDate,
        Status: status,
        PaymentMethod: status === 'Pending' ? '' : paymentMethod
      });
    }
    
    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteInvoiceRecord(id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const exportInvoices = async (req, res) => {
  try {
    res.json({ success: true, message: 'Export functionality not implemented yet' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const printInvoice = async (req, res) => {
  try {
    res.json({ success: true, message: 'Print functionality not implemented yet' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getInvoiceNumber = async (req, res) => {
  try {
    const { customerID, customerName, villa } = req.body;
    const invoiceNumber = await getOrCreateInvoiceNumber(customerID, customerName, villa);
    res.json({ success: true, invoiceNumber });
  } catch (error) {
    console.error('Error getting invoice number:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getInvoiceStats = async (req, res) => {
  try {
    const invoices = await getInvoices();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.InvoiceDate);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    });
    
    const paidThisMonth = thisMonthInvoices.filter(invoice => invoice.Status === 'Paid');
    const pendingThisMonth = thisMonthInvoices.filter(invoice => invoice.Status === 'Pending');
    
    const thisMonthTotal = thisMonthInvoices.reduce((sum, invoice) => sum + (parseFloat(invoice.TotalAmount) || 0), 0);
    const paidTotal = paidThisMonth.reduce((sum, invoice) => sum + (parseFloat(invoice.TotalAmount) || 0), 0);
    const pendingTotal = pendingThisMonth.reduce((sum, invoice) => sum + (parseFloat(invoice.TotalAmount) || 0), 0);
    const allTimeTotal = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.TotalAmount) || 0), 0);
    
    res.json({
      thisMonth: { total: thisMonthTotal, count: thisMonthInvoices.length },
      paid: { total: paidTotal, count: paidThisMonth.length },
      pending: { total: pendingTotal, count: pendingThisMonth.length },
      allTime: { total: allTimeTotal, count: invoices.length }
    });
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
  exportInvoices,
  printInvoice,
  getInvoiceNumber,
  getInvoiceStats
};