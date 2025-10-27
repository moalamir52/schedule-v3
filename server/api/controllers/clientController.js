const { 
  getCustomers, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer, 
  restoreCustomer, 
  searchCustomers 
} = require('../../services/googleSheetsService');

async function getAllClients(req, res) {
  try {
    const clients = await getCustomers();
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    
    const newClient = await addCustomer(clientData);
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
    const result = await updateCustomer(decodedId, updatedData);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update client' });
  }
}

async function deleteClient(req, res) {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    const deletedData = await deleteCustomer(decodedId);
    res.status(200).json({ message: 'Client deleted', data: deletedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
}

async function restoreClient(req, res) {
  try {
    const clientData = req.body;
    const restoredClient = await restoreCustomer(clientData);
    res.status(200).json(restoredClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to restore client' });
  }
}

async function searchClients(req, res) {
  try {
    const { q } = req.query;
    const clients = await searchCustomers(q);
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
}

async function getNextCustomerId(req, res) {
  try {
    const clients = await getCustomers();
    
    // Find the highest customer ID number
    let maxId = 0;
    clients.forEach(client => {
      if (client.CustomerID) {
        const match = client.CustomerID.match(/CUST-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxId) {
            maxId = num;
          }
        }
      }
    });
    
    // Generate next ID
    const nextId = `CUST-${String(maxId + 1).padStart(3, '0')}`;
    
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