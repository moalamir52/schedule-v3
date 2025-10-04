const { getAdditionalServices, addServiceToSheet, deleteServiceFromSheet } = require('../../services/googleSheetsService');

const getServices = async (req, res) => {
  try {
    const services = await getAdditionalServices();
    res.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: error.message });
  }
};

const addService = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    const services = await getAdditionalServices();
    const serviceIds = services.map(s => {
      const id = s.ServiceID || s.serviceId || '';
      if (typeof id === 'string') {
        if (id.startsWith('SRV-')) {
          return parseInt(id.replace('SRV-', '')) || 0;
        }
        if (id.startsWith('SERV-')) {
          return parseInt(id.replace('SERV-', '')) || 0;
        }
      }
      return parseInt(id) || 0;
    });
    const nextId = Math.max(...serviceIds, 0) + 1;
    
    const newService = {
      ServiceID: `SERV-${nextId.toString().padStart(3, '0')}`,
      ServiceName: name.trim(),
      Status: 'Active'
    };
    
    await addServiceToSheet(newService);
    
    res.json({ success: true, service: newService });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    await deleteServiceFromSheet(name);
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getServices, addService, deleteService };