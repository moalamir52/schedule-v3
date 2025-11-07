const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const scheduleService = {
  async autoAssignSchedule() {
    const response = await fetch(`${API_BASE_URL}/schedule/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  async getWorkers() {
    const response = await fetch(`${API_BASE_URL}/workers`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  async saveScheduleChanges(changes) {
    const response = await fetch(`${API_BASE_URL}/schedule/assign/batch-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': localStorage.getItem('userId') || 'WEB-USER',
        'X-User-Name': localStorage.getItem('userName') || 'Web User'
      },
      body: JSON.stringify({ changes })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save changes');
    }
    
    return await response.json();
  },

  async getSchedule() {
    const response = await fetch(`${API_BASE_URL}/schedule/assign/current`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    
    return await response.json();
  }
};

export default scheduleService;