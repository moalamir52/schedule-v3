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
        // Parallel fetch for better performance
        const [overviewResponse, workersResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/schedule/overview`),
          fetch(`${import.meta.env.VITE_API_URL}/api/workers`)
        ]);
        
        const [overviewData, workersData] = await Promise.all([
          overviewResponse.json(),
          workersResponse.json()
        ]);
        
        setOverviewData(overviewData);
        const activeWorkers = workersData.filter(worker => worker.Status === 'Active');
        setWorkers(activeWorkers);

        // Load current schedule (non-blocking)
        console.log('[LOAD-SCHEDULE] Calling loadCurrentSchedule from useEffect');
        loadCurrentSchedule();
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

  // Auto - يقرأ الجدولة الموجودة من الإكسل فقط (F5)
  const handleAutoAssign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // استخدام نفس الدالة المستخدمة في F5
      await loadCurrentSchedule();
    } catch (err) {
      setError(err.message);
      setAssignedSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sync New Customers - يضيف العملاء الجدد فقط
  const handleSyncNewCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/sync-new-customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weekOffset: currentWeekOffset })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync new customers');
      }
      
      if (data.success && data.assignments) {
        setAssignedSchedule(data.assignments);
        const addedCount = data.newCustomersCount || 0;
        if (addedCount > 0) {
          alert(`✅ Successfully added ${addedCount} new customers to schedule!`);
        } else {
          alert('ℹ️ No new customers found to add. All customers are already in the schedule.');
        }
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  


  const handleToggleShowAllSlots = async () => {
    const newShowAllSlots = !showAllSlots;
    setShowAllSlots(newShowAllSlots);
    
    // Just toggle the mode, don't auto-generate
    // User needs to press Auto button to apply changes
  };

  const handleClear = () => {
    setAssignedSchedule([]);
    setError(null);
  };
  
  const handleGenerateNew = async () => {
    const confirmed = window.confirm(
      'This will generate a completely new schedule and overwrite any existing data. Are you sure?'
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/schedule/assign/${currentWeekOffset}`;
      
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

  const loadCurrentSchedule = async () => {
    try {
      console.log('[F5-DEBUG] Starting loadCurrentSchedule...');
      console.log('[F5-DEBUG] API URL:', import.meta.env.VITE_API_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 seconds
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('[F5-DEBUG] Response status:', response.status);
      console.log('[F5-DEBUG] Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[F5-DEBUG] Response data:', data);
        
        if (data.success && data.assignments) {
          console.log('[F5-DEBUG] Setting schedule with', data.assignments.length, 'assignments');
          setAssignedSchedule(data.assignments);
        } else {
          console.log('[F5-DEBUG] No assignments found, setting empty array');
          setAssignedSchedule([]);
          setError('No schedule data found. Click Auto button to load schedule.');
        }
      } else {
        console.log('[F5-DEBUG] Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('[F5-DEBUG] Error response:', errorText);
        setAssignedSchedule([]);
        setError(`Server error: ${response.status}. Click Auto button to load schedule.`);
      }
    } catch (err) {
      console.log('[F5-DEBUG] Catch error:', err);
      if (err.name === 'AbortError') {
        console.warn('[F5-DEBUG] Schedule load timed out');
        setError('Connection timeout. Click Auto button to load schedule.');
      } else {
        console.error('[F5-DEBUG] Load error:', err.message);
        setError(`Connection error: ${err.message}. Click Auto button to load schedule.`);
      }
      setAssignedSchedule([]);
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
        onSyncNewCustomers={handleSyncNewCustomers}
        onGenerateNew={handleGenerateNew}
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
          // Calculate week dates (Monday to Saturday)
          const today = new Date();
          const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
          
          // Find Monday of current week
          let mondayOfWeek = new Date(today);
          const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 6 days from Monday
          mondayOfWeek.setDate(today.getDate() - daysFromMonday);
          
          // Add offset weeks
          mondayOfWeek.setDate(mondayOfWeek.getDate() + (offset * 7));
          
          // Saturday is 5 days after Monday
          const saturdayOfWeek = new Date(mondayOfWeek);
          saturdayOfWeek.setDate(mondayOfWeek.getDate() + 5);
          
          const startDate = mondayOfWeek.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          const endDate = saturdayOfWeek.toLocaleDateString('en-US', {
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