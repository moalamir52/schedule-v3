import React, { useState, useEffect } from 'react';

const AuditReportPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    action: '',
    userId: '',
    limit: 50
  });
  const [summary, setSummary] = useState({});

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/audit/logs?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
        generateSummary(data.logs);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = (logs) => {
    const summary = logs.reduce((acc, log) => {
      acc[log.Action] = (acc[log.Action] || 0) + 1;
      return acc;
    }, {});
    setSummary(summary);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getActionColor = (action) => {
    const colors = {
      'TASK_UPDATE': '#17a2b8',
      'MANUAL_APPOINTMENT_ADD': '#28a745',
      'SLOT_SWAP': '#ffc107',
      'AUTO_SCHEDULE': '#6f42c1'
    };
    return colors[action] || '#6c757d';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: '#28a745',
            color: 'white',
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        
        <h1 style={{
          color: '#28a745',
          fontSize: '2rem',
          fontWeight: '700',
          margin: '0'
        }}>
          📊 Schedule Audit Report
        </h1>
        
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>Filters</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>From Date:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>To Date:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Action:</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">All Actions</option>
              <option value="TASK_UPDATE">Task Updates</option>
              <option value="MANUAL_APPOINTMENT_ADD">Manual Appointments</option>
              <option value="SLOT_SWAP">Slot Swaps</option>
              <option value="AUTO_SCHEDULE">Auto Schedule</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Limit:</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="25">25 records</option>
              <option value="50">50 records</option>
              <option value="100">100 records</option>
              <option value="200">200 records</option>
            </select>
          </div>
          <button
            onClick={loadAuditLogs}
            disabled={isLoading}
            style={{
              background: '#17a2b8',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {isLoading ? '🔄 Loading...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Summary */}
      {Object.keys(summary).length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#495057' }}>Summary</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {Object.entries(summary).map(([action, count]) => (
              <div key={action} style={{
                padding: '15px',
                backgroundColor: getActionColor(action),
                color: 'white',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
                <div style={{ fontSize: '14px' }}>{action.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#495057' }}>Audit Logs ({logs.length})</h3>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ color: '#6c757d', fontSize: '1.1rem' }}>Loading audit logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
            <div style={{ color: '#6c757d' }}>No audit logs found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Details</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.LogID} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {formatTimestamp(log.Timestamp)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: '600' }}>{log.UserName}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>{log.UserID}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: getActionColor(log.Action),
                        color: 'white'
                      }}>
                        {log.Action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: '600' }}>{log.CustomerName}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        Villa {log.Villa} • {log.CarPlate}
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div>{log.Day} {log.Time}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {log.OldWorker && log.NewWorker && log.OldWorker !== log.NewWorker && (
                        <div style={{ fontSize: '12px' }}>
                          Worker: {log.OldWorker} → {log.NewWorker}
                        </div>
                      )}
                      {log.OldWashType && log.NewWashType && log.OldWashType !== log.NewWashType && (
                        <div style={{ fontSize: '12px' }}>
                          Type: {log.OldWashType} → {log.NewWashType}
                        </div>
                      )}
                      {log.ChangeReason && (
                        <div style={{ fontSize: '11px', color: '#6c757d', fontStyle: 'italic' }}>
                          {log.ChangeReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditReportPage;