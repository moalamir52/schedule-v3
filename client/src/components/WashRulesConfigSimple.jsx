import React, { useState, useEffect } from 'react';

const WashRulesConfigSimple = () => {
  const [washRules, setWashRules] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default package templates
  const packageTemplates = [
    {
      name: '2 EXT 1 INT week',
      singleCar: ['EXT', 'INT'],
      multiCar: {
        visit1: { car1: 'INT', car2: 'EXT' },
        visit2: { car1: 'EXT', car2: 'INT' }
      }
    },
    {
      name: '3 EXT 1 INT week', 
      singleCar: ['EXT', 'EXT', 'INT'],
      multiCar: {
        visit1: { car1: 'EXT', car2: 'EXT' },
        visit2: { car1: 'INT', car2: 'EXT' },
        visit3: { car1: 'EXT', car2: 'INT' }
      }
    }
  ];

  const [newRule, setNewRule] = useState({
    name: '',
    singleCar: ['EXT'],
    multiCar: {
      visit1: { car1: 'EXT', car2: 'EXT' }
    }
  });
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    loadWashRules();
  }, []);

  const loadWashRules = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wash-rules`);
      if (response.ok) {
        const data = await response.json();
        setWashRules(data.rules || packageTemplates);
      } else {
        const savedRules = localStorage.getItem('washRules');
        if (savedRules) {
          setWashRules(JSON.parse(savedRules));
        } else {
          setWashRules(packageTemplates);
        }
      }
    } catch (error) {
      console.error('Failed to load wash rules:', error);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wash-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
      
      if (response.ok) {

      } else {
        console.error('Failed to save rules to server');
      }
      
      localStorage.setItem('washRules', JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
      localStorage.setItem('washRules', JSON.stringify(rules));
    }
  };

  const addVisitToRule = () => {
    const newVisitIndex = newRule.singleCar.length + 1;
    const visitKey = `visit${newVisitIndex}`;
    
    setNewRule({
      ...newRule,
      singleCar: [...newRule.singleCar, 'EXT'],
      multiCar: {
        ...newRule.multiCar,
        [visitKey]: { car1: 'EXT', car2: 'EXT' }
      }
    });
  };

  const removeVisitFromRule = (index) => {
    const updatedVisits = newRule.singleCar.filter((_, i) => i !== index);
    const updatedMultiCar = { ...newRule.multiCar };
    
    // Remove the visit from multiCar and renumber remaining visits
    const newMultiCar = {};
    let newVisitIndex = 1;
    
    for (let i = 0; i < updatedVisits.length; i++) {
      const oldVisitKey = `visit${i + 1}`;
      const newVisitKey = `visit${newVisitIndex}`;
      
      if (i < index) {
        newMultiCar[newVisitKey] = updatedMultiCar[oldVisitKey];
      } else {
        const nextOldVisitKey = `visit${i + 2}`;
        newMultiCar[newVisitKey] = updatedMultiCar[nextOldVisitKey];
      }
      newVisitIndex++;
    }
    
    setNewRule({
      ...newRule,
      singleCar: updatedVisits,
      multiCar: newMultiCar
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
        const updatedRules = [...washRules];
        updatedRules[editingIndex] = { ...newRule };
        setWashRules(updatedRules);
        saveRulesToStorage(updatedRules);
        alert('Rule updated successfully!');
      } else {
        const updatedRules = [...washRules, { ...newRule }];
        setWashRules(updatedRules);
        saveRulesToStorage(updatedRules);
        alert('Rule saved successfully!');
      }
      
      setNewRule({
        name: '',
        singleCar: ['EXT'],
        multiCar: {
          visit1: { car1: 'EXT', car2: 'EXT' }
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
    
    for (let visit = 1; visit <= rule.singleCar.length; visit++) {
      if (scenario.cars.length === 1) {
        const washType = rule.singleCar[visit - 1] || 'EXT';
        schedule.push({ 
          visit, 
          car: scenario.cars[0], 
          washType 
        });
      } else {
        const visitKey = `visit${visit}`;
        const visitConfig = rule.multiCar[visitKey];
        
        scenario.cars.forEach((car, carIndex) => {
          let washType = 'EXT';
          
          if (visitConfig) {
            const carKey = `car${carIndex + 1}`;
            washType = visitConfig[carKey] || 'EXT';
          }
          
          schedule.push({ 
            visit, 
            car, 
            washType 
          });
        });
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
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          ➕ Add Rule
        </button>
      </div>

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
                    value={visit}
                    onChange={(e) => updateVisitType(index, e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <option value="EXT">EXT</option>
                    <option value="INT">INT</option>
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

          {/* Multi-Car Manual Configuration */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Multi-Car Configuration (2 cars):
            </label>
            
            <div style={{ padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
              {newRule.singleCar.map((_, visitIndex) => {
                const visitKey = `visit${visitIndex + 1}`;
                const visitConfig = newRule.multiCar[visitKey] || { car1: 'EXT', car2: 'EXT' };
                
                return (
                  <div key={visitIndex} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>زيارة {visitIndex + 1}:</div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>سيارة 1:</span>
                        <select
                          value={visitConfig.car1}
                          onChange={(e) => {
                            const updatedMultiCar = {
                              ...newRule.multiCar,
                              [visitKey]: { ...visitConfig, car1: e.target.value }
                            };
                            setNewRule({ ...newRule, multiCar: updatedMultiCar });
                          }}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="EXT">EXT</option>
                          <option value="INT">INT</option>
                        </select>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>سيارة 2:</span>
                        <select
                          value={visitConfig.car2}
                          onChange={(e) => {
                            const updatedMultiCar = {
                              ...newRule.multiCar,
                              [visitKey]: { ...visitConfig, car2: e.target.value }
                            };
                            setNewRule({ ...newRule, multiCar: updatedMultiCar });
                          }}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="EXT">EXT</option>
                          <option value="INT">INT</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                    visit1: { car1: 'EXT', car2: 'EXT' }
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
                      <th style={{ padding: '8px', textAlign: 'center' }}>الزيارة</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>رقم السيارة</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>نوع الغسيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.schedule.map((item, itemIndex) => (
                      <tr key={itemIndex} style={{ borderBottom: '1px solid #e9ecef' }}>
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
                            backgroundColor: item.washType === 'INT' ? '#28a745' : '#17a2b8',
                            color: 'white',
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

export default WashRulesConfigSimple;