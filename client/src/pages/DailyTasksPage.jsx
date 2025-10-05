import React, { useState, useEffect } from 'react';

const DailyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingTasks, setCompletingTasks] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [editValues, setEditValues] = useState({});
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[today.getDay()];
  });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, 1 = next week
  
  const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const getWeekDateRange = (offset) => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + (offset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      start: startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  useEffect(() => {
    loadTodayTasks(selectedDay, weekOffset);
    loadWorkers();
  }, [selectedDay, weekOffset]);

  const loadWorkers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workers`);
      const data = await response.json();
      setWorkers(data.filter(worker => worker.Status === 'Active'));
    } catch (err) {
      console.error('Failed to load workers:', err);
    }
  };

  const loadTodayTasks = async (dayToLoad, offset) => {
    const day = dayToLoad || selectedDay;
    const weekOff = offset !== undefined ? offset : weekOffset;
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/today?day=${day}&weekOffset=${weekOff}`);
      const data = await response.json();
      
      console.log(`Loading tasks for: ${day} (Week offset: ${weekOff})`);
      console.log('Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load tasks');
      }
      
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (taskId, newWashType, newWorkerName) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/update-wash-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId, newWashType, newWorkerName })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }
      
      // Update local state
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId
            ? { ...task, washType: newWashType, workerName: newWorkerName || task.workerName }
            : task
        )
      );
      
      setEditingTask(null);
    } catch (err) {
      alert(`Error updating task: ${err.message}`);
    }
  };

  const completeTask = async (task) => {
    if (completingTasks.has(task.id)) return;
    
    try {
      setCompletingTasks(prev => new Set([...prev, task.id]));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          customerID: task.customerID,
          carPlate: task.carPlate,
          washType: task.washType,
          villa: task.villa,
          workerName: task.workerName,
          packageType: task.packageType,
          actualWashDate: task.actualWashDate
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete task');
      }
      
      // Remove completed task from list
      setTasks(prev => prev.filter(t => t.id !== task.id));
      
    } catch (err) {
      alert(`Error completing task: ${err.message}`);
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const getWashTypeColor = (washType) => {
    return washType === 'INT' ? '#ADD8E6' : '#FFE5B4';
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            height: '40px',
            boxShadow: '0 2px 8px rgba(40, 167, 69, 0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#218838';
            e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#28a745';
            e.target.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.2)';
          }}
        >
          ←
        </button>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{
            color: '#28a745',
            fontSize: '2rem',
            fontWeight: '700',
            margin: '0 0 5px 0'
          }}>
            Daily Tasks
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            {/* Week Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #28a745',
                  backgroundColor: 'white',
                  color: '#28a745',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Previous Week
              </button>
              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <div style={{ color: '#28a745', fontWeight: '600', fontSize: '16px' }}>
                  {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
                </div>
                <div style={{ color: '#6c757d', fontSize: '12px' }}>
                  {getWeekDateRange(weekOffset).start} - {getWeekDateRange(weekOffset).end}
                </div>
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #28a745',
                  backgroundColor: 'white',
                  color: '#28a745',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Next Week →
              </button>
            </div>
            
            {/* Day Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <p style={{
                color: '#6c757d',
                fontSize: '1rem',
                margin: '0'
              }}>
                Day:
              </p>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid #28a745',
                  backgroundColor: 'white',
                  color: '#28a745',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {dayOptions.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            
            {/* Selected Date Display */}
            <div style={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #c8e6c9'
            }}>
              📅 {(() => {
                const today = new Date();
                const currentDay = today.getDay();
                const selectedDayIndex = dayOptions.indexOf(selectedDay);
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - currentDay + selectedDayIndex + (weekOffset * 7));
                return targetDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              })()}
            </div>
          </div>
        </div>
        
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Content */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: '#6c757d', fontSize: '1.1rem' }}>Loading today's tasks...</div>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          Error: {error}
        </div>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
          <h3 style={{ color: '#28a745', marginBottom: '10px' }}>No tasks for today!</h3>
          <p style={{ color: '#6c757d' }}>All tasks have been completed or no tasks were scheduled.</p>
        </div>
      )}

      {!isLoading && !error && tasks.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#495057', margin: 0 }}>
              Tasks to Complete ({tasks.length})
            </h2>
            <button
              onClick={loadTodayTasks}
              style={{
                background: '#17a2b8',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h3 style={{
                      color: '#495057',
                      margin: '0 0 5px 0',
                      fontSize: '1.2rem'
                    }}>
                      Villa {task.villa}
                    </h3>
                    <p style={{
                      color: '#6c757d',
                      margin: '0',
                      fontSize: '0.9rem'
                    }}>
                      {task.customerName}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {editingTask === task.id ? (
                      <select 
                        value={editValues[task.id]?.washType || task.washType}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px' }}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [task.id]: { ...prev[task.id], washType: e.target.value }
                        }))}
                      >
                        <option value="EXT">EXT</option>
                        <option value="INT">INT</option>
                      </select>
                    ) : (
                      <div
                        style={{
                          backgroundColor: getWashTypeColor(task.washType),
                          color: '#495057',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        {task.washType}
                      </div>
                    )}
                    <button
                      onClick={() => setEditingTask(editingTask === task.id ? null : task.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '0.9rem',
                    color: '#6c757d'
                  }}>
                    <div><strong>Time:</strong> {task.time}</div>
                    <div><strong>Worker:</strong> 
                      {editingTask === task.id ? (
                        <select 
                          value={editValues[task.id]?.workerName || task.workerName}
                          style={{ marginLeft: '5px', padding: '4px 8px', fontSize: '0.8rem', minWidth: '100px' }}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            [task.id]: { ...prev[task.id], workerName: e.target.value }
                          }))}
                        >
                          {workers.map(worker => (
                            <option key={worker.WorkerID} value={worker.Name}>{worker.Name}</option>
                          ))}
                        </select>
                      ) : task.workerName}
                    </div>
                    {task.carPlate && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Car:</strong> {task.carPlate}
                      </div>
                    )}
                  </div>
                </div>

                {editingTask === task.id ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        const newWashType = editValues[task.id]?.washType || task.washType;
                        const newWorkerName = editValues[task.id]?.workerName || task.workerName;
                        updateTask(task.id, newWashType, newWorkerName);
                      }}
                      style={{
                        flex: 1,
                        background: '#17a2b8',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✔️ Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setEditValues(prev => ({ ...prev, [task.id]: undefined }));
                      }}
                      style={{
                        flex: 1,
                        background: '#6c757d',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => completeTask(task)}
                    disabled={completingTasks.has(task.id)}
                    style={{
                      width: '100%',
                      background: completingTasks.has(task.id) ? '#6c757d' : '#28a745',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: completingTasks.has(task.id) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!completingTasks.has(task.id)) {
                        e.target.style.background = '#218838';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!completingTasks.has(task.id)) {
                        e.target.style.background = '#28a745';
                      }
                    }}
                  >
                    {completingTasks.has(task.id) ? '⏳ Completing...' : '✅ Complete Task'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTasksPage;