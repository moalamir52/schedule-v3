// FINAL version of: server/services/googleSheetsService.js

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
const { apiRetry } = require('../utils/apiRetry');
const { getCachedTasks, setCachedTasks, clearTasksCache } = require('../utils/taskCache');

// Conditionally load credentials
let creds;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  // Production environment - parse from environment variable
  creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
} else {
  // Local environment - require from file
  creds = require('../credentials.json');
}

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1sG0itNKcxg10mOzbuiY_i-IsPBQ3fmXwXDvqCbT3kFU';
const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
let sheetsLoaded = false;
// --------------------

async function loadSheet() {
  if (sheetsLoaded) return;
  await doc.loadInfo();
  sheetsLoaded = true;
}

function mapRowsToObjects(rows, headers) {
    return rows.map(row => {
        const rowData = {};
        headers.forEach(header => {
            rowData[header] = row.get(header);
        });
        return rowData;
    });
}

async function getCustomers() {
  return await apiRetry(async () => {
    await loadSheet();
    const sheet = doc.sheetsByTitle['Budget - customers'];
    if (!sheet) {
      throw new Error("Sheet 'Budget - customers' not found.");
    }
    const rows = await sheet.getRows();
    return mapRowsToObjects(rows, sheet.headerValues);
  });
}

async function getHistoryForCar(carPlate) {
  await loadSheet();
  // --- THIS IS THE CORRECTED PART ---
  // Ensure this name exactly matches the name of your second sheet/tab.
  const sheet = doc.sheetsByTitle['wash_history']; 
  // ---------------------------------
  
  if (!sheet) {
    // This will give us a clearer error if the sheet name is wrong in the future.
    throw new Error("Sheet 'wash_history' not found.");
  }

  const rows = await sheet.getRows();
  const allHistory = mapRowsToObjects(rows, sheet.headerValues);

  return allHistory
    .filter(record => record.CarPlate === carPlate)
    .sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
}

async function getAllHistory() {
  return await apiRetry(async () => {
    await loadSheet();
    const sheet = doc.sheetsByTitle['wash_history'];
    if (!sheet) {
      throw new Error("Sheet 'wash_history' not found.");
    }
    const rows = await sheet.getRows();
    return mapRowsToObjects(rows, sheet.headerValues);
  });
}

async function addHistoryRecord(historyData) {
    return await apiRetry(async () => {
        await loadSheet();
        const sheet = doc.sheetsByTitle['wash_history'];
        if (!sheet) {
            throw new Error("Sheet 'wash_history' not found.");
        }
    
    // Format date as DD-MMM-YYYY (e.g., 8-Oct-2025)
    const formatDate = (date) => {
        const d = new Date(date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };
    
    // Get all existing rows to find the next empty row
    const rows = await sheet.getRows();
    const nextRowIndex = rows.length + 2; // +2 because row 1 is headers and array is 0-indexed
    
    // Prepare data with formatted date
    const dataWithFormattedDate = {
        ...historyData,
        WashDate: historyData.WashDate ? formatDate(historyData.WashDate) : formatDate(new Date())
    };
    
    // Prepare data in correct order matching actual sheet columns
    const headers = ['WashID', 'CustomerID', 'CarPlate', 'WashDate', 'PackageType', 'Villa', 'WashTypePerformed', 'VisitNumberInWeek', 'WeekInCycle', 'Status', 'WorkerName'];
    const values = headers.map(header => dataWithFormattedDate[header] || '');
    
    // Use raw API to append to specific row
    await sheet.loadCells(`A${nextRowIndex}:K${nextRowIndex}`);
    headers.forEach((header, index) => {
        const cell = sheet.getCell(nextRowIndex - 1, index); // -1 because getCell is 0-indexed
        cell.value = dataWithFormattedDate[header] || '';
    });
        await sheet.saveUpdatedCells();
    });
}

// Add new customer
async function addCustomer(customerData) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Budget - customers'];
  if (!sheet) {
    throw new Error("Sheet 'Budget - customers' not found.");
  }
  await sheet.addRow(customerData);
  return customerData;
}

