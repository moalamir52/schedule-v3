const db = require('../../services/databaseService');

// Helper functions
const getSheetData = async (sheetName) => {
  if (sheetName === 'WashRules') {
    try {
      return await db.supabase.request('GET', '/WashRules?Status=eq.Active');
    } catch (error) {
      console.log('WashRules table not found, returning empty array');
      return [];
    }
  }
  return [];
};

const clearAndWriteSheet = async (sheetName, data) => {
  if (sheetName === 'WashRules') {
    try {
      // Clear existing rules
      await db.supabase.request('DELETE', '/WashRules');
      // Insert new rules
      for (const rule of data) {
        await db.supabase.request('POST', '/WashRules', rule);
      }
    } catch (error) {
      console.error('Error updating WashRules:', error);
      throw error;
    }
  }
};

const getWashRules = async (req, res) => {
  try {
    console.log('Getting wash rules from Google Sheets...');
    const washRulesData = await getSheetData('WashRules');
    console.log('Wash rules data:', washRulesData);
    
    if (!washRulesData || washRulesData.length === 0) {
      console.log('No wash rules found, creating defaults...');
      // Create default templates and save them to Google Sheets
      const defaultRules = [
        {
          name: '2 EXT 1 INT week',
          singleCar: ['EXT', 'INT'],
          multiCar: {
            enabled: true,
            intDistribution: 'alternate_between_cars'
          },
          biWeekly: { enabled: false }
        },
        {
          name: '3 EXT 1 INT week',
          singleCar: ['EXT', 'EXT', 'INT'],
          multiCar: {
            enabled: true,
            intDistribution: 'alternate_between_cars'
          },
          biWeekly: { enabled: false }
        },
        {
          name: '3 EXT 1 INT bi week',
          singleCar: ['EXT', 'EXT', 'INT'],
          multiCar: {
            enabled: true,
            intDistribution: 'alternate_between_cars'
          },
          biWeekly: {
            enabled: true,
            week1: 'use_weekly_pattern',
            week2: 'ext_only'
          }
        }
      ];
      
      try {
        // Save default rules to Google Sheets
        const formattedRules = defaultRules.map((rule, index) => ({
          RuleId: index + 1,
          RuleName: rule.name,
          SingleCarPattern: JSON.stringify(rule.singleCar),
          MultiCarSettings: JSON.stringify(rule.multiCar),
          BiWeeklySettings: JSON.stringify(rule.biWeekly),
          CreatedDate: new Date().toISOString().split('T')[0],
          Status: 'Active'
        }));
        
        console.log('Saving default rules to Google Sheets...');
        await clearAndWriteSheet('WashRules', formattedRules);
        console.log('Default rules saved successfully');
      } catch (saveError) {
        console.error('Error saving default rules:', saveError);
        // Continue with default rules even if save fails
      }
      
      return res.json({ success: true, rules: defaultRules });
    }
    
    // Parse rules from sheet data
    const rules = washRulesData.map(row => ({
      name: row.RuleName || row.name,
      singleCar: JSON.parse(row.SingleCarPattern || '["EXT"]'),
      multiCar: JSON.parse(row.MultiCarSettings || '{"enabled": false}'),
      biWeekly: JSON.parse(row.BiWeeklySettings || '{"enabled": false}')
    }));
    
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error getting wash rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const saveWashRules = async (req, res) => {
  try {
    const { rules } = req.body;
    
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({ success: false, error: 'Rules array is required' });
    }
    
    console.log('Saving rules:', JSON.stringify(rules, null, 2));
    
    // Format rules for Google Sheets
    const formattedRules = rules.map((rule, index) => {
      const formatted = {
        RuleId: index + 1,
        RuleName: rule.name || 'Unnamed Rule',
        SingleCarPattern: JSON.stringify(rule.singleCar || ['EXT']),
        MultiCarSettings: JSON.stringify(rule.multiCar || { enabled: false }),
        BiWeeklySettings: JSON.stringify(rule.biWeekly || { enabled: false }),
        CreatedDate: new Date().toISOString().split('T')[0],
        Status: 'Active'
      };
      console.log('Formatted rule:', formatted);
      return formatted;
    });
    
    await clearAndWriteSheet('WashRules', formattedRules);
    
    res.json({ success: true, message: 'Wash rules saved successfully' });
  } catch (error) {
    console.error('Error saving wash rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const addWashRule = async (req, res) => {
  try {
    const { rule } = req.body;
    
    if (!rule || !rule.name) {
      return res.status(400).json({ success: false, error: 'Rule with name is required' });
    }
    
    // Get existing rules data directly
    const washRulesData = await getSheetData('WashRules');
    let rules = [];
    
    if (washRulesData && washRulesData.length > 0) {
      rules = washRulesData.map(row => ({
        name: row.RuleName || row.name,
        singleCar: JSON.parse(row.SingleCarPattern || '["EXT"]'),
        multiCar: JSON.parse(row.MultiCarSettings || '{"enabled": false}'),
        biWeekly: JSON.parse(row.BiWeeklySettings || '{"enabled": false}')
      }));
    }
    
    // Add new rule
    rules.push(rule);
    
    // Save updated rules
    const formattedRules = rules.map((r, index) => ({
      RuleId: index + 1,
      RuleName: r.name,
      SingleCarPattern: JSON.stringify(r.singleCar),
      MultiCarSettings: JSON.stringify(r.multiCar),
      BiWeeklySettings: JSON.stringify(r.biWeekly),
      CreatedDate: new Date().toISOString().split('T')[0],
      Status: 'Active'
    }));
    
    await clearAndWriteSheet('WashRules', formattedRules);
    res.json({ success: true, message: 'Wash rule added successfully' });
  } catch (error) {
    console.error('Error adding wash rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateWashRule = async (req, res) => {
  try {
    const { index } = req.params;
    const { rule } = req.body;
    
    if (!rule || !rule.name) {
      return res.status(400).json({ success: false, error: 'Rule with name is required' });
    }
    
    // Get existing rules data directly
    const washRulesData = await getSheetData('WashRules');
    let rules = [];
    
    if (washRulesData && washRulesData.length > 0) {
      rules = washRulesData.map(row => ({
        name: row.RuleName || row.name,
        singleCar: JSON.parse(row.SingleCarPattern || '["EXT"]'),
        multiCar: JSON.parse(row.MultiCarSettings || '{"enabled": false}'),
        biWeekly: JSON.parse(row.BiWeeklySettings || '{"enabled": false}')
      }));
    }
    
    // Update rule at index
    if (index >= 0 && index < rules.length) {
      rules[index] = rule;
      
      const formattedRules = rules.map((r, i) => ({
        RuleId: i + 1,
        RuleName: r.name,
        SingleCarPattern: JSON.stringify(r.singleCar),
        MultiCarSettings: JSON.stringify(r.multiCar),
        BiWeeklySettings: JSON.stringify(r.biWeekly),
        CreatedDate: new Date().toISOString().split('T')[0],
        Status: 'Active'
      }));
      
      await clearAndWriteSheet('WashRules', formattedRules);
      res.json({ success: true, message: 'Wash rule updated successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Rule not found' });
    }
  } catch (error) {
    console.error('Error updating wash rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteWashRule = async (req, res) => {
  try {
    const { index } = req.params;
    
    // Get existing rules data directly
    const washRulesData = await getSheetData('WashRules');
    let rules = [];
    
    if (washRulesData && washRulesData.length > 0) {
      rules = washRulesData.map(row => ({
        name: row.RuleName || row.name,
        singleCar: JSON.parse(row.SingleCarPattern || '["EXT"]'),
        multiCar: JSON.parse(row.MultiCarSettings || '{"enabled": false}'),
        biWeekly: JSON.parse(row.BiWeeklySettings || '{"enabled": false}')
      }));
    }
    
    // Remove rule at index
    if (index >= 0 && index < rules.length) {
      rules.splice(index, 1);
      
      const formattedRules = rules.map((r, i) => ({
        RuleId: i + 1,
        RuleName: r.name,
        SingleCarPattern: JSON.stringify(r.singleCar),
        MultiCarSettings: JSON.stringify(r.multiCar),
        BiWeeklySettings: JSON.stringify(r.biWeekly),
        CreatedDate: new Date().toISOString().split('T')[0],
        Status: 'Active'
      }));
      
      await clearAndWriteSheet('WashRules', formattedRules);
      res.json({ success: true, message: 'Wash rule deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Rule not found' });
    }
  } catch (error) {
    console.error('Error deleting wash rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getWashRules,
  saveWashRules,
  addWashRule,
  updateWashRule,
  deleteWashRule
};