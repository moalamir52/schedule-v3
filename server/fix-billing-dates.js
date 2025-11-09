// Fix billing date calculation
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Billing Date Calculation');
console.log('==================================');

const invoiceControllerPath = path.join(__dirname, 'api', 'controllers', 'invoiceController.js');
let content = fs.readFileSync(invoiceControllerPath, 'utf8');

// Fix the billing cycle calculation
const fixedBillingCalculation = `      // Parse customer start date properly
      let startDateStr = customerData['start date'] || customerData.Start_Date || customerData['Start Date'] || customerData.StartDate || customerData.CreatedAt;
      
      if (!startDateStr) {
        console.warn(\`No start date found for customer \${customerID}, using current date as fallback\`);
        const now = new Date();
        const day = now.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        startDateStr = \`\${day}-\${month}-\${year}\`;
      }
      
      console.log('Raw start date string:', startDateStr);
      
      // Parse different date formats
      let contractStartDate;
      
      // Try DD-MMM-YY format (1-Nov-25)
      if (startDateStr.includes('-') && startDateStr.split('-').length === 3) {
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
      }
      
      // Fallback to standard date parsing
      if (!contractStartDate || isNaN(contractStartDate.getTime())) {
        contractStartDate = new Date(startDateStr);
      }
      
      if (isNaN(contractStartDate.getTime())) {
        throw new Error('Invalid customer start date: ' + startDateStr);
      }
      
      console.log('Parsed contract start date:', contractStartDate);
      console.log('Contract start day of month:', contractStartDate.getDate());
      
      const today = new Date();
      console.log('Today:', today);
      
      // Calculate current billing cycle based on contract start day
      const contractDay = contractStartDate.getDate();
      
      // Find the current billing period
      let billingStartDate = new Date(today.getFullYear(), today.getMonth(), contractDay);
      
      // If contract day hasn't come this month, use last month
      if (billingStartDate > today) {
        billingStartDate = new Date(today.getFullYear(), today.getMonth() - 1, contractDay);
      }
      
      console.log('Calculated billing start date:', billingStartDate);
      
      const billingEndDate = new Date(billingStartDate);
      billingEndDate.setMonth(billingEndDate.getMonth() + 1);
      billingEndDate.setDate(billingEndDate.getDate() - 1); // End day before next cycle
      
      console.log('Calculated billing end date:', billingEndDate);
      
      billingCycle = {
        startDate: billingStartDate,
        endDate: billingEndDate
      };`;

// Replace the billing calculation section
content = content.replace(
  /let startDateStr = customerData\['start date'\][\s\S]*?billingCycle = \{[\s\S]*?\};/,
  fixedBillingCalculation
);

fs.writeFileSync(invoiceControllerPath, content);

console.log('✅ Billing date calculation fixed!');
console.log('📅 Now uses actual contract start day for billing cycles');
console.log('🚀 Deploy to fix invoice dates');

module.exports = { success: true };