// Update customer
async function updateCustomer(customerID, updatedData) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Budget - customers'];
  if (!sheet) {
    throw new Error("Sheet 'Budget - customers' not found.");
  }
  
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('CustomerID') === customerID);
  
  if (!row) {
    throw new Error('Customer not found');
  }
  
  // Store original data for undo
  const originalData = {};
  sheet.headerValues.forEach(header => {
    originalData[header] = row.get(header);
  });
  
  // Update row with new data
  Object.keys(updatedData).forEach(key => {
    row.set(key, updatedData[key]);
  });
  
  await row.save();
  return { original: originalData, updated: updatedData };
}

// Delete customer
async function deleteCustomer(customerID) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Budget - customers'];
  if (!sheet) {
    throw new Error("Sheet 'Budget - customers' not found.");
  }
  
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('CustomerID') === customerID);
  
  if (!row) {
    throw new Error('Customer not found');
  }
  
  // Store original data for undo
  const originalData = {};
  sheet.headerValues.forEach(header => {
    originalData[header] = row.get(header);
  });
  
  await row.delete();
  return originalData;
}

// Restore customer (for undo)
async function restoreCustomer(customerData) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Budget - customers'];
  if (!sheet) {
    throw new Error("Sheet 'Budget - customers' not found.");
  }
  await sheet.addRow(customerData);
  return customerData;
}

// Search customers
async function searchCustomers(searchTerm) {
  const customers = await getCustomers();
  if (!searchTerm) return customers;
  
  return customers.filter(customer => 
    Object.values(customer).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
}

async function getWorkers() {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Workers'];
  if (!sheet) {
    throw new Error("Sheet 'Workers' not found.");
  }
  const rows = await sheet.getRows();
  return mapRowsToObjects(rows, sheet.headerValues);
}

async function clearSheet(sheetName) {
  await loadSheet();
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found.`);
  }
  
  // Clear all data but keep headers by clearing from row 2 onwards
  if (sheet.rowCount > 1) {
    await sheet.clear('A2:Z' + sheet.rowCount);
  }
  

}

async function addRowsToSheet(sheetName, data) {
  await loadSheet();
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found.`);
  }
  
  if (data.length === 0) return;
  
  // Always set headers first
  const headers = ['Day', 'AppointmentDate', 'Time', 'CustomerID', 'CustomerName', 'Villa', 'CarPlate', 'WashType', 'WorkerName', 'WorkerID', 'PackageType', 'isLocked', 'ScheduleDate'];
  await sheet.setHeaderRow(headers);
  await sheet.loadHeaderRow();
  
  // Add all rows at once
  const rowsData = data.map(item => ({
    Day: item.day,
    AppointmentDate: item.appointmentDate || '',
    Time: item.time,
    CustomerID: item.customerId,
    CustomerName: item.customerName,
    Villa: item.villa,
    CarPlate: item.carPlate,
    WashType: item.washType,
    WorkerName: item.workerName,
    WorkerID: item.workerId,
    PackageType: item.packageType || '',
    isLocked: item.isLocked || 'FALSE',
    ScheduleDate: item.scheduleDate || new Date().toISOString().split('T')[0]
  }));
  
  await sheet.addRows(rowsData);

}

async function getScheduledTasks() {
  // Try cache first
  const cached = getCachedTasks();
  if (cached) return cached;
  
  // Fetch from API with retry
  const tasks = await apiRetry(async () => {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['ScheduledTasks'];
    if (!sheet) return [];
    
    const rows = await sheet.getRows();
    if (!rows || rows.length === 0) return [];
    
    const headers = ['Day', 'AppointmentDate', 'Time', 'CustomerID', 'CustomerName', 'Villa', 'CarPlate', 'WashType', 'WorkerName', 'WorkerID', 'PackageType', 'isLocked', 'ScheduleDate'];
    
    return rows.map(row => {
      const task = {};
      headers.forEach((header, index) => {
        task[header] = row._rawData[index] || '';
      });
      return task;
    });
  }, 2, 1500);
  
  // Cache the result
  setCachedTasks(tasks);
  return tasks;
}

