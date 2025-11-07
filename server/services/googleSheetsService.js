const db = require('./databaseService');

// Customer operations
async function getCustomers() {
  return await db.getCustomers();
}

// Invoice operations
async function getInvoices() {
  return await db.getInvoices();
}

async function addInvoiceRecord(invoiceData) {
  const result = await db.addInvoice(invoiceData);
  return invoiceData.InvoiceID || `INV-${result.id}`;
}

async function updateInvoiceStatus(invoiceId, status, paymentMethod) {
  return await db.run(
    'UPDATE invoices SET Status = ?, PaymentMethod = ? WHERE InvoiceID = ?',
    [status, paymentMethod || '', invoiceId]
  );
}

async function updateInvoiceRecord(invoiceId, updateData) {
  const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updateData);
  values.push(invoiceId);
  
  return await db.run(
    `UPDATE invoices SET ${fields} WHERE InvoiceID = ?`,
    values
  );
}

async function deleteInvoiceRecord(invoiceId) {
  return await db.run('DELETE FROM invoices WHERE InvoiceID = ?', [invoiceId]);
}

async function getOrCreateInvoiceNumber(customerID, customerName, villa) {
  const invoices = await getInvoices();
  const nextNumber = invoices.length + 1;
  return `INV-${nextNumber.toString().padStart(4, '0')}`;
}

async function detectDuplicateInvoices() {
  const invoices = await getInvoices();
  const duplicates = [];
  const seen = new Map();
  
  for (const invoice of invoices) {
    const key = `${invoice.CustomerID}-${invoice.InvoiceDate}`;
    if (seen.has(key)) {
      duplicates.push({
        original: seen.get(key),
        duplicate: invoice
      });
    } else {
      seen.set(key, invoice);
    }
  }
  
  return {
    duplicates,
    summary: {
      totalDuplicateInvoices: duplicates.length * 2,
      duplicateGroups: duplicates.length
    }
  };
}

// Services operations
async function getAdditionalServices() {
  return await db.getServices();
}

async function addServiceToSheet(serviceData) {
  return await db.addService(serviceData);
}

async function deleteServiceFromSheet(serviceName) {
  return await db.run('UPDATE Services SET Status = ? WHERE ServiceName = ?', ['Inactive', serviceName]);
}

// History operations
async function getAllHistory() {
  return await db.getAllHistory();
}

module.exports = {
  getCustomers,
  getInvoices,
  addInvoiceRecord,
  updateInvoiceStatus,
  updateInvoiceRecord,
  deleteInvoiceRecord,
  getOrCreateInvoiceNumber,
  detectDuplicateInvoices,
  getAdditionalServices,
  addServiceToSheet,
  deleteServiceFromSheet,
  getAllHistory
};