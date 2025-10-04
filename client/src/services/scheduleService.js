const API_BASE_URL = 'http://localhost:5000/api';

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
  }
};

export default scheduleService;