async function addRowToSheet(sheetName, data) {
  await loadSheet();
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found.`);
  }
  
  // Ensure headers exist
  const headers = ['Day', 'AppointmentDate', 'Time', 'CustomerID', 'CustomerName', 'Villa', 'CarPlate', 'WashType', 'WorkerName', 'WorkerID', 'PackageType', 'isLocked', 'ScheduleDate'];
  if (sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(headers);
    await sheet.loadHeaderRow();
  }
  
  // Add single row
  const rowData = {
    Day: data[0].day,
    AppointmentDate: data[0].appointmentDate || '',
    Time: data[0].time,
    CustomerID: data[0].customerId,
    CustomerName: data[0].customerName,
    Villa: data[0].villa,
    CarPlate: data[0].carPlate,
    WashType: data[0].washType,
    WorkerName: data[0].workerName,
    WorkerID: data[0].workerId,
    PackageType: data[0].packageType || '',
    isLocked: data[0].isLocked || 'FALSE',
    ScheduleDate: data[0].scheduleDate || new Date().toISOString().split('T')[0]
  };
  
  await sheet.addRow(rowData);

}

async function clearAndWriteSheet(sheetName, data) {
  console.log(`[SHEETS] clearAndWriteSheet called for ${sheetName} with ${data.length} items`);
  return await apiRetry(async () => {
    await loadSheet();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found.`);
    }
  
  try {
    console.log(`[SHEETS] Clearing sheet ${sheetName}...`);
    // Clear all content including headers
    await sheet.clear();
    
    // Set headers based on sheet type
    let headers, rowsData;
    
    if (sheetName === 'WashRules') {
      headers = ['RuleId', 'RuleName', 'SingleCarPattern', 'MultiCarSettings', 'BiWeeklySettings', 'CreatedDate', 'Status'];
      rowsData = data.map(item => ({
        RuleId: item.RuleId,
        RuleName: item.RuleName,
        SingleCarPattern: item.SingleCarPattern,
        MultiCarSettings: item.MultiCarSettings,
        BiWeeklySettings: item.BiWeeklySettings,
        CreatedDate: item.CreatedDate,
        Status: item.Status
      }));
    } else {
      // Default to ScheduledTasks format
      headers = ['Day', 'AppointmentDate', 'Time', 'CustomerID', 'CustomerName', 'Villa', 'CarPlate', 'WashType', 'WorkerName', 'WorkerID', 'PackageType', 'isLocked', 'ScheduleDate'];
      // Clean and validate data before sending to Google Sheets
      rowsData = data.map(item => {
        const cleanItem = {
          Day: String(item.day || ''),
          AppointmentDate: String(item.appointmentDate || ''),
          Time: String(item.time || ''),
          CustomerID: String(item.customerId || ''),
          CustomerName: String(item.customerName || ''),
          Villa: String(item.villa || ''),
          CarPlate: String(item.carPlate || ''),
          WashType: String(item.washType || 'EXT'),
          WorkerName: String(item.workerName || ''),
          WorkerID: String(item.workerId || ''),
          PackageType: String(item.packageType || ''),
          isLocked: String(item.isLocked || 'FALSE'),
          ScheduleDate: String(item.scheduleDate || new Date().toISOString().split('T')[0])
        };
        
        // Remove any undefined, null, or object values
        Object.keys(cleanItem).forEach(key => {
          if (cleanItem[key] === 'undefined' || cleanItem[key] === 'null' || typeof cleanItem[key] === 'object') {
            cleanItem[key] = '';
          }
        });
        
        return cleanItem;
      });
    }
    
    await sheet.setHeaderRow(headers);
    console.log(`[SHEETS] Headers set for ${sheetName}:`, headers);
    
    // Wait for headers to be set properly
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (data.length > 0) {
      console.log(`[SHEETS] Adding ${data.length} rows to ${sheetName}...`);
      await sheet.addRows(rowsData);
      clearTasksCache(); // Clear cache after bulk update
      console.log(`[SHEETS] Successfully added ${rowsData.length} rows to ${sheetName}`);
    } else {
      console.log(`[SHEETS] No data to add to ${sheetName}`);
    }
    } catch (error) {
      console.error(`[SHEETS] Error in clearAndWriteSheet: ${error.message}`);
      throw error;
    }
  });
}

