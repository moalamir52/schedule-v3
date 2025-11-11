import React, { useState, useEffect } from 'react';
const DailyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingTasks, setCompletingTasks] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [editValues, setEditValues] = useState({});
  const [completingAll, setCompletingAll] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    // If today is Sunday (holiday), default to Monday
    return todayName === 'Sunday' ? 'Monday' : todayName;
  });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, 1 = next week
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getWeekDateRange = (offset) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Find the Monday of current work week (Monday is start of work week)
    let mondayOfWeek = new Date(today);
    if (currentDay === 0) { // Sunday - go to next Monday
      mondayOfWeek.setDate(today.getDate() + 1);
    } else if (currentDay === 1) { // Monday - start of work week
      // Already Monday
    } else { // Tuesday-Saturday (2-6) - go back to Monday of this work week
      mondayOfWeek.setDate(today.getDate() - currentDay + 1);
    }
    // Add week offset
    mondayOfWeek.setDate(mondayOfWeek.getDate() + (offset * 7));
    const endOfWeek = new Date(mondayOfWeek);
    endOfWeek.setDate(mondayOfWeek.getDate() + 5); // Saturday
    return {
      start: mondayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
      // Failed to load workers
    }
  };
  const loadTodayTasks = async (dayToLoad, offset) => {
    const day = dayToLoad || selectedDay;
    const weekOff = offset !== undefined ? offset : weekOffset;
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/today?day=${day}&weekOffset=${weekOff}`);
      const data = await response.json();
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
      // تأكد من نجاح العملية قبل حذف المهمة من الـ UI
      if (data.success) {
        // Remove completed task from list
        setTasks(prev => prev.filter(t => t.id !== task.id));
        // إظهار رسالة نجاح
        alert(`✅ Task completed successfully: ${task.customerName} - Villa ${task.villa}`);
      } else {
        throw new Error(data.error || 'Task completion was not confirmed');
      }
    } catch (err) {
      alert(`❌ Error completing task: ${err.message}\n\nPlease try again or check if the task was actually completed.`);
      // إعادة تحميل المهام للتأكد من الحالة الحقيقية
      setTimeout(() => {
        loadTodayTasks(selectedDay, weekOffset);
      }, 1000);
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };
  const cancelTask = async (task) => {
    if (completingTasks.has(task.id)) return;
    const confirmed = window.confirm(`Are you sure you want to cancel this task?\n\nCustomer: ${task.customerName}\nVilla: ${task.villa}\nCar: ${task.carPlate || 'N/A'}\nTime: ${task.time}`);
    if (!confirmed) return;
    try {
      setCompletingTasks(prev => new Set([...prev, task.id]));
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel task');
      }
      // تأكد من نجاح العملية قبل حذف المهمة من الـ UI
      if (data.success) {
        // Remove cancelled task from list
        setTasks(prev => prev.filter(t => t.id !== task.id));
        alert(`✅ Task cancelled successfully: ${task.customerName} - Villa ${task.villa}`);
      } else {
        throw new Error(data.error || 'Task cancellation was not confirmed');
      }
    } catch (err) {
      alert(`❌ Error cancelling task: ${err.message}\n\nPlease try again or refresh to check current status.`);
      // إعادة تحميل المهام للتأكد من الحالة الحقيقية
      setTimeout(() => {
        loadTodayTasks(selectedDay, weekOffset);
      }, 1000);
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };
  const completeAllTasks = async () => {
    if (completingAll || tasks.length === 0) return;
    const confirmed = window.confirm(`Are you sure you want to complete all ${tasks.length} tasks? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      setCompletingAll(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/complete-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tasks })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete all tasks');
      }
      // تأكد من نجاح العملية قبل حذف المهام من الـ UI
      if (data.success) {
        // Clear all tasks
        setTasks([]);
        const message = data.skippedCount > 0 
          ? `✅ Successfully completed ${data.completedCount} tasks!\n⚠️ Skipped ${data.skippedCount} already completed tasks.`
          : `✅ Successfully completed ${data.completedCount} tasks!`;
        alert(message);
      } else {
        throw new Error(data.error || 'Task completion was not confirmed');
      }
    } catch (err) {
      alert(`❌ Error completing all tasks: ${err.message}\n\nPlease refresh and check which tasks were actually completed.`);
      // إعادة تحميل المهام للتأكد من الحالة الحقيقية
      setTimeout(() => {
        loadTodayTasks(selectedDay, weekOffset);
      }, 1000);
    } finally {
      setCompletingAll(false);
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
                  cursor: 'pointer',
                  minWidth: '180px'
                }}
              >
                {dayOptions.map(day => {
                  // Calculate date for this day
                  const today = new Date();
                  const currentDay = today.getDay();
                  let mondayOfWeek = new Date(today);
                  if (currentDay === 0) {
                    mondayOfWeek.setDate(today.getDate() + 1);
                  } else if (currentDay === 1) {
                    // Already Monday
                  } else {
                    mondayOfWeek.setDate(today.getDate() - currentDay + 1);
                  }
                  mondayOfWeek.setDate(mondayOfWeek.getDate() + (weekOffset * 7));
                  const dayOffsets = {
                    'Monday': 0, 'Tuesday': 1, 'Wednesday': 2,
                    'Thursday': 3, 'Friday': 4, 'Saturday': 5
                  };
                  const dayDate = new Date(mondayOfWeek);
                  dayDate.setDate(mondayOfWeek.getDate() + dayOffsets[day]);
                  const dateStr = dayDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <option key={day} value={day}>{day} ({dateStr})</option>
                  );
                })}
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
                const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
                // Find the Monday of current work week
                let mondayOfWeek = new Date(today);
                if (currentDay === 0) { // Sunday - go to next Monday
                  mondayOfWeek.setDate(today.getDate() + 1);
                } else if (currentDay === 1) { // Monday - start of work week
                  // Already Monday
                } else { // Tuesday-Saturday (2-6) - go back to Monday of this work week
                  mondayOfWeek.setDate(today.getDate() - currentDay + 1);
                }
                // Add week offset
                mondayOfWeek.setDate(mondayOfWeek.getDate() + (weekOffset * 7));
                // Calculate target date based on selected day
                const dayOffsets = {
                  'Monday': 0, 'Tuesday': 1, 'Wednesday': 2,
                  'Thursday': 3, 'Friday': 4, 'Saturday': 5
                };
                const targetDate = new Date(mondayOfWeek);
                targetDate.setDate(mondayOfWeek.getDate() + dayOffsets[selectedDay]);
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={completeAllTasks}
                disabled={completingAll || tasks.length === 0}
                style={{
                  background: completingAll ? '#6c757d' : '#dc3545',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: completingAll || tasks.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {completingAll ? '⏳ Completing All...' : '✅ Complete All Tasks'}
              </button>
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
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/debug-status?day=${selectedDay}&weekOffset=${weekOffset}`);
                    const data = await response.json();
                    if (data.success) {
                      const message = `🔍 Debug Info for ${selectedDay}:\n\n` +
                        `📋 Scheduled Tasks: ${data.scheduledCount}\n` +
                        `✅ Completed in History: ${data.completedCount}\n` +
                        `❌ Cancelled in History: ${data.cancelledCount}\n` +
                        `⏳ Remaining Tasks: ${data.remainingCount}\n\n` +
                        `📅 Target Date: ${data.targetDate}\n\n` +
                        `${data.details || ''}`;
                      alert(message);
                    } else {
                      alert('❌ Failed to get debug info: ' + data.error);
                    }
                  } catch (err) {
                    alert('❌ Error getting debug info: ' + err.message);
                  }
                }}
                style={{
                  background: '#ffc107',
                  color: '#212529',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔍 Debug Status
              </button>
              <button
                onClick={async () => {
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
                      // Refresh tasks after cleanup
                      loadTodayTasks(selectedDay, weekOffset);
                    } else {
                      alert('❌ Force cleanup failed: ' + data.error);
                    }
                  } catch (err) {
                    alert('❌ Error during force cleanup: ' + err.message);
                  }
                }}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🧹 Force Cleanup
              </button>
            </div>
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
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => completeTask(task)}
                      disabled={completingTasks.has(task.id)}
                      style={{
                        flex: 1,
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
                      {completingTasks.has(task.id) ? '⏳ Completing...' : '✅ Complete'}
                    </button>
                    <button
                      onClick={() => cancelTask(task)}
                      disabled={completingTasks.has(task.id)}
                      style={{
                        flex: 1,
                        background: completingTasks.has(task.id) ? '#6c757d' : '#dc3545',
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
                          e.target.style.background = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!completingTasks.has(task.id)) {
                          e.target.style.background = '#dc3545';
                        }
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
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