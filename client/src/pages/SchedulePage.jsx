import React, { useState, useEffect } from 'react';
import ScheduleControls from '../components/schedule/ScheduleControls';
import BookingOverview from '../components/schedule/BookingOverview';
import WorkerScheduleView from '../components/schedule/WorkerScheduleView';
import AddAppointmentModal from '../components/schedule/AddAppointmentModal';
import ExportModal from '../components/schedule/ExportModal';

const SchedulePage = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [overviewData, setOverviewData] = useState([]);
  const [assignedSchedule, setAssignedSchedule] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'today'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch overview data
        const overviewResponse = await fetch('http://localhost:5000/api/schedule/overview');
        const overviewData = await overviewResponse.json();
        setOverviewData(overviewData);

        // Fetch workers
        const workersResponse = await fetch('http://localhost:5000/api/workers');
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
  };

  const handleAutoAssign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/schedule/assign', {
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

  const handleClear = () => {
    setAssignedSchedule([]);
    setError(null);
  };

  const loadCurrentSchedule = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/schedule/assign/current');
      const data = await response.json();
      
      if (data.success && data.assignments) {
        setAssignedSchedule(data.assignments);
      }
    } catch (err) {
      console.error('Failed to load current schedule:', err);
    }
  };

  const handleAddAppointment = async (appointmentData) => {
    try {
      const response = await fetch('http://localhost:5000/api/schedule/assign/manual', {
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
      const response = await fetch(`http://localhost:5000/api/schedule/assign/manual/${customerId}`, {
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
      console.error('Delete error:', err);
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

  const handleWashTypeUpdate = async (taskId, newWashType) => {
    try {
      const response = await fetch('http://localhost:5000/api/schedule/assign/update-wash-type', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId, newWashType })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wash type');
      }
      
      // Update the local state immediately
      setAssignedSchedule(prev => 
        prev.map(task => 
          `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
            ? { ...task, washType: newWashType }
            : task
        )
      );
      
      console.log(`Wash type updated to ${newWashType} for task ${taskId}`);
    } catch (err) {
      console.error('Update wash type error:', err);
      alert(`Error updating wash type: ${err.message}`);
    }
  };

  const loadScheduleForWeek = async (weekOffset) => {
    if (weekOffset === 0) {
      await loadCurrentSchedule();
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/schedule/assign/week/${weekOffset}`, {
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
            </div>
          )}
        </div>
      )}
      
      <ScheduleControls 
        onViewChange={handleViewChange}
        onAutoAssign={handleAutoAssign}
        onClear={handleClear}
        onAdd={() => {
          console.log('Add button clicked');
          setShowAddModal(true);
        }}
        onExport={() => {
          setShowExportModal(true);
        }}
        currentView={currentView}
        currentWeekOffset={currentWeekOffset}
        onWeekChange={(offset) => {
          setCurrentWeekOffset(offset);
          loadScheduleForWeek(offset);
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
    </div>
  );
};

export default SchedulePage;