async function addInvoiceRecord(invoiceData) {
    return await apiRetry(async () => {
        await loadSheet();
        const sheet = doc.sheetsByTitle['invoices'];
        if (!sheet) {
            throw new Error("Sheet 'invoices' not found.");
        }
    
    // Get GLOGO number if not provided
    let refNumber = invoiceData.Ref;
    if (!refNumber || refNumber.startsWith('REG-') || refNumber.startsWith('OT-')) {
        refNumber = await getOrCreateInvoiceNumber(
            invoiceData.CustomerID,
            invoiceData.CustomerName,
            invoiceData.Villa
        );
    }
    
    // Generate unique Invoice ID
    let invoiceId = invoiceData.InvoiceID;
    if (!invoiceId) {
        const timestamp = Date.now();
        invoiceId = `INV-${timestamp}`;
    }
    
    // Check if this is updating a reserved record
    const rows = await sheet.getRows();
    const reservedRow = rows.find(row => 
        row.get('Ref') === refNumber && 
        row.get('Status') === 'RESERVED'
    );
    
    if (reservedRow) {
        // Update the reserved record with actual data
        reservedRow.set('InvoiceID', invoiceId);
        reservedRow.set('CustomerID', invoiceData.CustomerID);
        reservedRow.set('CustomerName', invoiceData.CustomerName);
        reservedRow.set('Villa', invoiceData.Villa);
        reservedRow.set('InvoiceDate', invoiceData.InvoiceDate || new Date().toISOString().split('T')[0]);
        reservedRow.set('DueDate', invoiceData.DueDate);
        reservedRow.set('TotalAmount', invoiceData.TotalAmount);
        reservedRow.set('Status', invoiceData.Status);
        reservedRow.set('PaymentMethod', invoiceData.PaymentMethod);
        reservedRow.set('Start', invoiceData.Start);
        reservedRow.set('End', invoiceData.End);
        reservedRow.set('Vehicle', invoiceData.Vehicle);
        reservedRow.set('PackageID', invoiceData.PackageID);
        reservedRow.set('Services', invoiceData.Services);
        reservedRow.set('Notes', invoiceData.Notes);
        reservedRow.set('CreatedBy', invoiceData.CreatedBy);
        reservedRow.set('CreatedAt', invoiceData.CreatedAt);
        reservedRow.set('SubTotal', invoiceData.SubTotal || '');
        reservedRow.set('Phone', invoiceData.Phone || '');
        reservedRow.set('Payment', invoiceData.Payment || '');
        reservedRow.set('Subject', invoiceData.Subject || invoiceData.Services || '');
        
        await reservedRow.save();
        console.log(`[INVOICE] Updated reserved record for ${refNumber}`);
    } else {
        // Create new record (fallback)
        await sheet.addRow({
            InvoiceID: invoiceId,
            Ref: refNumber,
            CustomerID: invoiceData.CustomerID,
            CustomerName: invoiceData.CustomerName,
            Villa: invoiceData.Villa,
            InvoiceDate: invoiceData.InvoiceDate || new Date().toISOString().split('T')[0],
            DueDate: invoiceData.DueDate,
            TotalAmount: invoiceData.TotalAmount,
            Status: invoiceData.Status,
            PaymentMethod: invoiceData.PaymentMethod,
            Start: invoiceData.Start,
            End: invoiceData.End,
            Vehicle: invoiceData.Vehicle,
            PackageID: invoiceData.PackageID,
            Services: invoiceData.Services,
            Notes: invoiceData.Notes,
            CreatedBy: invoiceData.CreatedBy,
            CreatedAt: invoiceData.CreatedAt,
            SubTotal: invoiceData.SubTotal || '',
            Phone: invoiceData.Phone || '',
            Payment: invoiceData.Payment || '',
            Subject: invoiceData.Subject || invoiceData.Services || ''
        });
        console.log(`[INVOICE] Created new record for ${refNumber}`);
        }
        
        return refNumber;
    });
}

async function getInvoices() {
    await loadSheet();
    const sheet = doc.sheetsByTitle['invoices'];
    if (!sheet) {
        return [];
    }
    const rows = await sheet.getRows();
    return mapRowsToObjects(rows, sheet.headerValues);
}

