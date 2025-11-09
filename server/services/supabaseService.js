const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

class SupabaseService {
  constructor() {
    console.log('✅ Supabase service initialized');
    console.log('🔗 URL:', SUPABASE_URL);
  }

  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
        port: 443,
        path: `/rest/v1${path}`,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = responseData ? JSON.parse(responseData) : null;
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // Customers methods
  async getCustomers() {
    try {
      console.log('[SUPABASE] Fetching customers...');
      const result = await this.request('GET', '/customers?Status=eq.Active&order=CustomerID');
      console.log('[SUPABASE] Found', result.length, 'customers');
      return result;
    } catch (error) {
      console.error('[SUPABASE] Error fetching customers:', error);
      return [];
    }
  }

  // Workers methods
  async getWorkers() {
    try {
      console.log('[SUPABASE] Fetching workers...');
      const result = await this.request('GET', '/Workers?Status=eq.Active&order=Name');
      console.log('[SUPABASE] Found', result.length, 'workers');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching workers:', error);
      return [];
    }
  }

  // Invoices methods
  async getInvoices() {
    try {
      const result = await this.request('GET', '/invoices?order=CreatedAt.desc');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching invoices:', error);
      return [];
    }
  }

  // History methods
  async getAllHistory() {
    try {
      const result = await this.request('GET', '/wash_history?order=WashDate.desc');
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('[SUPABASE] Error fetching history:', error);
      return [];
    }
  }
}

module.exports = new SupabaseService();