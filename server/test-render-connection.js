// Test Render Supabase connection
const express = require('express');
const app = express();

// Test endpoint
app.get('/test-db', async (req, res) => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Environment variables:');
    console.log('USE_SUPABASE:', process.env.USE_SUPABASE);
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.json({
        success: false,
        error: 'Missing Supabase environment variables',
        env: {
          USE_SUPABASE: process.env.USE_SUPABASE,
          SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
          SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY
        }
      });
    }

    // Test Supabase connection
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/customers?select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      message: 'Supabase connection working',
      customerCount: data.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Connection test failed:', error);
    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});