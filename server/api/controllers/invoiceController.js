const { addRowToSheet, getInvoices, addInvoiceRecord, deleteInvoiceRecord, getCustomers, updateInvoiceStatus, getOrCreateInvoiceNumber } = require('../../services/googleSheetsService');

const createInvoice = async (req, res) => {
  try {
    // Handle both one-time invoices and regular invoices
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

    // Check if it's a regular invoice (has customerID) or one-time invoice
    const isRegularInvoice = customerID && !ref;
    
    let customerData = null;
    if (isRegularInvoice) {
      const customers = await getCustomers();
      customerData = customers.find(c => c.CustomerID === customerID);
    }
    
    const invoiceData = {
      invoiceId: ref || (isRegularInvoice ? `REG-${Date.now()}` : `OT-${Date.now()}`),
      customerName: isRegularInvoice ? (customerData?.Name || 'Unknown Customer') : (clientName || 'Walk-in Customer'),
      villa: isRegularInvoice ? (customerData?.Villa || 'N/A') : (villa || 'N/A'),
      phone: isRegularInvoice ? (customerData?.Phone || 'N/A') : (phone || 'N/A'),
      packageId: isRegularInvoice ? (customerData?.Washman_Package || 'Standard Package') : (packageId || 'One-Time Service'),
      vehicleType: isRegularInvoice ? (customerData?.CarPlates || 'N/A') : (vehicleType || 'N/A'),
      services: isRegularInvoice ? (customerData?.Washman_Package || 'Car wash service') : (serves || 'Car wash service'),
      totalAmount: isRegularInvoice ? totalAmount : amount,
      status: isRegularInvoice ? 'Pending' : (paymentStatus === 'yes/cash' || paymentStatus === 'yes/bank' ? 'Paid' : 'Pending'),
      paymentMethod: isRegularInvoice ? '' : (paymentStatus === 'yes/cash' ? 'Cash' : paymentStatus === 'yes/bank' ? 'Bank' : ''),
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: isRegularInvoice ? dueDate : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      serviceDate: startDate || new Date().toLocaleDateString('en-GB'),
      createdAt: new Date().toISOString()
    };

    const glogoRef = await addInvoiceRecord({
      InvoiceID: invoiceData.invoiceId,
      Ref: ref, // استخدام الـ ref المرسل من الـ frontend
      CustomerID: isRegularInvoice ? customerID : 'ONE_TIME',
      CustomerName: invoiceData.customerName,
      Villa: invoiceData.villa,
      InvoiceDate: invoiceData.invoiceDate,
      DueDate: invoiceData.dueDate,
      TotalAmount: invoiceData.totalAmount,
      Status: invoiceData.status,
      PaymentMethod: invoiceData.paymentMethod,
      Notes: isRegularInvoice ? notes : `Phone: ${invoiceData.phone}, Vehicle: ${invoiceData.vehicleType}, Services: ${invoiceData.services}`,
      CreatedBy: 'System',
      CreatedAt: invoiceData.createdAt
    });
    
    // تحديث رقم الفاتورة في الاستجابة
    invoiceData.invoiceId = glogoRef;

    res.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
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
  console.log('[BACKEND] Update invoice request received');
  console.log('[BACKEND] Params:', req.params);
  console.log('[BACKEND] Body:', req.body);
  
  try {
    const { id } = req.params;
    const { status, paymentMethod, customerName, villa, totalAmount, dueDate } = req.body;
    
    // If only status/payment update
    if (status && !customerName) {
      console.log('[BACKEND] Status update only');
      await updateInvoiceStatus(id, status, paymentMethod);
    } else {
      // Full invoice update
      console.log('[BACKEND] Full invoice update');
      const { updateInvoiceRecord } = require('../../services/googleSheetsService');
      await updateInvoiceRecord(id, {
        CustomerName: customerName,
        Villa: villa,
        TotalAmount: totalAmount,
        DueDate: dueDate,
        Status: status
      });
    }
    
    console.log('[BACKEND] Update successful');
    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('[BACKEND] Error updating invoice:', error);
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