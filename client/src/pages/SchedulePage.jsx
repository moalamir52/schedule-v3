import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ScheduleControls from '../components/schedule/ScheduleControls';
import BookingOverview from '../components/schedule/BookingOverview';
import WorkerScheduleView from '../components/schedule/WorkerScheduleView';
import AddAppointmentModal from '../components/schedule/AddAppointmentModal';
import ExportModal from '../components/schedule/ExportModal';
import CronSettingsModal from '../components/schedule/CronSettingsModal';
import '../styles/smooth-interactions.css';
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
        // Auto-load schedule on page load/refresh
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
  // Update - يقرأ الجدولة الموجودة من قاعدة البيانات فقط (Refresh)
  // دالة تحديث سلسة بدون إعادة تحميل
  const refreshData = async () => {
    try {
      await loadCurrentSchedule();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleAutoAssign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.assignments) {
          // Normalize the data structure to match frontend expectations
          const normalizedAssignments = data.assignments.map(appointment => ({
            day: appointment.Day,
            time: appointment.Time,
            workerId: appointment.WorkerID,
            workerName: appointment.WorkerName,
            customerId: appointment.CustomerID,
            customerName: appointment.CustomerName,
            villa: appointment.Villa,
            carPlate: appointment.CarPlate,
            washType: appointment.WashType,
            packageType: appointment.PackageType,
            isLocked: appointment.isLocked,
            appointmentDate: appointment.AppointmentDate,
            scheduleDate: appointment.ScheduleDate
          }));
          setAssignedSchedule(normalizedAssignments);
          setError(null);
        } else if (Array.isArray(data)) {
          // Handle direct array response
          const normalizedAssignments = data.map(appointment => ({
            day: appointment.Day || appointment.day,
            time: appointment.Time || appointment.time,
            workerId: appointment.WorkerID || appointment.workerId,
            workerName: appointment.WorkerName || appointment.workerName,
            customerId: appointment.CustomerID || appointment.customerId,
            customerName: appointment.CustomerName || appointment.customerName,
            villa: appointment.Villa || appointment.villa,
            carPlate: appointment.CarPlate || appointment.carPlate,
            washType: appointment.WashType || appointment.washType,
            packageType: appointment.PackageType || appointment.packageType,
            isLocked: appointment.isLocked,
            appointmentDate: appointment.AppointmentDate || appointment.appointmentDate,
            scheduleDate: appointment.ScheduleDate || appointment.scheduleDate
          }));
          setAssignedSchedule(normalizedAssignments);
          setError(null);
        } else {
          setAssignedSchedule([]);
          setError('No schedule data found. Use Smart Auto-Schedule to generate.');
        }
      } else {
        throw new Error('Failed to load schedule from server');
      }
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
        const newCustomers = data.newCustomers || [];
        if (addedCount > 0) {
          setTimeout(async () => {
            await refreshData();
          }, 1000);
          // Success - no alert needed
        } else {
          // No new customers - no alert needed
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
  // Smart Auto-Schedule - يحافظ على العملاء المحميين
  const handleGenerateNew = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/schedule/assign/smart/${currentWeekOffset}`;
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
        // No need to refresh - UI already updated
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
  // Clear All Data - يمسح كل البيانات من قاعدة البيانات
  const handleForceReset = async () => {
    if (!confirm('Are you sure you want to clear ALL schedule data from the database? This cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    try {
      // Try multiple endpoints
      const endpoints = [
        '/api/clear-all-schedule',
        '/api/schedule-reset/clear',
        '/api/schedule/assign/clear'
      ];
      let success = false;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              success = true;
              break;
            }
          }
        } catch (e) {
          }
      }
      if (success) {
        setAssignedSchedule([]);
        setError(null);
        alert('✅ All schedule data cleared from database successfully!');
        // No need to refresh - data already cleared
      } else {
        // Force clear local state and refresh
        setAssignedSchedule([]);
        setError(null);
        // Try to force clear by calling the Update button API with empty data
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`, {
            method: 'DELETE'
          });
        } catch (e) {
          }
        alert('✅ Local schedule cleared! Syncing with database...');
        setTimeout(async () => {
          await refreshData();
        }, 500);
      }
    } catch (err) {
      setError('Failed to clear schedule data');
      alert('❌ Error clearing schedule data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const loadCurrentSchedule = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.assignments) {
          // Normalize the data structure to match frontend expectations
          const normalizedAssignments = data.assignments.map(appointment => ({
            day: appointment.Day,
            time: appointment.Time,
            workerId: appointment.WorkerID,
            workerName: appointment.WorkerName,
            customerId: appointment.CustomerID,
            customerName: appointment.CustomerName,
            villa: appointment.Villa,
            carPlate: appointment.CarPlate,
            washType: appointment.WashType,
            packageType: appointment.PackageType,
            isLocked: appointment.isLocked,
            appointmentDate: appointment.AppointmentDate,
            scheduleDate: appointment.ScheduleDate
          }));
          setAssignedSchedule(normalizedAssignments);
          setError(null);
        } else if (Array.isArray(data)) {
          // Handle direct array response
          const normalizedAssignments = data.map(appointment => ({
            day: appointment.Day || appointment.day,
            time: appointment.Time || appointment.time,
            workerId: appointment.WorkerID || appointment.workerId,
            workerName: appointment.WorkerName || appointment.workerName,
            customerId: appointment.CustomerID || appointment.customerId,
            customerName: appointment.CustomerName || appointment.customerName,
            villa: appointment.Villa || appointment.villa,
            carPlate: appointment.CarPlate || appointment.carPlate,
            washType: appointment.WashType || appointment.washType,
            packageType: appointment.PackageType || appointment.packageType,
            isLocked: appointment.isLocked,
            appointmentDate: appointment.AppointmentDate || appointment.appointmentDate,
            scheduleDate: appointment.ScheduleDate || appointment.scheduleDate
          }));
          setAssignedSchedule(normalizedAssignments);
          setError(null);
        } else {
          setAssignedSchedule([]);
          setError('No schedule data found. Click Auto button to load schedule.');
        }
      } else {
        setAssignedSchedule([]);
        setError(`Server error: ${response.status}. Click Auto button to load schedule.`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Connection timeout. Click Auto button to load schedule.');
      } else {
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
      setIsLoading(true);
      try {
        await loadCurrentSchedule();
        alert(`✅ Appointment added successfully!\n\nVilla: ${appointmentData.villa}\nDay: ${appointmentData.day}\nTime: ${appointmentData.time}\nWorker: ${appointmentData.workerName}\nWash Type: ${appointmentData.washType}`);
      } catch (refreshError) {
        alert('⚠️ Appointment added but failed to refresh schedule. Please try clicking Update button.');
      } finally {
        setIsLoading(false);
      }
      // Close the modal
      setShowAddModal(false);
    } catch (err) {
      throw new Error(err.message);
    }
  };
  const handleDeleteAppointment = useCallback(async (customerId) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    // Store original schedule for potential revert
    const originalSchedule = [...assignedSchedule];
    
    // Remove from UI immediately
    const updatedSchedule = assignedSchedule.filter(task => task.customerId !== customerId);
    setAssignedSchedule(updatedSchedule);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/manual/${customerId}`, {
        method: 'DELETE',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Delete endpoint not found. Please restart the server.');
        }
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete appointment');
      }
      
      console.log('✅ Appointment deleted successfully');
      
    } catch (err) {
      // Revert UI changes on error
      setAssignedSchedule(originalSchedule);
      
      if (err.name === 'AbortError') {
        alert('Delete operation timed out. Please check your connection and try again.');
      } else {
        alert(`Error deleting appointment: ${err.message}`);
      }
    }
  }, [assignedSchedule]);
  // Memoize filtered schedule to prevent recalculation on every render
  const filteredSchedule = useMemo(() => {
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
  }, [assignedSchedule, viewMode, customerFilter, searchTerm]);
  const handleCustomerFilter = useCallback((customerId) => {
    if (customerFilter === customerId) {
      // If already filtered by this customer, clear filter
      setCustomerFilter('');
    } else {
      // Filter by this customer
      setCustomerFilter(customerId);
    }
  }, [customerFilter]);
  const handleWashTypeUpdate = useCallback(async (taskId, newWashType) => {
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
      
      // Update UI immediately for smooth experience
      const originalSchedule = [...assignedSchedule];
      setAssignedSchedule(prev => 
        prev.map(t => {
          if (t.customerId === customerId && t.day === day) {
            // Lock all cars of this customer on this day
            return { ...t, isLocked: 'TRUE' };
          }
          if (`${t.customerId}-${t.day}-${t.time}-${t.carPlate}` === taskId) {
            // Update the specific wash type
            return { ...t, washType: newWashType, isLocked: 'TRUE' };
          }
          return t;
        })
      );
      
      // Save to server in background
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/update-task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          taskId, 
          newWorkerName: task.workerName,
          newWashType,
          keepCustomerTogether: true
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Revert UI changes on error
        setAssignedSchedule(originalSchedule);
        throw new Error(data.error || 'Failed to update wash type');
      }
      
      // Success - no page reload needed
      console.log('✅ Wash type updated successfully');
      
    } catch (err) {
      alert(`Error updating wash type: ${err.message}`);
    }
  }, [assignedSchedule]);
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
        onForceReset={handleForceReset}
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
          // Update the week offset first
          setCurrentWeekOffset(offset);
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
          assignedSchedule={filteredSchedule} 
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