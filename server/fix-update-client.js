// Fix updateClient 500 error
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Update Client Error');
console.log('=============================');

const clientsControllerPath = path.join(__dirname, 'api', 'controllers', 'clientsController.js');
let content = fs.readFileSync(clientsControllerPath, 'utf8');

const fixedUpdateClient = `const updateClient = async (req, res) => {
  try {
    console.log('[UPDATE-CLIENT] Request params:', req.params);
    console.log('[UPDATE-CLIENT] Request body:', req.body);
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Customer ID is required' });
    }
    
    // Prepare update data with proper field mapping
    const updateData = {
      Name: req.body.Name || req.body.name,
      Villa: req.body.Villa || req.body.villa,
      Phone: req.body.Phone || req.body.phone || '',
      CarPlates: req.body.CarPlates || req.body.cars || req.body.Cars || '',
      'Washman_Package': req.body['Washman_Package'] || req.body.package,
      Days: req.body.Days || req.body.days,
      Time: req.body.Time || req.body.time,
      Status: req.body.Status || req.body.status || 'Active',
      Fee: req.body.Fee || req.body.fee || 0,
      'Number of car': req.body['Number of car'] || req.body.numberOfCars || 1,
      'start date': req.body['start date'] || req.body.startDate || (() => {
        const now = new Date();
        const day = now.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[now.getMonth()];
        const year = now.getFullYear().toString().slice(-2);
        return \`\${day}-\${month}-\${year}\`;
      })(),
      Notes: req.body.Notes || req.body.notes || ''
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log('[UPDATE-CLIENT] Processed update data:', updateData);
    
    const result = await db.updateCustomer(id, updateData);
    
    console.log('[UPDATE-CLIENT] Update result:', result);
    
    res.json({ success: true, data: result, message: 'Customer updated successfully' });
    
  } catch (error) {
    console.error('[UPDATE-CLIENT] Error:', error);
    console.error('[UPDATE-CLIENT] Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
};`;

// Replace updateClient function
content = content.replace(
  /const updateClient = async \(req, res\) => \{[\s\S]*?\n\};/,
  fixedUpdateClient
);

fs.writeFileSync(clientsControllerPath, content);

console.log('✅ Update client function fixed!');
console.log('🚀 Deploy to fix customer editing');

module.exports = { success: true };