async function updateInvoiceStatus(invoiceId, status, paymentMethod) {
    await loadSheet();
    const sheet = doc.sheetsByTitle['invoices'];
    if (!sheet) {
        throw new Error("Sheet 'invoices' not found.");
    }
    
    const rows = await sheet.getRows();
    
    // Try both InvoiceID and Ref columns
    let row = rows.find(r => r.get('InvoiceID') === invoiceId);
    if (!row) {
        row = rows.find(r => r.get('Ref') === invoiceId);
    }
    
    if (!row) {
        throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    if (status) {
        row.set('Status', status);
    }
    if (paymentMethod) {
        row.set('PaymentMethod', paymentMethod);
    }
    
    await row.save();
}

async function updateInvoiceRecord(invoiceId, updateData) {
    await loadSheet();
    const sheet = doc.sheetsByTitle['invoices'];
    if (!sheet) {
        throw new Error("Sheet 'invoices' not found.");
    }
    
    const rows = await sheet.getRows();
    let row = rows.find(r => r.get('InvoiceID') === invoiceId);
    if (!row) {
        row = rows.find(r => r.get('Ref') === invoiceId);
    }
    
    if (!row) {
        throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    // Update all provided fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
            row.set(key, updateData[key]);
        }
    });
    
    await row.save();

}

async function deleteInvoiceRecord(invoiceId) {
    await loadSheet();
    const sheet = doc.sheetsByTitle['invoices'];
    if (!sheet) {
        throw new Error("Sheet 'invoices' not found.");
    }
    
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('InvoiceID') === invoiceId);
    
    if (!row) {
        throw new Error(`Invoice not found: ${invoiceId}`);
    }
    
    // Get invoice data before deletion
    const invoiceData = {};
    sheet.headerValues.forEach(header => {
        invoiceData[header] = row.get(header);
    });
    
    // Use raw API to append to deleted_invoices sheet
    const { google } = require('googleapis');
    const auth = serviceAccountAuth;
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Prepare data for deleted_invoices (with Ref column)
    const deletedData = [
        invoiceData.InvoiceID || '',
        invoiceData.Ref || '',
        invoiceData.CustomerID || '',
        invoiceData.CustomerName || '',
        invoiceData.Villa || '',
        invoiceData.InvoiceDate || '',
        invoiceData.DueDate || '',
        invoiceData.TotalAmount || '',
        invoiceData.Status || '',
        invoiceData.PaymentMethod || '',
        invoiceData.Notes || '',
        invoiceData.CreatedBy || '',
        invoiceData.CreatedAt || '',
        new Date().toISOString(),
        'System'
    ];
    
    // Headers should already exist in deleted_invoices sheet
    
    // Append deleted invoice data
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'deleted_invoices!A:O',
        valueInputOption: 'RAW',
        resource: { values: [deletedData] }
    });
    
    // Delete from original sheet
    await row.delete();
    

}

async function addWorkerToSheet(workerData) {
  try {
    console.log('[WORKERS] Adding worker to sheet:', workerData);
    await loadSheet();
    const sheet = doc.sheetsByTitle['Workers'];
    if (!sheet) {
      console.error('[WORKERS] Workers sheet not found!');
      throw new Error("Sheet 'Workers' not found.");
    }
    
    console.log('[WORKERS] Sheet found, adding row...');
    await sheet.addRow(workerData);
    console.log('[WORKERS] Worker added successfully to sheet');
    
    // Wait a moment for the sheet to update
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[WORKERS] Sheet update completed');
  } catch (error) {
    console.error('[WORKERS] Error in addWorkerToSheet:', error);
    throw error;
  }
}

async function deleteWorkerFromSheet(workerName) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Workers'];
  if (!sheet) {
    throw new Error("Sheet 'Workers' not found.");
  }
  
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('Name') === workerName);
  
  if (!row) {
    throw new Error(`Worker not found: ${workerName}`);
  }
  
  await row.delete();

}

async function getAdditionalServices() {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Services'];
  if (!sheet) {
    return [];
  }
  const rows = await sheet.getRows();
  return mapRowsToObjects(rows, sheet.headerValues);
}

async function addServiceToSheet(serviceData) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Services'];
  if (!sheet) {
    throw new Error("Sheet 'Services' not found.");
  }
  
  await sheet.addRow(serviceData);

}

async function deleteServiceFromSheet(serviceName) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Services'];
  if (!sheet) {
    throw new Error("Sheet 'Services' not found.");
  }
  
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('ServiceName') === serviceName);
  
  if (!row) {
    throw new Error(`Service not found: ${serviceName}`);
  }
  
  await row.delete();

}

