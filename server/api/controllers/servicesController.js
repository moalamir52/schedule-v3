const db = require('../../services/databaseService');

const getServices = async (req, res) => {
  // Force console output
  process.stdout.write('[SERVICES] getServices called\n');
  try {
    process.stdout.write('[SERVICES] Calling db.getServices()...\n');
    let services = await db.getServices();
    
    // Normalize service data structure
    services = services.map(service => ({
      ServiceID: service.ServiceID || service.serviceId || service.id,
      ServiceName: service.ServiceName || service.serviceName || service.name,
      Price: service.Price || service.price || 0,
      Status: service.Status || service.status || 'Active'
    }));
    
    process.stdout.write(`[SERVICES] Got services: ${services.length}\n`);
    res.json(services); // Return services directly as array
  } catch (error) {
    process.stderr.write(`[SERVICES] Error getting services: ${error.message}\n`);
    // Return default services if table doesn't exist
    const defaultServices = [
      { ServiceID: 'SERV-001', ServiceName: 'Car Wash - Exterior', Price: 25, Status: 'Active' },
      { ServiceID: 'SERV-002', ServiceName: 'Car Wash - Interior', Price: 35, Status: 'Active' },
      { ServiceID: 'SERV-003', ServiceName: 'Car Wash - Full Service', Price: 50, Status: 'Active' }
    ];
    process.stdout.write('[SERVICES] Returning default services\n');
    res.json(defaultServices); // Return services directly as array
  }
};

const addService = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Service name is required' });
    }

    const services = await db.getServices();
    const nextId = services.length + 1;
    
    const newService = {
      ServiceID: `SERV-${nextId.toString().padStart(3, '0')}`,
      ServiceName: name.trim(),
      Price: price || 0,
      Description: description || '',
      Status: 'Active'
    };
    
    await db.addService(newService);
    
    res.json({ success: true, service: newService, message: 'Service added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Service ID is required' });
    }

    await db.supabase.request('DELETE', `/Services?ServiceID=eq.${id}`);
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getServices, addService, deleteService };