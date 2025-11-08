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
        'INSERT INTO users (username, password, created_at) VALUES ($1, $2, $3) RETURNING *',
        [
          userData.username || userData.Username,
          userData.password || userData.Password,
          new Date().toISOString()
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
      const result = await this.client.query('SELECT * FROM users ORDER BY username');
      return result.rows.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        created_at: user.created_at
      }));
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
      const result = await this.client.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      if (user) {
        // Map PostgreSQL fields to expected format
        return {
          UserID: user.id,
          Username: user.username,
          Password: user.password,
          Status: 'Active'
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  // Services methods
  async getServices() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM "Services" WHERE "Status" = $1', ['Active']);
      return result.rows;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  }

  async addService(serviceData) {
    try {
      await this.connect();
      const result = await this.client.query(
        'INSERT INTO "Services" ("ServiceID", "ServiceName", "Price", "Description", "Status") VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          serviceData.ServiceID || `SRV-${Date.now()}`,
          serviceData.ServiceName,
          serviceData.Price,
          serviceData.Description,
          'Active'
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }

  // Invoices methods
  async getInvoices() {
    try {
      await this.connect();
      const result = await this.client.query('SELECT * FROM invoices ORDER BY "CreatedAt" DESC');
      return result.rows.map(invoice => ({
        ...invoice,
        TotalAmount: parseFloat(invoice.TotalAmount) || 0
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async addInvoice(invoiceData) {
    try {
      await this.connect();
      const result = await this.client.query(
        'INSERT INTO invoices ("InvoiceID", "Ref", "CustomerID", "CustomerName", "Villa", "TotalAmount", "Status", "CreatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          invoiceData.InvoiceID || `INV-${Date.now()}`,
          invoiceData.Ref,
          invoiceData.CustomerID,
          invoiceData.CustomerName,
          invoiceData.Villa,
          parseFloat(invoiceData.TotalAmount) || 0,
          'Pending',
          new Date().toISOString()
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  }

  async getNextInvoiceRef() {
    try {
      await this.connect();
      const result = await this.client.query(
        'SELECT "Ref" FROM invoices WHERE "Ref" LIKE $1 ORDER BY "Ref" DESC LIMIT 1',
        ['INV-%']
      );
      
      if (result.rows.length === 0) {
        return 'INV-0001';
      }
      
      const lastRef = result.rows[0].Ref;
      const match = lastRef.match(/INV-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        return `INV-${nextNum.toString().padStart(4, '0')}`;
      }
      
      return 'INV-0001';
    } catch (error) {
      console.error('Error getting next invoice ref:', error);
      return 'INV-0001';
    }
  }
}

module.exports = new PostgresService();