async function getOrCreateInvoiceNumber(customerID, customerName, villa) {
    await loadSheet();
    const sheet = doc.sheetsByTitle['invoices'];
    if (!sheet) {
        throw new Error("Sheet 'invoices' not found.");
    }
    
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const monthKey = `${year}${month}`;
    
    // Reload sheet to get latest data
    const rows = await sheet.getRows();
    
    // For regular customers, check if they already have invoice this month
    if (customerID && customerID !== 'ONE_TIME') {
        const existingInvoice = rows.find(row => 
            row.get('CustomerID') === customerID && 
            row.get('Ref') && 
            row.get('Ref').includes(monthKey)
        );
        
        if (existingInvoice) {
            return existingInvoice.get('Ref');
        }
    }
    
    // Get all existing refs for this month (including reserved ones)
    const monthInvoices = rows.filter(row => 
        row.get('Ref') && 
        row.get('Ref').includes(`GLOGO-${monthKey}`)
    );
    
    // Check deleted invoices using API
    let deletedInvoices = [];
    try {
        const { google } = require('googleapis');
        const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'deleted_invoices!B:B'
        });
        if (result.data.values) {
            deletedInvoices = result.data.values.flat().filter(ref => 
                ref && ref.includes(`GLOGO-${monthKey}`)
            );
        }
    } catch (error) {
        // deleted_invoices sheet doesn't exist yet
    }
    
    // Combine active and deleted invoice refs
    const activeRefs = monthInvoices.map(row => row.get('Ref')).filter(ref => ref);
    const allRefs = [...activeRefs, ...deletedInvoices];
    
    // Find next available number (ensuring uniqueness)
    let nextNumber = 1;
    let invoiceNumber;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
        invoiceNumber = `GLOGO-${monthKey}${nextNumber.toString().padStart(3, '0')}`;
        
        // Check if this number already exists
        const exists = allRefs.includes(invoiceNumber);
        
        if (!exists) {
            // ATOMIC OPERATION: Immediately reserve this number by creating a placeholder
            try {
                await sheet.addRow({
                    InvoiceID: `RESERVED-${Date.now()}`,
                    Ref: invoiceNumber,
                    CustomerID: customerID || 'RESERVED',
                    CustomerName: customerName || 'RESERVED',
                    Villa: villa || 'RESERVED',
                    Status: 'RESERVED',
                    TotalAmount: 0,
                    CreatedAt: new Date().toISOString(),
                    CreatedBy: 'System-Reserve'
                });
                
                console.log(`[INVOICE] Reserved number: ${invoiceNumber}`);
                isUnique = true;
            } catch (error) {
                console.log(`[INVOICE] Failed to reserve ${invoiceNumber}, trying next...`);
                nextNumber++;
                attempts++;
            }
        } else {
            nextNumber++;
        }
        
        // Safety check to prevent infinite loop
        if (nextNumber > 999) {
            throw new Error('Maximum invoice numbers reached for this month');
        }
    }
    
    if (!isUnique) {
        throw new Error('Failed to reserve unique invoice number after multiple attempts');
    }
    
    return invoiceNumber;
}

async function findUserByUsername(username) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Users'];
  if (!sheet) {
    throw new Error("Sheet 'Users' not found.");
  }
  
  const rows = await sheet.getRows();
  const users = mapRowsToObjects(rows, sheet.headerValues);
  
  const user = users.find(u => u.Username === username);
  return user || null;
}

async function addUser(userData) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Users'];
  if (!sheet) {
    throw new Error("Sheet 'Users' not found.");
  }
  
  const userRecord = {
    UserID: `USER-${Date.now()}`,
    Username: userData.username,
    Password: userData.password,
    PlainPassword: userData.plainPassword || userData.password,
    Role: userData.role,
    Status: 'Active',
    CreatedAt: new Date().toISOString()
  };
  
  await sheet.addRow(userRecord);

}

async function getUsers() {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Users'];
  if (!sheet) {
    throw new Error("Sheet 'Users' not found.");
  }
  const rows = await sheet.getRows();
  return mapRowsToObjects(rows, sheet.headerValues);
}

async function updateUser(userId, updatedData) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Users'];
  if (!sheet) {
    throw new Error("Sheet 'Users' not found.");
  }
  
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('UserID') === userId);
  
  if (!row) {
    throw new Error('User not found');
  }
  
  Object.keys(updatedData).forEach(key => {
    row.set(key, updatedData[key]);
  });
  
  await row.save();

}

async function deleteUser(userId) {
  await loadSheet();
  const sheet = doc.sheetsByTitle['Users'];
  if (!sheet) {
    throw new Error("Sheet 'Users' not found.");
  }
  
  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('UserID') === userId);
  
  if (!row) {
    throw new Error('User not found');
  }
  
  await row.delete();

}

