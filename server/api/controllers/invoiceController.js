const db = require('../../services/databaseService');
const { getCustomers, getInvoices, addInvoiceRecord, updateInvoiceStatus, updateInvoiceRecord, deleteInvoiceRecord, getOrCreateInvoiceNumber, detectDuplicateInvoices } = require('../../services/googleSheetsService');

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
      notes,
      subject
    } = req.body;

    const isRegularInvoice = customerID && customerID !== 'ONE_TIME';
    
    let customerData = null;
    let billingCycle = null;
    
    if (isRegularInvoice) {
      // Check if customer already has invoice this month
      const existingInvoices = await getInvoices();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const existingInvoice = existingInvoices.find(invoice => {
        if (invoice.CustomerID !== customerID) return false;
        
        // Ignore reserved entries, which are not actual invoices
        if (invoice.Status && invoice.Status.toUpperCase() === 'RESERVED') {
            return false;
        }
        
        const invoiceDate = new Date(invoice.CreatedAt || invoice.InvoiceDate);
        const invoiceMonth = invoiceDate.getMonth() + 1;
        const invoiceYear = invoiceDate.getFullYear();
        
        return invoiceMonth === currentMonth && invoiceYear === currentYear;
      });
      
      if (existingInvoice) {
        throw new Error(`Customer already has an invoice for this month: ${existingInvoice.Ref || existingInvoice.InvoiceID}`);
      }
      
      const customers = await db.getCustomers();
      customerData = customers.find(c => c.CustomerID === customerID);
      
      if (!customerData) {
        throw new Error('Customer not found');
      }
      
            // Parse customer start date properly
      let startDateStr = customerData['start date'] || customerData.Start_Date || customerData['Start Date'] || customerData.StartDate || customerData.CreatedAt;
      
      if (!startDateStr) {
        // Don't set automatic dates - let user specify billing period
        return res.status(400).json({ 
          success: false, 
          error: 'Customer start date is required. Please update customer information first.',
          requiresStartDate: true
        });
      }
      
      // Parse different date formats
      let contractStartDate;
      
      // Try DD-MMM-YY format (1-Nov-25) first
      if (startDateStr.includes('-') && startDateStr.split('-').length === 3 && isNaN(parseInt(startDateStr.split('-')[1]))) {
        const parts = startDateStr.split('-');
        const day = parseInt(parts[0]);
        const monthStr = parts[1];
        let year = parseInt(parts[2]);
        
        // Convert 2-digit year to 4-digit
        if (year < 100) {
          year += 2000;
        }
        
        const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                       'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
        
        const monthIndex = months[monthStr];
        if (monthIndex !== undefined) {
          contractStartDate = new Date(year, monthIndex, day);
        }
      } else {
        // Fallback to standard date parsing (handles ISO format like 2025-11-01)
        contractStartDate = new Date(startDateStr);
      }
      
      if (isNaN(contractStartDate.getTime())) {
        throw new Error('Invalid customer start date: ' + startDateStr);
      }
      
      console.log(`Contract start date parsed: ${contractStartDate}`);
      
      const today = new Date();
      // Calculate current billing cycle based on contract start day
      const contractDay = contractStartDate.getDate();
      
      // Find the current billing period
      let billingStartDate = new Date(today.getFullYear(), today.getMonth(), contractDay);
      
      // If contract day hasn't come this month, use last month
      if (billingStartDate > today) {
        billingStartDate = new Date(today.getFullYear(), today.getMonth() - 1, contractDay);
      }
      
      const billingEndDate = new Date(billingStartDate);
      billingEndDate.setMonth(billingEndDate.getMonth() + 1);
      billingEndDate.setDate(billingEndDate.getDate() - 1); // End day before next cycle
      
      billingCycle = {
        startDate: billingStartDate,
        endDate: billingEndDate
      };
    }
    
    const invoiceData = {
      invoiceId: null, // سيتم إنشاؤه في addInvoiceRecord
      customerName: isRegularInvoice ? (customerData?.Name || customerData?.name || 'Unknown Customer') : (clientName || 'Walk-in Customer'),
      villa: isRegularInvoice ? (customerData?.Villa || customerData?.villa || 'N/A') : (villa || 'N/A'),
      phone: isRegularInvoice ? (customerData?.Phone || customerData?.phone || 'N/A') : (phone || 'N/A'),
      packageId: isRegularInvoice ? (customerData?.['Washman Package'] || customerData?.Washman_Package || 'Standard Package') : (packageId || 'One-Time Service'),
      vehicleType: isRegularInvoice ? (customerData?.['Car Type'] || customerData?.CarPlates || customerData?.CarType || 'N/A') : (vehicleType || 'N/A'),
      services: isRegularInvoice ? (customerData?.Serves || customerData?.serves || '') : (serves || ''),
      totalAmount: isRegularInvoice ? (totalAmount || customerData?.Fee || customerData?.fee) : amount,
      status: isRegularInvoice ? (paymentStatus === 'PAID' ? 'Paid' : 'Pending') : (paymentStatus === 'yes/cash' || paymentStatus === 'yes/bank' ? 'Paid' : 'Pending'),
      paymentMethod: isRegularInvoice ? (paymentStatus === 'PAID' ? (req.body.paymentMethod || 'Cash') : '') : (paymentStatus === 'yes/cash' ? 'Cash' : paymentStatus === 'yes/bank' ? 'Bank' : ''),
      invoiceDate: isRegularInvoice ? `${billingCycle.startDate.getFullYear()}-${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}-${String(billingCycle.startDate.getDate()).padStart(2, '0')}` : new Date().toISOString().split('T')[0],
      dueDate: isRegularInvoice ? `${billingCycle.endDate.getFullYear()}-${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}-${String(billingCycle.endDate.getDate()).padStart(2, '0')}` : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      serviceDate: isRegularInvoice ? `${String(billingCycle.startDate.getDate()).padStart(2, '0')}/${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.startDate.getFullYear()} - ${String(billingCycle.endDate.getDate()).padStart(2, '0')}/${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.endDate.getFullYear()}` : (startDate || new Date().toLocaleDateString('en-GB')),
      createdAt: new Date().toISOString()
    };

    // Calculate billing cycle immediately for display
    let displayStart = '';
    let displayEnd = '';
    
    if (isRegularInvoice && billingCycle) {
      displayStart = `${String(billingCycle.startDate.getDate()).padStart(2, '0')}/${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.startDate.getFullYear()}`;
      displayEnd = `${String(billingCycle.endDate.getDate()).padStart(2, '0')}/${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}/${billingCycle.endDate.getFullYear()}`;
    } else if (!isRegularInvoice) {
      displayStart = startDate || new Date().toLocaleDateString('en-GB');
      displayEnd = '';
    }

    const glogoRef = await addInvoiceRecord({
      InvoiceID: null, // سيتم إنشاؤه تلقائياً
      Ref: ref || 'GLOGO-' + Date.now(),
      CustomerID: isRegularInvoice ? customerID : 'ONE_TIME',
      CustomerName: invoiceData.customerName,
      Villa: invoiceData.villa,
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: invoiceData.dueDate,
      TotalAmount: invoiceData.totalAmount,
      Status: invoiceData.status,
      PaymentMethod: invoiceData.paymentMethod,
      Start: displayStart,
      End: displayEnd,
      Vehicle: invoiceData.vehicleType,
      PackageID: invoiceData.packageId,
      Notes: isRegularInvoice ? `Name: ${invoiceData.customerName}\nPackage ID: ${invoiceData.packageId}\nVehicle: ${invoiceData.vehicleType}\nStart: ${displayStart}\nEnd: ${displayEnd}` : `Phone: ${invoiceData.phone}, Vehicle: ${invoiceData.vehicleType}, Services: ${invoiceData.services}`,
      Services: invoiceData.services || '',
      Subject: subject || invoiceData.services || '',
      CreatedBy: 'System',
      CreatedAt: invoiceData.createdAt
    });
    
    invoiceData.invoiceId = glogoRef;
    
    // Add display dates to response
    invoiceData.displayStart = displayStart;
    invoiceData.displayEnd = displayEnd;

    res.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await db.getInvoices();
    res.json({
      success: true,
      invoices: invoices,
      message: `Found ${invoices.length} invoices`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      paymentMethod, 
      customerName, 
      villa, 
      totalAmount
    } = req.body;
    
    await db.updateInvoice(id, {
      CustomerName: customerName,
      Villa: villa,
      TotalAmount: totalAmount,
      Status: status
    });
    
    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteInvoice(id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
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
    const invoiceNumber = await db.getNextInvoiceRef();
    res.json({ success: true, invoiceNumber });
  } catch (error) {
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
      const invoiceDate = new Date(invoice.CreatedAt || invoice.InvoiceDate);
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
    res.status(500).json({ error: error.message });
  }
};

const checkDuplicateInvoices = async (req, res) => {
  try {
    const result = await detectDuplicateInvoices();
    
    res.json({
      success: true,
      ...result,
      message: result.duplicates.length > 0 
        ? `Found ${result.duplicates.length} duplicate issues affecting ${result.summary.totalDuplicateInvoices} invoices`
        : 'No duplicate invoices found'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
  getInvoiceStats,
  checkDuplicateInvoices
};