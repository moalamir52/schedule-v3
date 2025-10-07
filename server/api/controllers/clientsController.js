const { getCustomers } = require('../../services/googleSheetsService');

const getAvailableClients = async (req, res) => {
  try {
    const customers = await getCustomers();
    const activeCustomers = customers.filter(customer => customer.Status === 'Active');
    
    res.json({
      success: true,
      clients: activeCustomers
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAvailableClients
};