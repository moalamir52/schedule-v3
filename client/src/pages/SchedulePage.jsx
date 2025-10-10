import React, { useState, useEffect } from 'react';
import ScheduleControls from '../components/schedule/ScheduleControls';
import BookingOverview from '../components/schedule/BookingOverview';
import WorkerScheduleView from '../components/schedule/WorkerScheduleView';
import AddAppointmentModal from '../components/schedule/AddAppointmentModal';
import ExportModal from '../components/schedule/ExportModal';
import CronSettingsModal from '../components/schedule/CronSettingsModal';

const SchedulePage = () => {
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('scheduleCurrentView') || 'weekly';
  });
  const [overviewData, setOverviewData] = useState([]);
  const [assignedSchedule, setAssignedSchedule] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCronModal, setShowCronModal] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'today'
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch overview data
        const overviewResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/overview`);
        const overviewData = await overviewResponse.json();
        setOverviewData(overviewData);

        // Fetch workers
        const workersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/workers`);
        const workersData = await workersResponse.json();
        const activeWorkers = workersData.filter(worker => worker.Status === 'Active');
        setWorkers(activeWorkers);

        // Load current schedule first
        await loadCurrentSchedule();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleViewChange = (viewName) => {
    setCurrentView(viewName);
    localStorage.setItem('scheduleCurrentView', viewName);
  };

  const handleAutoAssign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/schedule/assign/0`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ showAllSlots })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.assignments) {
        setAssignedSchedule(data.assignments);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      setError(err.message);
      setAssignedSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShowAllSlots = async () => {
    const newShowAllSlots = !showAllSlots;
    setShowAllSlots(newShowAllSlots);
    
    // Auto-generate schedule with new mode
    setIsLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/schedule/assign/${currentWeekOffset}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ showAllSlots: newShowAllSlots })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.assignments) {
        setAssignedSchedule(data.assignments);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      setError(err.message);
      setAssignedSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setAssignedSchedule([]);
    setError(null);
  };

  const loadCurrentSchedule = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`);
      const data = await response.json();
      
      if (data.success && data.assignments) {
        setAssignedSchedule(data.assignments);
      }
    } catch (err) {
      // Silent error handling
    }
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add appointment');
      }
      
      // Refresh the schedule after adding
      await loadCurrentSchedule();
      
      // Close the modal
      setShowAddModal(false);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleDeleteAppointment = async (customerId) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/manual/${customerId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Delete endpoint not found. Please restart the server.');
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete appointment');
      }
      
      // Refresh the schedule after deleting
      await loadCurrentSchedule();
    } catch (err) {
      alert(`Error deleting appointment: ${err.message}`);
    }
  };

  const getFilteredSchedule = () => {
    let filtered = assignedSchedule;
    
    // Filter by today if needed
    if (viewMode === 'today') {
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];
      filtered = filtered.filter(item => item.day === todayName);
    }
    
    // Filter by customer if selected
    if (customerFilter.trim()) {
      filtered = filtered.filter(item => item.customerId === customerFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.villa && item.villa.toString().toLowerCase().includes(search)) ||
        (item.customerName && item.customerName.toLowerCase().includes(search)) ||
        (item.carPlate && item.carPlate.toLowerCase().includes(search))
      );
    }
    
    return filtered;
  };

  const handleCustomerFilter = (customerId) => {
    if (customerFilter === customerId) {
      // If already filtered by this customer, clear filter
      setCustomerFilter('');
    } else {
      // Filter by this customer
      setCustomerFilter(customerId);
    }
  };

  const handleWashTypeUpdate = async (taskId, newWashType) => {
    try {
      // Parse taskId to get task components
      const taskParts = taskId.split('-');
      const [customerId, day, ...rest] = taskParts;
      const carPlate = rest[rest.length - 1] === 'NOPLATE' ? '' : rest[rest.length - 1];
      
      // Find the task to get worker name
      const task = assignedSchedule.find(t => 
        t.customerId === customerId &&
        t.day === day &&
        (t.carPlate || 'NOPLATE') === carPlate
      );
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/update-task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          taskId, 
          newWorkerName: task.workerName,
          newWashType 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wash type');
      }
      
      // Update the local state immediately
      setAssignedSchedule(prev => 
        prev.map(task => 
          `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
            ? { ...task, washType: newWashType, isLocked: 'TRUE' }
            : task
        )
      );
      
    } catch (err) {
      alert(`Error updating wash type: ${err.message}`);
    }
  };

  const loadScheduleForWeek = async (weekOffset) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/${weekOffset}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.assignments) {
        setAssignedSchedule(data.assignments);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      setError(err.message);
      setAssignedSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header with elegant frame - Show in Weekly and Overview */}
      {(currentView === 'weekly' || currentView === 'overview') && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '30px 20px',
          marginBottom: '30px',
          position: 'relative'
        }}>
        {/* Back Button - positioned absolutely */}
        <button
          onClick={() => window.location.href = '/'}
          style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            background: '#28a745',
            color: 'white',
            padding: '12px 15px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '50px',
            height: '50px',
            boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#218838';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#28a745';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
          }}
        >
          ←
        </button>
        

        
        {/* Elegant Title Frame */}
        <div style={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          padding: '25px 50px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(40, 167, 69, 0.2)',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}></div>
          
          {/* Interactive Title Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Overview Button */}
            <button
              onClick={() => handleViewChange('overview')}
              style={{
                background: currentView === 'overview' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: currentView === 'overview' 
                  ? '2px solid rgba(255, 255, 255, 0.8)' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                padding: '15px 30px',
                fontSize: '1.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'overview') {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'overview') {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              📊 Overview
            </button>
            
            {/* Workers Schedule Button */}
            <button
              onClick={() => handleViewChange('weekly')}
              style={{
                background: currentView === 'weekly' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: currentView === 'weekly' 
                  ? '2px solid rgba(255, 255, 255, 0.8)' 
                  : '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                padding: '15px 30px',
                fontSize: '1.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (currentView !== 'weekly') {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'weekly') {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              🚗 Workers Schedule
            </button>
          </div>
          
          {viewMode === 'today' && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
              textAlign: 'center',
              marginTop: '8px',
              fontWeight: '500',
              position: 'relative',
              zIndex: 1
            }}>
              Today's Tasks
            </div>
          )}
        </div>
        
          {/* Subtitle */}
          <p style={{
            color: '#6c757d',
            fontSize: '1.1rem',
            textAlign: 'center',
            margin: '15px 0 0 0',
            fontWeight: '500'
          }}>
            {currentView === 'overview' 
              ? 'View booking statistics and system overview' 
              : 'Manage and organize your team\'s daily assignments'
            }
          </p>
          
          {/* Search Box - Always visible in weekly view */}
          {currentView === 'weekly' && (
            <div style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                type="text"
                placeholder="Search by villa number, customer name, or car plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '25px',
                  border: '2px solid #28a745',
                  fontSize: '16px',
                  width: '400px',
                  outline: 'none',
                  boxShadow: '0 4px 15px rgba(40, 167, 69, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.3)';
                  e.target.style.borderColor = '#20c997';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.2)';
                  e.target.style.borderColor = '#28a745';
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '35px',
                    height: '35px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              {customerFilter && (
                <span style={{
                  color: '#28a745',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Filtered by: {(() => {
                    const customer = assignedSchedule.find(item => item.customerId === customerFilter);
                    return customer ? `${customer.customerName} (Villa ${customer.villa})` : customerFilter;
                  })()}
                  <button
                    onClick={() => setCustomerFilter('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px',
                      marginLeft: '8px'
                    }}
                    title="Clear filter"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      <ScheduleControls 
        onViewChange={handleViewChange}
        onAutoAssign={handleAutoAssign}
        onToggleShowAllSlots={handleToggleShowAllSlots}
        showAllSlots={showAllSlots}
        onClear={handleClear}
        onAdd={() => {
          setShowAddModal(true);
        }}
        onExport={() => {
          setShowExportModal(true);
        }}
        onCronSettings={() => {
          setShowCronModal(true);
        }}
        currentView={currentView}
        currentWeekOffset={currentWeekOffset}
        onWeekChange={async (offset) => {
          // Calculate week dates
          const today = new Date();
          const currentDay = today.getDay();
          let saturdayOfWeek = new Date(today);
          
          if (currentDay === 0) {
            saturdayOfWeek.setDate(today.getDate() - 1);
          } else if (currentDay === 6) {
            // Already Saturday
          } else {
            saturdayOfWeek.setDate(today.getDate() - currentDay - 1);
          }
          
          saturdayOfWeek.setDate(saturdayOfWeek.getDate() + (offset * 7));
          const endOfWeek = new Date(saturdayOfWeek);
          endOfWeek.setDate(saturdayOfWeek.getDate() + 6);
          
          const startDate = saturdayOfWeek.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const endDate = endOfWeek.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          
          // Show confirmation dialog
          const confirmed = window.confirm(
            `Generate auto schedule for week ${startDate} to ${endDate}?`
          );
          
          if (confirmed) {
            setCurrentWeekOffset(offset);
            setIsLoading(true);
            
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/${offset}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ showAllSlots })
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
              }
              
              if (data.success && data.assignments) {
                setAssignedSchedule(data.assignments);
              } else {
                throw new Error(data.error || 'Invalid response format');
              }
            } catch (err) {
              setError(err.message);
              setAssignedSchedule([]);
            } finally {
              setIsLoading(false);
            }
          }
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {isLoading && <div className="text-center">Loading...</div>}
      
      {error && <div className="text-center" style={{ color: 'red' }}>Error: {error}</div>}
      
      {currentView === 'overview' && (
        <BookingOverview overviewData={overviewData} />
      )}
      
      {currentView === 'weekly' && (
        <WorkerScheduleView 
          assignedSchedule={getFilteredSchedule()} 
          workers={workers}
          onScheduleUpdate={setAssignedSchedule}
          onDeleteAppointment={handleDeleteAppointment}
          onWashTypeUpdate={handleWashTypeUpdate}
          onCustomerFilter={handleCustomerFilter}
          customerFilter={customerFilter}
          viewMode={viewMode}
          currentWeekOffset={currentWeekOffset}
        />
      )}
      
      <AddAppointmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAppointment}
        workers={workers}
      />
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        assignedSchedule={assignedSchedule}
        workers={workers}
      />
      
      <CronSettingsModal
        isOpen={showCronModal}
        onClose={() => setShowCronModal(false)}
      />
    </div>
  );
};

export default SchedulePage;