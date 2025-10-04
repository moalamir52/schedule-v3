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
    const newClient = await addCustomer(clientData);
    res.status(201).json(newClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create client' });
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

module.exports = {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
  restoreClient,
  searchClients
};