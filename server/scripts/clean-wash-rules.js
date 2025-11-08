const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function cleanWashRules() {
  console.log('🧹 Cleaning WashRules - sending only valid rules...');
  
  try {
    // Clear existing WashRules in PostgreSQL
    const clearResponse = await fetch(`${BASE_URL}/api/database/import/WashRules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        data: [],
        append: false 
      })
    });
    
    console.log('Cleared existing WashRules:', clearResponse.status);
    
    // Send only the 5 valid rules
    const validRules = [
      {
        RuleId: '1',
        RuleName: '2 Ext 1 INT week',
        SingleCarPattern: '["EXT", "INT", "EXT"]',
        MultiCarSettings: '{"visit1": {"car1": "EXT", "car2": "EXT"}, "visit2": {"car1": "INT", "car2": "EXT"}, "visit3": {"car1": "EXT", "car2": "INT"}}',
        BiWeeklySettings: '{"enabled": false}',
        CreatedDate: new Date().toISOString(),
        Status: 'Active'
      },
      {
        RuleId: '2',
        RuleName: '3 Ext 1 INT week',
        SingleCarPattern: '["EXT", "INT", "EXT", "EXT"]',
        MultiCarSettings: '{"visit1": {"car1": "EXT", "car2": "EXT"}, "visit2": {"car1": "INT", "car2": "EXT"}, "visit3": {"car1": "EXT", "car2": "INT"}, "visit4": {"car1": "EXT", "car2": "EXT"}}',
        BiWeeklySettings: '{"enabled": false}',
        CreatedDate: new Date().toISOString(),
        Status: 'Active'
      },
      {
        RuleId: '3',
        RuleName: '3 Ext 1 INT bi week',
        SingleCarPattern: '["EXT", "INT", "EXT", "EXT"]',
        MultiCarSettings: '{"visit1": {"car1": "EXT", "car2": "EXT"}, "visit2": {"car1": "INT", "car2": "EXT"}, "visit3": {"car1": "EXT", "car2": "INT"}, "visit4": {"car1": "EXT", "car2": "EXT"}}',
        BiWeeklySettings: '{"enabled": true}',
        CreatedDate: new Date().toISOString(),
        Status: 'Active'
      },
      {
        RuleId: '4',
        RuleName: '2 Ext 1 INT bi week',
        SingleCarPattern: '["EXT", "INT", "EXT"]',
        MultiCarSettings: '{"visit1": {"car1": "EXT", "car2": "EXT"}, "visit2": {"car1": "INT", "car2": "EXT"}, "visit3": {"car1": "EXT", "car2": "INT"}}',
        BiWeeklySettings: '{"enabled": true}',
        CreatedDate: new Date().toISOString(),
        Status: 'Active'
      },
      {
        RuleId: '5',
        RuleName: '2 Ext',
        SingleCarPattern: '["EXT", "EXT"]',
        MultiCarSettings: '{"visit1": {"car1": "EXT", "car2": "EXT"}, "visit2": {"car1": "EXT", "car2": "EXT"}}',
        BiWeeklySettings: '{"enabled": false}',
        CreatedDate: new Date().toISOString(),
        Status: 'Active'
      }
    ];
    
    const response = await fetch(`${BASE_URL}/api/database/import/WashRules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        data: validRules,
        append: false 
      })
    });
    
    if (response.ok) {
      console.log('✅ Successfully uploaded 5 clean WashRules');
    } else {
      console.log('❌ Failed to upload clean rules:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanWashRules();