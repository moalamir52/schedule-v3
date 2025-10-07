import React, { useState, useEffect } from 'react';

const CronSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    enabled: false,
    day: 4,
    hour: 22,
    minute: 0
  });
  const [loading, setLoading] = useState(false);
  const [nextRun, setNextRun] = useState(null);

  const days = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
  }));

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cron/settings`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setNextRun(data.settings.nextRun);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cron/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNextRun(data.settings.nextRun);
        onClose();
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestRun = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cron/trigger`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Test run completed! Generated ${data.totalAppointments} appointments.`);
      } else {
        alert('Test run failed: ' + data.error);
      }
    } catch (error) {
      alert('Test run failed');
    } finally {
      setLoading(false);
    }
  };

  const formatNextRun = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            ⏰ Automatic Schedule Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: '20px' }}>
          {loading && <div style={{ textAlign: 'center', marginBottom: '20px' }}>Loading...</div>}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                style={{ transform: 'scale(1.2)' }}
              />
              Enable Automatic Schedule Generation
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              📅 Day:
            </label>
            <select
              value={settings.day}
              onChange={(e) => setSettings({ ...settings, day: parseInt(e.target.value) })}
              disabled={!settings.enabled}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '2px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              {days.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              🕐 Time:
            </label>
            <select
              value={settings.hour}
              onChange={(e) => setSettings({ ...settings, hour: parseInt(e.target.value) })}
              disabled={!settings.enabled}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '2px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              {hours.map(hour => (
                <option key={hour.value} value={hour.value}>
                  {hour.label}
                </option>
              ))}
            </select>
          </div>

          {settings.enabled && (
            <div style={{
              background: '#f0f9ff',
              border: '2px solid #0ea5e9',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: '5px' }}>
                📊 Next Scheduled Run:
              </div>
              <div style={{ color: '#0369a1' }}>
                {formatNextRun(nextRun)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleTestRun}
              disabled={loading}
              style={{
                background: '#f59e0b',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🧪 Test Run
            </button>
            
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                background: '#10b981',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronSettingsModal;