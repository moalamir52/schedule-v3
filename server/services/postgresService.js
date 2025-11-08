// PostgreSQL Database Service
const { Client } = require('pg');

class PostgresService {
  constructor() {
    this.client = null;
    this.init();
  }

  init() {
    console.log('🐘 Initializing PostgreSQL connection...');
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async connect() {
    if (!this.client._connected) {
      await this.client.connect();
    }
  }

  async getCustomers() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM customers WHERE "Status" = $1', ['Active']);
      return result.rows;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async addCustomer(customerData) {
    try {
      await this.connect();
      const result = await this.client.query(
        'INSERT INTO customers ("CustomerID", "Name", "Villa", "CarPlates", "Washman_Package", "Days", "Time", "Status") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          customerData.CustomerID || `CUST-${Date.now()}`,
          customerData.Name || customerData.CustomerName,
          customerData.Villa,
          customerData.CarPlates,
          customerData.Washman_Package,
          customerData.Days || customerData.WashDay,
          customerData.Time || customerData.WashTime,
          'Active'
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  async addWorker(workerData) {
    try {
      await this.connect();
      const result = await this.client.query(
        'INSERT INTO workers ("WorkerID", "Name", "Phone", "Status") VALUES ($1, $2, $3, $4) RETURNING *',
        [
          workerData.WorkerID || `WORKER-${Date.now()}`,
          workerData.Name,
          workerData.Phone,
          'Active'
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding worker:', error);
      throw error;
    }
  }

  async getAllHistory() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM wash_history ORDER BY "WashDate" DESC');
      return result.rows;
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  async addUser(userData) {
    try {
      await this.connect();
      const result = await this.client.query(
        'INSERT INTO users ("UserID", "Username", "Password", "Role", "Status") VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          userData.UserID || `USER-${Date.now()}`,
          userData.Username,
          userData.Password,
          userData.Role,
          'Active'
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM users ORDER BY "Username"');
      return result.rows;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getWorkers() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM workers WHERE "Status" = $1', ['Active']);
      return result.rows;
    } catch (error) {
      console.error('Error fetching workers:', error);
      return [];
    }
  }

  async findUserByUsername(username) {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM users WHERE "Username" = $1', [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }
}

module.exports = new PostgresService();