async function updateTaskInSheet(taskId, updates) {
  return await apiRetry(async () => {
    const startTime = Date.now();
    await loadSheet();
    const sheet = doc.sheetsByTitle['ScheduledTasks'];
    if (!sheet) return false;
    
    const rows = await sheet.getRows();
    const taskIdParts = taskId.split('-');
    const customerId = `${taskIdParts[0]}-${taskIdParts[1]}`;
    const day = taskIdParts[2];
    const carPlate = taskIdParts.slice(4).join('-') || '';
    
    const row = rows.find(r => 
      r.get('CustomerID') === customerId &&
      r.get('Day') === day &&
      (r.get('CarPlate') || '') === carPlate
    );
    
    if (row) {
      Object.keys(updates).forEach(key => {
        row.set(key, updates[key]);
      });
      await row.save();
      clearTasksCache(); // Clear cache after update
      console.log(`[FAST-UPDATE] Updated ${taskId} in ${Date.now() - startTime}ms`);
      return true;
    }
    return false;
  }, 2, 2000); // 2 retries, 2s delay
}

async function addAuditLog(auditData) {
  try {
    await loadSheet();
    let sheet = doc.sheetsByTitle['ScheduleAuditLog'];
    
    if (!sheet) {
      console.log('[AUDIT] ScheduleAuditLog sheet not found, creating it...');
      sheet = await doc.addSheet({
        title: 'ScheduleAuditLog',
        headerValues: ['LogID', 'Timestamp', 'UserID', 'UserName', 'Action', 'CustomerID', 'CustomerName', 'Villa', 'CarPlate', 'Day', 'Time', 'OldWorker', 'NewWorker', 'OldWashType', 'NewWashType', 'ChangeReason']
      });
      console.log('[AUDIT] ScheduleAuditLog sheet created successfully');
    }
    
    const logRecord = {
      LogID: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      Timestamp: new Date().toISOString(),
      UserID: auditData.userId || 'SYSTEM',
      UserName: auditData.userName || 'System',
      Action: auditData.action,
      CustomerID: auditData.customerID || '',
      CustomerName: auditData.customerName || '',
      Villa: auditData.villa || '',
      CarPlate: auditData.carPlate || '',
      Day: auditData.day || '',
      Time: auditData.time || '',
      OldWorker: auditData.oldWorker || '',
      NewWorker: auditData.newWorker || '',
      OldWashType: auditData.oldWashType || '',
      NewWashType: auditData.newWashType || '',
      ChangeReason: auditData.changeReason || ''
    };
    
    await sheet.addRow(logRecord);
    console.log(`[AUDIT] ${auditData.action} logged for ${auditData.customerName || 'Unknown'}`);
  } catch (error) {
    console.error('[AUDIT] Error adding audit log:', error.message);
    // Don't throw error to avoid breaking the main functionality
  }
}

