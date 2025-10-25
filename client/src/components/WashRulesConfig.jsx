import React, { useState, useEffect } from 'react';

const WashRulesConfig = () => {
  const [washRules, setWashRules] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  // Default package templates
  const packageTemplates = [
    {
      name: '2 EXT 1 INT week',
      singleCar: ['EXT', 'EXT+INT'],
      multiCar: {
        enabled: true,
        intDistribution: 'alternate_between_cars',
        visitRules: {
          visit1: { intCar: 'INT', otherCars: 'EXT' },
          visit2: { intCar: 'INT', otherCars: 'EXT' }
        }
      },
      biWeekly: { enabled: false }
    },
    {
      name: '3 EXT 1 INT week',
      singleCar: ['EXT', 'EXT', 'EXT+INT'],
      multiCar: {
        enabled: true,
        intDistribution: 'alternate_between_cars',
        visitRules: {
          visit1: { intCar: 'EXT', otherCars: 'EXT' },
          visit2: { intCar: 'INT', otherCars: 'EXT' },
          visit3: { allCars: 'EXT' }
        }
      },
      biWeekly: { enabled: false }
    },
    {
      name: '3 EXT 1 INT bi week',
      singleCar: ['EXT', 'EXT', 'EXT+INT'],
      multiCar: {
        enabled: true,
        intDistribution: 'alternate_between_cars',
        visitRules: {
          visit1: { intCar: 'EXT', otherCars: 'EXT' },
          visit2: { intCar: 'INT', otherCars: 'EXT' },
          visit3: { allCars: 'EXT' }
        }
      },
      biWeekly: {
        enabled: true,
        week1: 'use_weekly_pattern',
        week2: 'ext_only',
        cycleDetection: 'last_wash_history',
        fallback: 'week_number'
      }
    }
  ];

  const [newRule, setNewRule] = useState({
    name: '',
    singleCar: ['EXT'],
    multiCar: {
      enabled: false,
      intDistribution: 'alternate_between_cars',
      visitRules: {}
    },
    biWeekly: {
      enabled: false,
      week1: 'use_weekly_pattern',
      week2: 'ext_only',
      cycleDetection: 'last_wash_history',
      fallback: 'week_number'
    }
  });
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    loadWashRules();
  }, []);

  const loadWashRules = async () => {
    try {
      // Try to load from server first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wash-rules`);
      if (response.ok) {
        const data = await response.json();
        setWashRules(data.rules || packageTemplates);
      } else {
        // Fallback to localStorage
        const savedRules = localStorage.getItem('washRules');
        if (savedRules) {
          setWashRules(JSON.parse(savedRules));
        } else {
          setWashRules(packageTemplates);
        }
      }
    } catch (error) {
      console.error('Failed to load wash rules:', error);
      // Fallback to localStorage
      const savedRules = localStorage.getItem('washRules');
      if (savedRules) {
        setWashRules(JSON.parse(savedRules));
      } else {
        setWashRules(packageTemplates);
      }
    }
  };

  const saveRulesToStorage = async (rules) => {
    try {
      // Save to server first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wash-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
      
      if (response.ok) {

      } else {
        console.error('Failed to save rules to server');
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('washRules', JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
      // Fallback to localStorage only
      localStorage.setItem('washRules', JSON.stringify(rules));
    }
  };

  const loadHistoryForCustomer = async (customerId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/history`);
      if (response.ok) {
        const allHistory = await response.json();
        const customerHistory = allHistory.filter(record => 
          record.CustomerID === customerId
        ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
        
        setHistoryData(customerHistory);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVisitToRule = () => {
    setNewRule({
      ...newRule,
      singleCar: [...newRule.singleCar, 'EXT']
    });
  };

  const removeVisitFromRule = (index) => {
    const updatedVisits = newRule.singleCar.filter((_, i) => i !== index);
    setNewRule({
      ...newRule,
      singleCar: updatedVisits
    });
  };

  const updateVisitType = (index, type) => {
    const updatedVisits = [...newRule.singleCar];
    updatedVisits[index] = type;
    setNewRule({
      ...newRule,
      singleCar: updatedVisits
    });
  };

  const saveRule = async () => {
    if (!newRule.name.trim()) {
      alert('Please enter package name');
      return;
    }

    try {
      if (editingIndex >= 0) {
        // Update existing rule
        const updatedRules = [...washRules];
        updatedRules[editingIndex] = { ...newRule };
        setWashRules(updatedRules);
        saveRulesToStorage(updatedRules);
        alert('Rule updated successfully!');
      } else {
        // Add new rule
        const updatedRules = [...washRules, { ...newRule }];
        setWashRules(updatedRules);
        saveRulesToStorage(updatedRules);
        alert('Rule saved successfully!');
      }
      
      // Reset form
      setNewRule({
        name: '',
        singleCar: ['EXT'],
        multiCar: {
          enabled: false,
          intDistribution: 'alternate_between_cars',
          visitRules: {}
        },
        biWeekly: {
          enabled: false,
          week1: 'use_weekly_pattern',
          week2: 'ext_only',
          cycleDetection: 'last_wash_history',
          fallback: 'week_number'
        }
      });
      setEditingIndex(-1);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('Failed to save rule');
    }
  };

  const [simulationResult, setSimulationResult] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);

  const testRule = (rule) => {
    const scenarios = [
      { name: 'عميل سيارة واحدة', cars: ['ABC123'] },
      { name: 'عميل سيارتين', cars: ['ABC123', 'XYZ789'] }
    ];

    const results = scenarios.map(scenario => {
      const schedule = simulateSchedule(rule, scenario);
      return { ...scenario, schedule };
    });

    setSimulationResult({ rule, results });
    setShowSimulation(true);
  };

  const simulateSchedule = (rule, scenario) => {
    const schedule = [];
    const weeksToShow = rule.biWeekly?.enabled ? 2 : 1;
    
    for (let week = 1; week <= weeksToShow; week++) {
      // Determine if this week should have INT
      const weekShouldHaveInt = week === 1 || (rule.biWeekly?.enabled && rule.biWeekly.week2 !== 'ext_only');
      
      for (let visit = 1; visit <= rule.singleCar.length; visit++) {
        const baseWashType = rule.singleCar[visit - 1] || 'EXT';
        
        if (scenario.cars.length === 1) {
          // Single car - simple
          let washType = weekShouldHaveInt ? baseWashType : 'EXT';
          schedule.push({ 
            week: weeksToShow > 1 ? `أسبوع ${week}` : undefined,
            visit, 
            car: scenario.cars[0], 
            washType 
          });
        } else {
          // Multi-car logic based on selected distribution method
          scenario.cars.forEach((car, carIndex) => {
            let washType = 'EXT';
            
            if (weekShouldHaveInt && rule.multiCar?.enabled && baseWashType === 'INT') {
              switch (rule.multiCar.intDistribution) {
                case 'alternate_between_cars':
                  // Visit 1: Car 0 gets INT, Visit 2: Car 1 gets INT, etc.
                  const intCarIndex = (visit - 1) % scenario.cars.length;
                  washType = carIndex === intCarIndex ? 'INT' : 'EXT';
                  break;
                  
                case 'rotate_based_on_history':
                  // Simulate rotation - different car each time
                  const rotateCarIndex = (visit - 1) % scenario.cars.length;
                  washType = carIndex === rotateCarIndex ? 'INT' : 'EXT';
                  break;
                  
                case 'fixed_car_per_visit':
                  // Always first car gets INT
                  washType = carIndex === 0 ? 'INT' : 'EXT';
                  break;
                  
                case 'all_cars_get_int':
                  // All cars get INT
                  washType = 'INT';
                  break;
                  
                default:
                  // Default: first car gets INT
                  washType = carIndex === 0 ? 'INT' : 'EXT';
              }
            }
            
            schedule.push({ 
              week: weeksToShow > 1 ? `أسبوع ${week}` : undefined,
              visit, 
              car, 
              washType 
            });
          });
        }
      }
    }
    
    return schedule;
  };

  const deleteRule = (index, ruleName) => {
    if (confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      const updatedRules = washRules.filter((_, i) => i !== index);
      setWashRules(updatedRules);
      saveRulesToStorage(updatedRules);
      alert(`Rule "${ruleName}" deleted successfully!`);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          color: 'var(--brand-primary)',
          fontSize: '1.5rem',
          fontWeight: '600',
          margin: '0'
        }}>
          🧼 Wash Rules Configuration
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            ➕ Add Rule
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-secondary"
          >
            📊 View History
          </button>
        </div>
      </div>

      {/* History Viewer */}
      {showHistory && (
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #e9ecef'
        }}>
          <h3 style={{
            color: '#17a2b8',
            fontSize: '1.2rem',
            marginBottom: '1rem'
          }}>
            📊 Customer History Viewer
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Enter Customer ID (e.g., CUST-011)"
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e9ecef',
                fontSize: '1rem'
              }}
            />
            
            <button
              onClick={() => loadHistoryForCustomer(selectedCustomer)}
              disabled={!selectedCustomer.trim() || loading}
              className="btn btn-primary"
            >
              {loading ? '⏳ Loading...' : '🔍 Load History'}
            </button>
          </div>

          {historyData.length > 0 && (
            <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#e9ecef' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Car Plate</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Wash Type</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Package</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((record, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                      <td style={{ padding: '8px', fontSize: '0.9rem' }}>{record.WashDate}</td>
                      <td style={{ padding: '8px', fontSize: '0.9rem' }}>{record.CarPlate}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: record.WashType === 'INT' ? '#28a745' : '#17a2b8',
                          color: 'white',
                          fontSize: '0.8rem'
                        }}>
                          {record.WashType || record.WashTypePerformed}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: record.Status === 'Completed' ? '#28a745' : '#ffc107',
                          color: record.Status === 'Completed' ? 'white' : '#212529',
                          fontSize: '0.8rem'
                        }}>
                          {record.Status}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.9rem' }}>{record.PackageType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Rule Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #e9ecef'
        }}>
          <h3 style={{
            color: 'var(--brand-primary)',
            fontSize: '1.2rem',
            marginBottom: '1rem'
          }}>
            {editingIndex >= 0 ? 'Edit Wash Rule' : 'Add New Wash Rule'}
          </h3>
          
          {/* Package Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Package Name:
            </label>
            <input
              type="text"
              placeholder="e.g., 3 EXT 1 INT week"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e9ecef',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Single Car Pattern */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Single Car Pattern:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {newRule.singleCar.map((visit, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Visit {index + 1}:</span>
                  <select
                    value={visit === 'EXT+INT' ? 'INT' : visit}
                    onChange={(e) => updateVisitType(index, e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <option value="EXT">EXT</option>
                    <option value="INT">INT (includes EXT)</option>
                  </select>
                  {newRule.singleCar.length > 1 && (
                    <button
                      onClick={() => removeVisitFromRule(index)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addVisitToRule}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                + Add Visit
              </button>
            </div>
          </div>

          {/* Multi-Car Settings */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={newRule.multiCar.enabled}
                onChange={(e) => setNewRule({
                  ...newRule,
                  multiCar: { ...newRule.multiCar, enabled: e.target.checked }
                })}
              />
              <span style={{ fontWeight: '600' }}>Different rules for multi-car customers</span>
            </label>
            
            {newRule.multiCar.enabled && (
              <div style={{ marginLeft: '1rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  INT Distribution Method:
                </label>
                <select
                  value={newRule.multiCar.intDistribution}
                  onChange={(e) => setNewRule({
                    ...newRule,
                    multiCar: { ...newRule.multiCar, intDistribution: e.target.value }
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="alternate_between_cars">🔄 تبديل بين السيارات</option>
                  <option value="rotate_based_on_history">📊 حسب آخر غسلة INT</option>
                  <option value="fixed_car_per_visit">📌 سيارة ثابتة لكل زيارة</option>
                  <option value="all_cars_get_int">🚗🚗 كل السيارات تاخد INT</option>
                </select>
                
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: '#1565c0'
                }}>
                  {newRule.multiCar.intDistribution === 'alternate_between_cars' && (
                    '💡 مثال: سيارة 1 تاخد INT الزيارة الأولى، سيارة 2 تاخد INT الزيارة الثانية'
                  )}
                  {newRule.multiCar.intDistribution === 'rotate_based_on_history' && (
                    '💡 مثال: النظام يشوف آخر سيارة أخدت INT ويدي INT للسيارة اللي بعدها'
                  )}
                  {newRule.multiCar.intDistribution === 'fixed_car_per_visit' && (
                    '💡 مثال: الزيارة الأولى دايماً سيارة 1، الزيارة الثانية دايماً سيارة 2'
                  )}
                  {newRule.multiCar.intDistribution === 'all_cars_get_int' && (
                    '💡 مثال: في كل زيارة فيها INT، كل السيارات تاخد INT مش واحدة بس'
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bi-Weekly Settings */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={newRule.biWeekly.enabled}
                onChange={(e) => setNewRule({
                  ...newRule,
                  biWeekly: { ...newRule.biWeekly, enabled: e.target.checked }
                })}
              />
              <span style={{ fontWeight: '600' }}>Enable bi-weekly cycle</span>
            </label>
            
            {newRule.biWeekly.enabled && (
              <div style={{ marginLeft: '1rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Week 2 Pattern:
                    </label>
                    <select
                      value={newRule.biWeekly.week2}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        biWeekly: { ...newRule.biWeekly, week2: e.target.value }
                      })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    >
                      <option value="ext_only">EXT only</option>
                      <option value="skip_week">Skip week</option>
                      <option value="use_weekly_pattern">Same as Week 1</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Cycle Detection:
                    </label>
                    <select
                      value={newRule.biWeekly.cycleDetection}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        biWeekly: { ...newRule.biWeekly, cycleDetection: e.target.value }
                      })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    >
                      <option value="last_wash_history">Last wash history</option>
                      <option value="week_number">Week number</option>
                      <option value="customer_start_date">Customer start date</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingIndex(-1);
                setNewRule({
                  name: '',
                  singleCar: ['EXT'],
                  multiCar: {
                    enabled: false,
                    intDistribution: 'alternate_between_cars',
                    visitRules: {}
                  },
                  biWeekly: {
                    enabled: false,
                    week1: 'use_weekly_pattern',
                    week2: 'ext_only',
                    cycleDetection: 'last_wash_history',
                    fallback: 'week_number'
                  }
                });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            
            <button
              onClick={saveRule}
              className="btn btn-primary"
            >
              {editingIndex >= 0 ? 'Update Rule' : 'Save Rule'}
            </button>
          </div>
        </div>
      )}

      {/* Simulation Results */}
      {showSimulation && simulationResult && (
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '2px solid #28a745'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#28a745', fontSize: '1.2rem', margin: '0' }}>
              🧪 نتائج اختبار قاعدة: {simulationResult.rule.name}
            </h3>
            <button
              onClick={() => setShowSimulation(false)}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              ✖ إغلاق
            </button>
          </div>
          
          {simulationResult.results.map((scenario, index) => (
            <div key={index} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#495057', marginBottom: '0.5rem' }}>
                {scenario.name} ({scenario.cars.length} سيارة)
              </h4>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  fontSize: '0.9rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e9ecef' }}>
                      {simulationResult.rule.biWeekly?.enabled && (
                        <th style={{ padding: '8px', textAlign: 'center' }}>الأسبوع</th>
                      )}
                      <th style={{ padding: '8px', textAlign: 'center' }}>الزيارة</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>رقم السيارة</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>نوع الغسيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.schedule.map((item, itemIndex) => (
                      <tr key={itemIndex} style={{ borderBottom: '1px solid #e9ecef' }}>
                        {simulationResult.rule.biWeekly?.enabled && (
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#6f42c1' }}>
                            {item.week}
                          </td>
                        )}
                        <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600' }}>
                          زيارة {item.visit}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {item.car}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: item.washType === 'INT' ? '#28a745' : 
                                           item.washType === 'EXT+INT' ? '#ffc107' : '#17a2b8',
                            color: item.washType === 'EXT+INT' ? '#212529' : 'white',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {item.washType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Rules */}
      <div className="stats-grid">
        {washRules.map((rule, index) => (
          <div key={index} className="stat-card">
            <div style={{ flex: 1 }}>
              <h4 style={{
                color: 'var(--brand-primary)',
                fontSize: '1.2rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                🧼 {rule.name}
              </h4>
              
              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                <strong>Single Car:</strong> {rule.singleCar.join(' → ')}
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                <strong>Multi-Car:</strong> {rule.multiCar.enabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                <strong>Bi-Weekly:</strong> {rule.biWeekly.enabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => testRule(rule)}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🧪 Test
              </button>
              
              <button
                onClick={() => {
                  setNewRule(rule);
                  setEditingIndex(index);
                  setShowAddForm(true);
                }}
                style={{
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✏️ Edit
              </button>
              
              <button
                onClick={() => deleteRule(index, rule.name)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rules Count */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{
          color: 'var(--brand-primary)',
          fontSize: '1.1rem',
          fontWeight: '600',
          margin: '0'
        }}>
          Total Wash Rules: {washRules.length}
        </p>
      </div>
    </div>
  );
};

export default WashRulesConfig;