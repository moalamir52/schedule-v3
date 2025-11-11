import React, { useState, useEffect } from 'react';
const CleanupPage = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    return todayName === 'Sunday' ? 'Monday' : todayName;
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/debug-status?day=${selectedDay}&weekOffset=${weekOffset}`);
      const data = await response.json();
      if (data.success) {
        setDebugInfo(data);
      } else {
        alert('❌ Failed to get debug info: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error getting debug info: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  const forceCleanup = async () => {
    const confirmed = window.confirm(
      `⚠️ FORCE CLEANUP for ${selectedDay}\n\n` +
      `This will:\n` +
      `1. Check all scheduled tasks for ${selectedDay}\n` +
      `2. Mark any remaining tasks as completed in history\n` +
      `3. Remove them from scheduled tasks\n\n` +
      `Use this ONLY if tasks are stuck after completion.\n\n` +
      `Continue?`
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/force-cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDay, weekOffset: weekOffset })
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Force cleanup completed!\n\n` +
          `🧹 Cleaned up: ${data.cleanedCount} tasks\n` +
          `⏭️ Skipped: ${data.skippedCount} tasks\n\n` +
          `${data.message || ''}`);
        // Refresh debug info
        getDebugInfo();
      } else {
        alert('❌ Force cleanup failed: ' + data.error);
      }
    } catch (err) {
      alert('❌ Error during force cleanup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getDebugInfo();
  }, [selectedDay, weekOffset]);
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
          ← Back
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ color: '#dc3545', fontSize: '2rem', fontWeight: '700', margin: 0 }}>
            🧹 System Cleanup
          </h1>
          <p style={{ color: '#6c757d', margin: '5px 0 0 0' }}>
            Debug and fix stuck bookings
          </p>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>
      {/* Controls */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>Select Day to Check</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '2px solid #28a745',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            {dayOptions.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <select
            value={weekOffset}
            onChange={(e) => setWeekOffset(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '2px solid #28a745',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value={-1}>Last Week</option>
            <option value={0}>This Week</option>
            <option value={1}>Next Week</option>
          </select>
          <button
            onClick={getDebugInfo}
            disabled={loading}
            style={{
              background: '#17a2b8',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Loading...' : '🔍 Check Status'}
          </button>
        </div>
      </div>
      {/* Debug Info */}
      {debugInfo && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#495057', marginBottom: '15px' }}>
            📊 Status for {debugInfo.day} ({debugInfo.targetDate})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', color: '#1976d2' }}>📋</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                {debugInfo.scheduledCount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Scheduled Tasks</div>
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', color: '#388e3c' }}>✅</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#388e3c' }}>
                {debugInfo.completedCount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Completed</div>
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', color: '#d32f2f' }}>❌</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
                {debugInfo.cancelledCount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Cancelled</div>
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', color: '#f57c00' }}>⚠️</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
                {debugInfo.stuckCount || 0}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Stuck Tasks</div>
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#f3e5f5',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', color: '#7b1fa2' }}>⏳</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7b1fa2' }}>
                {debugInfo.remainingCount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Not Completed</div>
            </div>
          </div>
          {(debugInfo.stuckCount > 0 || debugInfo.remainingCount > 0) && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>
                ⚠️ Found Issues:
              </h4>
              <div style={{ color: '#856404', margin: '0 0 15px 0', fontSize: '0.9rem' }}>
                {debugInfo.stuckCount > 0 && (
                  <p style={{ margin: '5px 0' }}>
                    • <strong>{debugInfo.stuckCount} Stuck Tasks:</strong> Completed but still in schedule (need cleanup)
                  </p>
                )}
                {debugInfo.remainingCount > 0 && (
                  <p style={{ margin: '5px 0' }}>
                    • <strong>{debugInfo.remainingCount} Incomplete Tasks:</strong> Not yet completed
                  </p>
                )}
              </div>
              <button
                onClick={forceCleanup}
                disabled={loading}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Cleaning...' : `🧹 Clean ${debugInfo.stuckCount} Stuck Tasks`}
              </button>
            </div>
          )}
          {debugInfo.stuckCount === 0 && debugInfo.remainingCount === 0 && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#155724', margin: '0' }}>
                ✅ All Good! No issues found.
              </h4>
              <p style={{ color: '#155724', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                All scheduled tasks are properly managed.
              </p>
            </div>
          )}
        </div>
      )}
      {/* Instructions */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>📖 How to Use</h3>
        <div style={{ color: '#6c757d', lineHeight: '1.6' }}>
          <p><strong>1. Check Status:</strong> Select a day and click "Check Status" to see if there are stuck tasks.</p>
          <p><strong>2. Fix Stuck Tasks:</strong> If you see stuck tasks, click "Fix Stuck Tasks" to clean them up.</p>
          <p><strong>3. When to Use:</strong> Use this when you notice tasks that were completed but still appear in the schedule.</p>
          <p><strong>⚠️ Warning:</strong> Only use "Fix Stuck Tasks" if you're sure the tasks were actually completed!</p>
        </div>
      </div>
    </div>
  );
};
export default CleanupPage;