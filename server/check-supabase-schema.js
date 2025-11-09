const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function checkSchema() {
  try {
    // Get table info
    const response = await fetch(`${SUPABASE_URL}/rest/v1/customers?limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log('❌ Error:', response.status, await response.text());
      return;
    }
    
    const data = await response.json();
    console.log('📊 Supabase customers table structure:');
    
    if (data.length > 0) {
      console.log('✅ Sample record columns:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]}`);
      });
    } else {
      console.log('⚠️ No records found, trying to get schema info...');
      
      // Try to get schema from OpenAPI
      const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Accept': 'application/openapi+json'
        }
      });
      
      if (schemaResponse.ok) {
        const schema = await schemaResponse.json();
        const customersSchema = schema.definitions?.customers?.properties;
        if (customersSchema) {
          console.log('✅ Schema columns:');
          Object.keys(customersSchema).forEach(key => {
            console.log(`  - ${key}: ${customersSchema[key].type}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();