async function getAuditLogs(filters = {}) {
  try {
    await loadSheet();
    let sheet = doc.sheetsByTitle['ScheduleAuditLog'];
    
    if (!sheet) {
      console.log('[AUDIT] ScheduleAuditLog sheet not found, creating it...');
      // Create the sheet if it doesn't exist
      sheet = await doc.addSheet({
        title: 'ScheduleAuditLog',
        headerValues: ['LogID', 'Timestamp', 'UserID', 'UserName', 'Action', 'CustomerID', 'CustomerName', 'Villa', 'CarPlate', 'Day', 'Time', 'OldWorker', 'NewWorker', 'OldWashType', 'NewWashType', 'ChangeReason']
      });
      console.log('[AUDIT] ScheduleAuditLog sheet created successfully');
      return []; // Return empty array for new sheet
    }
    
    const rows = await sheet.getRows();
    if (!rows || rows.length === 0) {
      console.log('[AUDIT] No audit logs found');
      return [];
    }
    
    let logs = mapRowsToObjects(rows, sheet.headerValues);
    
    // Apply filters
    if (filters.userId) {
      logs = logs.filter(log => log.UserID === filters.userId);
    }
    if (filters.action) {
      logs = logs.filter(log => log.Action === filters.action);
    }
    if (filters.customerID) {
      logs = logs.filter(log => log.CustomerID === filters.customerID);
    }
    if (filters.dateFrom) {
      logs = logs.filter(log => new Date(log.Timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      logs = logs.filter(log => new Date(log.Timestamp) <= new Date(filters.dateTo));
    }
    
    console.log(`[AUDIT] Found ${logs.length} audit logs after filtering`);
    return logs.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  } catch (error) {
    console.error('[AUDIT] Error getting audit logs:', error.message);
    return [];
  }
}

async function getSheetData(sheetName) {
  await loadSheet();
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    console.log(`Sheet '${sheetName}' not found`);
    return [];
  }
  const rows = await sheet.getRows();
  return mapRowsToObjects(rows, sheet.headerValues);
}

async function detectDuplicateInvoices() {
  await loadSheet();
  const sheet = doc.sheetsByTitle['invoices'];
  if (!sheet) {
    return { duplicates: [], summary: { total: 0, duplicateRefs: 0, duplicateCustomers: 0 } };
  }
  
  const rows = await sheet.getRows();
  const invoices = mapRowsToObjects(rows, sheet.headerValues);
  
  // Filter out reserved invoices
  const activeInvoices = invoices.filter(inv => inv.Status !== 'RESERVED');
  
  const duplicates = [];
  const refCounts = {};
  const customerMonthCounts = {};
  
  // Check for duplicate Ref numbers
  activeInvoices.forEach(invoice => {
    const ref = invoice.Ref;
    if (ref) {
      if (!refCounts[ref]) {
        refCounts[ref] = [];
      }
      refCounts[ref].push(invoice);
    }
    
    // Check for duplicate customer invoices in same month
    if (invoice.CustomerID && invoice.CustomerID !== 'ONE_TIME') {
      const invoiceDate = new Date(invoice.InvoiceDate || invoice.CreatedAt);
      const monthKey = `${invoice.CustomerID}-${invoiceDate.getFullYear()}-${invoiceDate.getMonth()}`;
      
      if (!customerMonthCounts[monthKey]) {
        customerMonthCounts[monthKey] = [];
      }
      customerMonthCounts[monthKey].push(invoice);
    }
  });
  
  // Find duplicate Refs
  Object.keys(refCounts).forEach(ref => {
    if (refCounts[ref].length > 1) {
      duplicates.push({
        type: 'DUPLICATE_REF',
        ref: ref,
        count: refCounts[ref].length,
        invoices: refCounts[ref],
        severity: 'HIGH'
      });
    }
  });
  
  // Find duplicate customer invoices in same month
  Object.keys(customerMonthCounts).forEach(monthKey => {
    if (customerMonthCounts[monthKey].length > 1) {
      const [customerID, year, month] = monthKey.split('-');
      duplicates.push({
        type: 'DUPLICATE_CUSTOMER_MONTH',
        customerID: customerID,
        month: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}`,
        count: customerMonthCounts[monthKey].length,
        invoices: customerMonthCounts[monthKey],
        severity: 'MEDIUM'
      });
    }
  });
  
  const summary = {
    total: activeInvoices.length,
    duplicateRefs: Object.keys(refCounts).filter(ref => refCounts[ref].length > 1).length,
    duplicateCustomers: Object.keys(customerMonthCounts).filter(key => customerMonthCounts[key].length > 1).length,
    totalDuplicateInvoices: duplicates.reduce((sum, dup) => sum + dup.count - 1, 0)
  };
  
  return { duplicates, summary };
}

module.exports = {
  getCustomers,
  getHistoryForCar,
  getAllHistory,
  addHistoryRecord,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  searchCustomers,
  getWorkers,
  addWorkerToSheet,
  deleteWorkerFromSheet,
  getAdditionalServices,
  addServiceToSheet,
  deleteServiceFromSheet,
  clearSheet,
  addRowsToSheet,
  getScheduledTasks,
  addRowToSheet,
  clearAndWriteSheet,
  updateTaskInSheet,
  addInvoiceRecord,
  getInvoices,
  updateInvoiceStatus,
  updateInvoiceRecord,
  deleteInvoiceRecord,
  getOrCreateInvoiceNumber,
  findUserByUsername,
  addUser,
  getUsers,
  updateUser,
  deleteUser,
  addAuditLog,
  getAuditLogs,
  getSheetData,
  detectDuplicateInvoices
};