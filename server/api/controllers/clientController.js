const db = require('../../services/databaseService');

async function getAllClients(req, res) {
  try {
    console.log('[GET-CLIENTS] Starting to fetch clients...');
    const clients = await db.getCustomers();
    console.log('[GET-CLIENTS] Found', clients.length, 'clients');
    res.status(200).json(clients);
  } catch (error) {
    console.error('[GET-CLIENTS] Error:', error);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}

async function createClient(req, res) {
  try {
    const clientData = req.body;
    
    // Process cars and appointments data
    if (clientData.cars && clientData.cars.length > 0) {
      clientData['Number of car'] = clientData.cars.length;
      clientData.CarPlates = clientData.cars.map(car => car.plate).join(', ');
    }
    
    // Format appointments properly
    if (clientData.appointments && clientData.appointments.length > 0) {
      const dayAbbr = {
        'Saturday': 'Sat',
        'Monday': 'Mon',
        'Tuesday': 'Tue', 
        'Wednesday': 'Wed',
        'Thursday': 'Thu',
        'Friday': 'Fri'
      };
      
      // Sort appointments by day order for consistency
      const dayOrder = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const sortedAppointments = clientData.appointments.sort((a, b) => 
        dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
      );
      
      const formattedAppointments = sortedAppointments.map(apt => 
        `${dayAbbr[apt.day] || apt.day}@${apt.time}`
      );
      
      clientData.Days = sortedAppointments.map(apt => dayAbbr[apt.day] || apt.day).join('-');
      clientData.Time = formattedAppointments.join(', ');
    }
    
    // Format start date properly
    if (clientData['start date']) {
      const date = new Date(clientData['start date']);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear().toString().slice(-2)}`;
      clientData['start date'] = formattedDate;
    }
    
    // Process additional services
    if (clientData.additionalServices && clientData.additionalServices.length > 0) {
      const servicesText = clientData.additionalServices
        .map(service => `${service.name}: ${service.price}`)
        .join(', ');
      clientData.Serves = servicesText;
    }
    
    // Set default lock status for new clients
    clientData.isLocked = 'FALSE';
    
    console.log('[CREATE-CLIENT] Processing client data:', {
      customerId: clientData.CustomerID,
      name: clientData.Name,
      cars: clientData.cars?.length || 0,
      appointments: clientData.appointments?.length || 0,
      additionalServices: clientData.additionalServices?.length || 0,
      formattedDays: clientData.Days,
      formattedTime: clientData.Time,
      formattedDate: clientData['start date']
    });
    
    const newClient = await db.addCustomer(clientData);
    res.status(201).json(newClient);
  } catch (error) {
    console.error('[CREATE-CLIENT] Error:', error);
    res.status(500).json({ error: 'Failed to create client: ' + error.message });
  }
}

async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    const updatedData = req.body;
    
    // Map frontend field names to database field names
    const mappedData = {};
    if (updatedData.CustomerName || updatedData.Name) mappedData.Name = updatedData.CustomerName || updatedData.Name;
    if (updatedData.Villa) mappedData.Villa = updatedData.Villa;
    if (updatedData.Phone) mappedData.Phone = updatedData.Phone;
    if (updatedData.CarPlates) mappedData.CarPlates = updatedData.CarPlates;
    if (updatedData.Washman_Package) mappedData.Washman_Package = updatedData.Washman_Package;
    if (updatedData.WashDay || updatedData.Days) mappedData.Days = updatedData.WashDay || updatedData.Days;
    if (updatedData.WashTime || updatedData.Time) mappedData.Time = updatedData.WashTime || updatedData.Time;
    if (updatedData.Status) mappedData.Status = updatedData.Status;
    if (updatedData.Notes) mappedData.Notes = updatedData.Notes;
    if (updatedData.Fee !== undefined) mappedData.Fee = updatedData.Fee;
    if (updatedData['Number of car'] !== undefined) mappedData['Number of car'] = updatedData['Number of car'];
    if (updatedData['start date']) mappedData['start date'] = updatedData['start date'];
    
    const result = await db.updateCustomer(decodedId, mappedData);
    res.status(200).json(result);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client: ' + error.message });
  }
}

async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    const deletedData = await db.deleteCustomer(decodedId);
    res.status(200).json({ message: 'Client deleted', data: deletedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
}

async function restoreClient(req, res) {
  try {
    const clientData = req.body;
    const restoredClient = await db.addCustomer(clientData);
    res.status(200).json(restoredClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to restore client' });
  }
}

async function searchClients(req, res) {
  try {
    const { q } = req.query;
    const clients = await db.searchCustomers(q);
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
}

async function getNextCustomerId(req, res) {
  try {
    const clients = await db.getCustomers();
    const nextNum = clients.length + 1;
    const nextId = `CUST-${String(nextNum).padStart(3, '0')}`;
    
    res.status(200).json({ success: true, nextId });
  } catch (error) {
    console.error('Error generating next customer ID:', error);
    res.status(500).json({ success: false, error: 'Failed to generate customer ID' });
  }
}

module.exports = {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  restoreClient,
  searchClients,
  getNextCustomerId
};