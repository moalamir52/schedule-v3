// Fix customer fields and invoice display issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Customer Fields & Invoice Display');
console.log('==========================================');

// 1. Fix createClient to include Phone, Cars, Start Date
const clientsControllerPath = path.join(__dirname, 'api', 'controllers', 'clientsController.js');
let clientsContent = fs.readFileSync(clientsControllerPath, 'utf8');

const fixedCreateClient = `const createClient = async (req, res) => {
  try {
    console.log('[CREATE-CLIENT] Request body:', req.body);
    
    // Ensure all required fields are included
    const customerData = {
      ...req.body,
      Phone: req.body.Phone || req.body.phone || '',
      CarPlates: req.body.CarPlates || req.body.cars || req.body.Cars || '',
      'Number of car': req.body['Number of car'] || req.body.numberOfCars || 1,
      'start date': req.body['start date'] || req.body.startDate || (() => {
        const now = new Date();
        const day = now.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return \`\${day}-\${month}-\${year}\`;
      })()
    };
    
    console.log('[CREATE-CLIENT] Processed data:', customerData);
    
    const result = await db.addCustomer(customerData);
    
    console.log('[CREATE-CLIENT] Customer created successfully:', result);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[CREATE-CLIENT] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};`;

// Replace createClient function
clientsContent = clientsContent.replace(
  /const createClient = async \(req, res\) => \{[\s\S]*?\n\};/,
  fixedCreateClient
);

fs.writeFileSync(clientsControllerPath, clientsContent);

// 2. Fix invoice controller to show Start/End dates immediately
const invoiceControllerPath = path.join(__dirname, 'api', 'controllers', 'invoiceController.js');
let invoiceContent = fs.readFileSync(invoiceControllerPath, 'utf8');

// Add immediate date calculation for invoice display
const fixedInvoiceCreation = `    // Calculate billing cycle immediately for display
    let displayStart = '';
    let displayEnd = '';
    
    if (isRegularInvoice && billingCycle) {
      displayStart = \`\${String(billingCycle.startDate.getDate()).padStart(2, '0')}/\${String(billingCycle.startDate.getMonth() + 1).padStart(2, '0')}/\${billingCycle.startDate.getFullYear()}\`;
      displayEnd = \`\${String(billingCycle.endDate.getDate()).padStart(2, '0')}/\${String(billingCycle.endDate.getMonth() + 1).padStart(2, '0')}/\${billingCycle.endDate.getFullYear()}\`;
    } else if (!isRegularInvoice) {
      displayStart = startDate || new Date().toLocaleDateString('en-GB');
      displayEnd = '';
    }

    const glogoRef = await addInvoiceRecord({
      InvoiceID: null, // سيتم إنشاؤه تلقائياً
      Ref: ref,
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
      Notes: isRegularInvoice ? (notes || \`Service Period: \${invoiceData.serviceDate}\`) : \`Phone: \${invoiceData.phone}, Vehicle: \${invoiceData.vehicleType}, Services: \${invoiceData.services}\`,
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
    });`;

// Replace the invoice creation part
invoiceContent = invoiceContent.replace(
  /const glogoRef = await addInvoiceRecord\({[\s\S]*?\n    res\.json\({[\s\S]*?\n    }\);/,
  fixedInvoiceCreation
);

fs.writeFileSync(invoiceControllerPath, invoiceContent);

console.log('✅ Customer fields fix applied!');
console.log('✅ Invoice display fix applied!');
console.log('🚀 Deploy to fix both issues');

module.exports = { success: true };