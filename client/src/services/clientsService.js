const API_URL = import.meta.env.VITE_API_URL;

const clientsService = {
  async getAllClients() {
    try {
      const response = await fetch(`${API_URL}/api/clients`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }
  },

  async createClient(clientData) {
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }
  },

  async updateClient(clientId, updatedData) {
    try {
      const response = await fetch(`${API_URL}/api/clients/${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update client: ${error.message}`);
    }
  },

  async deleteClient(clientId) {
    try {
      const response = await fetch(`${API_URL}/api/clients/${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  },
};

export default clientsService;