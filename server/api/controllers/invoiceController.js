const db = require('../../services/databaseService');

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
      // Check if customer has active service period
      const existingInvoices = await db.getInvoices();
      console.log(`🔍 Checking invoices for customer ${customerID}`);
      console.log(`   Total invoices in DB: ${existingInvoices.length}`);
      
      const customerInvoices = existingInvoices.filter(invoice => 
        invoice.CustomerID === customerID && 
        invoice.Status && invoice.Status.toUpperCase() !== 'RESERVED'
      );
      
      console.log(`   Customer invoices found: ${customerInvoices.length}`);
      
      if (customerInvoices.length > 0) {
        // Find latest invoice
        const latestInvoice = customerInvoices.reduce((latest, current) => {
          const latestDate = new Date(latest.CreatedAt || latest.InvoiceDate || 0);
          const currentDate = new Date(current.CreatedAt || current.InvoiceDate || 0);
          return currentDate > latestDate ? current : latest;
        });
        
        console.log(`   Latest invoice: ${latestInvoice.Ref}`);
        console.log(`   Service period: ${latestInvoice.Start} to ${latestInvoice.End}`);
        
        // Check if service period is still active
        if (latestInvoice.End) {
          const serviceEndDate = new Date(latestInvoice.End.split('/').reverse().join('-'));
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          console.log(`   Service end date: ${serviceEndDate.toISOString().split('T')[0]}`);
          console.log(`   Today: ${today.toISOString().split('T')[0]}`);
          console.log(`   Is service active? ${serviceEndDate >= today}`);
          
          if (serviceEndDate >= today) {
            console.log(`❌ REJECTED: Service period still active`);
            throw new Error(`Customer already has an active service period until ${latestInvoice.End} (${latestInvoice.Ref || latestInvoice.InvoiceID})`);
          }
        }
        
        console.log(`✅ APPROVED: Service period ended, can create new invoice`);
      } else {
        console.log(`✅ APPROVED: No previous invoices, can create first invoice`);
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
      let billingStartDate;
      
      // If customer has previous invoices, start from the day after last service ended
      if (customerInvoices.length > 0) {
        const latestInvoice = customerInvoices.reduce((latest, current) => {
          const latestDate = new Date(latest.CreatedAt || latest.InvoiceDate || 0);
          const currentDate = new Date(current.CreatedAt || current.InvoiceDate || 0);
          return currentDate > latestDate ? current : latest;
        });
        
        if (latestInvoice.End) {
          const lastServiceEnd = new Date(latestInvoice.End.split('/').reverse().join('-'));
          billingStartDate = new Date(lastServiceEnd);
          billingStartDate.setDate(billingStartDate.getDate() + 1); // Start next day
        } else {
          // Fallback to contract-based calculation
          const contractDay = contractStartDate.getDate();
          billingStartDate = new Date(today.getFullYear(), today.getMonth(), contractDay);
          if (billingStartDate > today) {
            billingStartDate = new Date(today.getFullYear(), today.getMonth() - 1, contractDay);
          }
        }
      } else {
        // First invoice - use contract start date
        billingStartDate = new Date(contractStartDate);
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

    // لو الـ ref ما جاش من الفرونت، استخدم النمط القياسي GLOGO-YYMMNNN
    const finalRef = ref || await db.getNextInvoiceRef();

    const result = await db.addInvoice({
      InvoiceID: null, // سيتم إنشاؤه تلقائياً
      Ref: finalRef,
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
    
    console.log(`✅ Invoice created successfully: ${finalRef}`);
    
    invoiceData.invoiceId = finalRef;
    
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
    const { customerId } = req.query;
    const allInvoices = await db.getInvoices();
    
    let invoices = allInvoices;
    if (customerId) {
      invoices = allInvoices.filter(invoice => invoice.CustomerID === customerId);
    }
    
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
    const { bulkCount } = req.body;
    
    if (bulkCount && bulkCount > 1) {
      // For bulk operations, reserve multiple numbers at once
      const invoices = await db.getInvoices();
      let maxGlogoNumber = 2510041;
      
      invoices.forEach(invoice => {
        if (invoice.Ref && invoice.Ref.startsWith('GLOGO-')) {
          const match = invoice.Ref.match(/GLOGO-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxGlogoNumber) maxGlogoNumber = num;
          }
        }
      });
      
      const reservedNumbers = [];
      for (let i = 0; i < bulkCount; i++) {
        reservedNumbers.push(`GLOGO-${maxGlogoNumber + 1 + i}`);
      }
      
      res.json({ success: true, invoiceNumbers: reservedNumbers });
    } else {
      const invoiceNumber = await db.getNextInvoiceRef();
      res.json({ success: true, invoiceNumber });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getInvoiceStats = async (req, res) => {
  try {
    const invoices = await db.getInvoices();
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
    const invoices = await db.getInvoices();
    const duplicates = [];
    const refCounts = {};
    
    // Check for duplicate REFs
    invoices.forEach(invoice => {
      if (invoice.Ref) {
        refCounts[invoice.Ref] = (refCounts[invoice.Ref] || []);
        refCounts[invoice.Ref].push(invoice);
      }
    });
    
    // Check for duplicate service dates (same customer, same service start date)
    const serviceDateCounts = {};
    invoices.forEach(invoice => {
      if (invoice.Start && invoice.CustomerID && invoice.CustomerID !== 'ONE_TIME') {
        const serviceKey = `${invoice.CustomerID}-${invoice.Start}`;
        serviceDateCounts[serviceKey] = (serviceDateCounts[serviceKey] || []);
        serviceDateCounts[serviceKey].push(invoice);
      }
    });
    
    // Add duplicate REFs to results
    Object.entries(refCounts).forEach(([ref, invoiceList]) => {
      if (invoiceList.length > 1) {
        duplicates.push({
          type: 'DUPLICATE_REF',
          severity: 'HIGH',
          ref: ref,
          count: invoiceList.length,
          invoices: invoiceList
        });
      }
    });
    
    // Add duplicate service dates to results
    Object.entries(serviceDateCounts).forEach(([key, invoiceList]) => {
      if (invoiceList.length > 1) {
        const lastDashIndex = key.lastIndexOf('-');
        const customerID = key.substring(0, lastDashIndex);
        const serviceDate = key.substring(lastDashIndex + 1);
        
        duplicates.push({
          type: 'DUPLICATE_SERVICE_PERIOD',
          severity: 'HIGH',
          customerID: customerID,
          serviceDate: serviceDate,
          count: invoiceList.length,
          invoices: invoiceList
        });
      }
    });
    
    const totalDuplicateInvoices = duplicates.reduce((sum, dup) => sum + dup.count, 0);
    const duplicateRefs = duplicates.filter(d => d.type === 'DUPLICATE_REF').length;
    
    res.json({
      success: true,
      duplicates: duplicates,
      summary: {
        total: invoices.length,
        duplicateRefs: duplicateRefs,
        totalDuplicateInvoices: totalDuplicateInvoices
      },
      message: duplicates.length > 0 
        ? `Found ${duplicates.length} duplicate issues affecting ${totalDuplicateInvoices} invoices`
        : 'No duplicate invoices found'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getClientsSummary = async (req, res) => {
  try {
    const invoices = await db.getInvoices();
    
    const subscriptionInvoices = invoices.filter(inv => inv.CustomerID && inv.CustomerID !== 'ONE_TIME');
    const oneTimeInvoices = invoices.filter(inv => inv.CustomerID === 'ONE_TIME');
    
    res.json({
      success: true,
      subscriptionClients: subscriptionInvoices.length,
      oneTimeClients: oneTimeInvoices.length,
      totalClients: invoices.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const fixOldInvoiceNumbers = async (req, res) => {
  try {
    const invoices = await db.getInvoices();
    const oldFormatInvoices = invoices.filter(inv => 
      inv.Ref && inv.Ref.startsWith('GLOGO-') && inv.Ref.length > 12
    );
    
    if (oldFormatInvoices.length === 0) {
      return res.json({ success: true, message: 'No old format invoices found', updated: 0 });
    }
    
    let maxGlogoNumber = 2510041;
    invoices.forEach(invoice => {
      if (invoice.Ref && invoice.Ref.startsWith('GLOGO-') && invoice.Ref.length <= 12) {
        const match = invoice.Ref.match(/GLOGO-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxGlogoNumber) maxGlogoNumber = num;
        }
      }
    });
    
    const updates = [];
    for (let i = 0; i < oldFormatInvoices.length; i++) {
      const invoice = oldFormatInvoices[i];
      const newRef = `GLOGO-${maxGlogoNumber + 1 + i}`;
      
      await db.updateInvoice(invoice.InvoiceID, { Ref: newRef });
      updates.push({ old: invoice.Ref, new: newRef, customer: invoice.CustomerName });
    }
    
    res.json({
      success: true,
      message: `Updated ${updates.length} invoice numbers`,
      updated: updates.length,
      changes: updates
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
  checkDuplicateInvoices,
  getClientsSummary,
  fixOldInvoiceNumbers
};