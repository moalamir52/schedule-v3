import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../Modal';
import WeekPatternModal from './WeekPatternModal';
const WorkerScheduleView = React.memo(({ workers, assignedSchedule, onScheduleUpdate, onDeleteAppointment, onWashTypeUpdate, onCustomerFilter, customerFilter, currentWeekOffset = 0 }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [showOverrideMenu, setShowOverrideMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
  const [customerInfo, setCustomerInfo] = useState({ isOpen: false, data: null, appointments: [] });
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [weekPatternModal, setWeekPatternModal] = useState({ isOpen: false, customerInfo: null, changedAppointment: null, weekAppointments: [] });
  const [savingTasks, setSavingTasks] = useState(new Set()); // Track which tasks are being saved
  const [savedTasks, setSavedTasks] = useState(new Set()); // Track recently saved tasks
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];
  // --- REFACTORED DATE CALCULATION ---
  const getWeekStartDate = (offset = 0) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Calculate days to subtract to get to the previous Monday.
    // If today is Sunday (0), we subtract 6 days. If Monday (1), 0 days. If Tuesday (2), 1 day, etc.
    const daysToMonday = (currentDay === 0) ? 6 : currentDay - 1;
    const mondayOfThisWeek = new Date(today);
    mondayOfThisWeek.setDate(today.getDate() - daysToMonday);
    // Apply the week offset
    mondayOfThisWeek.setDate(mondayOfThisWeek.getDate() + (offset * 7));
    mondayOfThisWeek.setHours(0, 0, 0, 0);
    return mondayOfThisWeek;
  };
  const [weekStartDate, setWeekStartDate] = useState(() => getWeekStartDate(currentWeekOffset));
  // Update week start date when currentWeekOffset changes
  useEffect(() => {
    setWeekStartDate(getWeekStartDate(currentWeekOffset));
  }, [currentWeekOffset]);
  // --- END OF REFACTORED DATE CALCULATION ---
  // Auto-refresh disabled for better performance - use manual refresh button instead
  // Helper to parse complex time formats
  const parseTimeSlots = useCallback((timeString) => {
    if (!timeString) return [];
    const timePattern = /\d{1,2}:\d{2}\s*[AP]M/gi;
    const matches = timeString.match(timePattern);
    return matches ? [...new Set(matches.map(time => time.trim()))] : [timeString.trim()];
  }, []);
  // Memoize appointment lookup to prevent redundant filtering
  const appointmentLookup = useMemo(() => {
    if (!assignedSchedule || assignedSchedule.length === 0) {
      return {};
    }
    const lookup = {};
    assignedSchedule.forEach(appointment => {
      // Parse complex time formats to individual time slots
      const timeSlots = parseTimeSlots(appointment.time);
      timeSlots.forEach(timeSlot => {
        const key = `${appointment.workerId}-${appointment.day}-${timeSlot}`;
        if (!lookup[key]) {
          lookup[key] = [];
        }
        lookup[key].push(appointment);
      });
    });
    const totalInLookup = Object.values(lookup).reduce((sum, arr) => sum + arr.length, 0);
    return lookup;
  }, [assignedSchedule, parseTimeSlots]);
  const getAppointmentsForWorkerDayTime = useCallback((workerId, day, time) => {
    const key = `${workerId}-${day}-${time}`;
    return appointmentLookup[key] || [];
  }, [appointmentLookup]);
  const handleDragStart = useCallback((e, customerId, day, time, workerId) => {
    const dragData = { customerId, day, time, workerId };
    setDraggedItem(dragData);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }, []);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);
  // Close override menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowOverrideMenu(null);
    };
    if (showOverrideMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showOverrideMenu]);
  // Sort workers by WorkerID to ensure consistent order
  const sortedWorkers = useMemo(() => {
    if (!workers || workers.length === 0) return [];
    return [...workers].sort((a, b) => {
      const idA = a.WorkerID || a.Name;
      const idB = b.WorkerID || b.Name;
      return idA.localeCompare(idB);
    });
  }, [workers]);
  if (!sortedWorkers || sortedWorkers.length === 0) {
    return <div className="text-center" style={{ padding: '2rem', color: '#666' }}>Loading workers...</div>;
  }
  if (!assignedSchedule || assignedSchedule.length === 0) {
    return (
      <div className="text-center" style={{ padding: '3rem', color: '#666' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📅 No schedule data found</div>
        <div>Press 'Auto' button to generate the schedule</div>
      </div>
    );
  }
  const handleOverrideClick = (e, appointment) => {
    e.stopPropagation();
    const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
    if (showOverrideMenu === taskId) {
      setShowOverrideMenu(null);
    } else {
      const rect = e.target.getBoundingClientRect();
      const menuWidth = 200; // تقريبي لعرض القائمة
      // لو القائمة هتطلع برة الشاشة، حطها على الشمال
      const x = (rect.right + menuWidth > window.innerWidth) 
        ? rect.left - menuWidth - 10 
        : rect.right + 10;
      setMenuPosition({ x, y: rect.top });
      setShowOverrideMenu(taskId);
    }
  };
  const handleWorkerChange = async (appointment, newWorkerName) => {
    const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
    // Update UI immediately for smooth experience
    if (onScheduleUpdate) {
      const updatedSchedule = assignedSchedule.map(task => 
        `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
          ? { ...task, workerName: newWorkerName, isLocked: 'TRUE' }
          : task
      );
      onScheduleUpdate(updatedSchedule);
    }
    
    // Show saving indicator
    setSavingTasks(prev => new Set([...prev, taskId]));
    
    // Save to server in background
    try {
      const changeData = {
        type: 'dragDrop',
        taskId,
        newWorkerName,
        sourceDay: appointment.day,
        sourceTime: appointment.time,
        targetDay: appointment.day,
        targetTime: appointment.time,
        isSlotSwap: false,
        timestamp: Date.now()
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/batch-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': localStorage.getItem('userId') || 'WEB-USER',
          'X-User-Name': localStorage.getItem('userName') || 'Web User'
        },
        body: JSON.stringify({ changes: [changeData] })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update worker');
      }
      
      // Success - show visual confirmation
      console.log('✅ Worker updated successfully');
      setSavingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      setSavedTasks(prev => new Set([...prev, taskId]));
      // Remove saved indicator after 2 seconds
      setTimeout(() => {
        setSavedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      // Revert UI change on error
      if (onScheduleUpdate) {
        const revertedSchedule = assignedSchedule.map(task => 
          `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
            ? { ...task, workerName: appointment.workerName, isLocked: appointment.isLocked }
            : task
        );
        onScheduleUpdate(revertedSchedule);
      }
      alert(`❌ Error changing worker: ${error.message}`);
    }
    setShowOverrideMenu(null);
  };
  const handleWashTypeChange = async (appointment, newWashType) => {
    const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
    // Check if should show week pattern modal
    const customerAppointments = assignedSchedule.filter(apt => 
      apt.customerId === appointment.customerId
    );
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const customerDays = customerAppointments
      .map(apt => apt.day)
      .filter(day => days.includes(day))
      .sort((a, b) => days.indexOf(a) - days.indexOf(b));
    const shouldShowModal = customerAppointments.length > 1 && (
      (customerDays.includes('Monday') && appointment.day === 'Monday') ||
      (!customerDays.includes('Monday') && appointment.day === customerDays[0])
    );
    if (shouldShowModal) {
      // Show week pattern modal
      setWeekPatternModal({
        isOpen: true,
        customerInfo: {
          customerId: appointment.customerId,
          customerName: appointment.customerName,
          villa: appointment.villa,
          packageType: appointment.packageType
        },
        changedAppointment: {
          customerId: appointment.customerId,
          day: appointment.day,
          time: appointment.time,
          carPlate: appointment.carPlate,
          oldWashType: appointment.washType,
          newWashType: newWashType
        },
        weekAppointments: customerAppointments
      });
      setShowOverrideMenu(null);
      return;
    }
    // Update UI immediately
    if (onScheduleUpdate) {
      const updatedSchedule = assignedSchedule.map(task => 
        `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
          ? { ...task, washType: newWashType, isLocked: 'TRUE' }
          : task
      );
      onScheduleUpdate(updatedSchedule);
    }
    // Prepare change data for auto-save
    const changeData = {
      type: 'washTypeChange',
      taskId,
      newWashType,
      workerName: appointment.workerName,
      timestamp: Date.now()
    };
    // Show saving indicator
    setSavingTasks(prev => new Set([...prev, taskId]));
    
    // Save wash type change in background
    setTimeout(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/batch-update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': localStorage.getItem('userId') || 'WEB-USER',
            'X-User-Name': localStorage.getItem('userName') || 'Web User'
          },
          body: JSON.stringify({ changes: [changeData] })
        });
        
        if (response.ok) {
          // Success - show visual confirmation
          console.log('✅ Wash type updated successfully');
          setSavingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
          setSavedTasks(prev => new Set([...prev, taskId]));
          // Remove saved indicator after 2 seconds
          setTimeout(() => {
            setSavedTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskId);
              return newSet;
            });
          }, 2000);
        } else {
          const data = await response.json();
          console.error('❌ Failed to save wash type:', data.error);
          setSavingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
          // Revert UI change on error
          if (onScheduleUpdate) {
            const revertedSchedule = assignedSchedule.map(task => 
              `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
                ? { ...task, washType: appointment.washType, isLocked: appointment.isLocked }
                : task
            );
            onScheduleUpdate(revertedSchedule);
          }
        }
      } catch (error) {
        console.error('❌ Error saving wash type:', error);
        setSavingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        // Revert UI change on error
        if (onScheduleUpdate) {
          const revertedSchedule = assignedSchedule.map(task => 
            `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
              ? { ...task, washType: appointment.washType, isLocked: appointment.isLocked }
              : task
          );
          onScheduleUpdate(revertedSchedule);
        }
      }
    }, 100);
    setShowOverrideMenu(null);
  };
  const handleWeekPatternApply = (changes) => {
    // Find the original changed appointment
    const originalAppointment = assignedSchedule.find(apt => 
      apt.day === weekPatternModal.changedAppointment.day && 
      apt.carPlate === weekPatternModal.changedAppointment.carPlate &&
      apt.time === weekPatternModal.changedAppointment.time
    );
    
    if (!originalAppointment) {
      console.error('Original appointment not found');
      return;
    }
    
    const changedTaskId = `${originalAppointment.customerId}-${originalAppointment.day}-${originalAppointment.time}-${originalAppointment.carPlate}`;
    
    // Update UI for all changes
    if (onScheduleUpdate) {
      let updatedSchedule = [...assignedSchedule];
      
      // Apply the original change (this was already applied, but ensure it's correct)
      updatedSchedule = updatedSchedule.map(task => 
        `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === changedTaskId
          ? { ...task, washType: weekPatternModal.changedAppointment.newWashType, isLocked: 'TRUE' }
          : task
      );
      
      // Apply additional changes from modal
      changes.forEach(change => {
        updatedSchedule = updatedSchedule.map(task => 
          `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === change.taskId
            ? { ...task, washType: change.newWashType, isLocked: 'TRUE' }
            : task
        );
      });
      
      onScheduleUpdate(updatedSchedule);
    }
    
    // Prepare all changes for saving
    const allChanges = [];
    
    // Add the original change
    allChanges.push({
      type: 'washTypeChange',
      taskId: changedTaskId,
      newWashType: weekPatternModal.changedAppointment.newWashType,
      timestamp: Date.now()
    });
    
    // Add additional changes from modal
    changes.forEach(change => {
      allChanges.push({
        type: 'washTypeChange',
        taskId: change.taskId,
        newWashType: change.newWashType,
        timestamp: Date.now()
      });
    });
    
    // Save all changes immediately
    if (allChanges.length > 0) {
      console.log(`💾 Saving ${allChanges.length} week pattern changes:`, allChanges.map(c => `${c.taskId} -> ${c.newWashType}`));
      
      setTimeout(async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/batch-update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-User-ID': localStorage.getItem('userId') || 'WEB-USER',
              'X-User-Name': localStorage.getItem('userName') || 'Web User'
            },
            body: JSON.stringify({ changes: allChanges })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Week pattern updated successfully:`, result);
          } else {
            const data = await response.json();
            console.error('❌ Failed to save week pattern:', data.error);
            // Show user-friendly error
            alert(`❌ Failed to save some changes: ${data.error}`);
          }
        } catch (error) {
          console.error('❌ Error saving week pattern:', error);
          alert(`❌ Network error while saving changes: ${error.message}`);
        }
      }, 100);
    } else {
      console.log('📝 No additional changes to save for week pattern');
    }
  };
  const handleCustomerNameClick = async (customerId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${customerId}`);
      const data = await response.json();
      if (response.ok) {
        // Get all scheduled appointments for this customer
        const customerAppointments = assignedSchedule.filter(appointment => 
          appointment.customerId === customerId
        );
        setCustomerInfo({
          isOpen: true, 
          data: data,
          appointments: customerAppointments
        });
      } else {
        alert('Failed to fetch customer information');
      }
    } catch (error) {
      alert('Error fetching customer information: ' + error.message);
    }
  };
  const handleDeleteTask = (appointment) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Task',
      message: `Are you sure you want to permanently delete this task?\n\nCustomer: ${appointment.customerName}\nVilla: ${appointment.villa}\nTime: ${appointment.day} ${appointment.time}\nCar: ${appointment.carPlate}\n\nThis will remove it completely from the schedule.`,
      onConfirm: () => confirmDeleteTask(appointment)
    });
  };
  const confirmDeleteTask = async (appointment) => {
    setModal({ isOpen: false });
    const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
    
    // Store original schedule for potential revert
    const originalSchedule = [...assignedSchedule];
    
    // Remove from UI immediately for smooth experience
    if (onScheduleUpdate) {
      const updatedSchedule = assignedSchedule.filter(task => 
        `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` !== taskId
      );
      onScheduleUpdate(updatedSchedule);
    }
    
    // Show saving indicator
    setSavingTasks(prev => new Set([...prev, taskId]));
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/delete-task`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }
      
      // Success - remove saving indicator
      setSavingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      
      setShowOverrideMenu(null);
      console.log('✅ Task deleted successfully');
      
    } catch (error) {
      // Revert UI changes on error
      if (onScheduleUpdate) {
        onScheduleUpdate(originalSchedule);
      }
      
      setSavingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Error deleting task: ${error.message}`
      });
    }
  };
  const handleDrop = async (e, targetDay, targetTime, targetWorkerId) => {
    e.preventDefault();
    if (!draggedItem) {
      return;
    }
    const { customerId, day: sourceDay, time: sourceTime, workerId: sourceWorkerId } = draggedItem;
    if (sourceDay === targetDay && sourceTime === targetTime && sourceWorkerId === targetWorkerId) {
      setDraggedItem(null);
      return;
    }
    // Find ALL appointments for this customer at the source slot
    const customerAppointments = assignedSchedule.filter(appointment => 
      appointment.customerId === customerId && 
      appointment.day === sourceDay && 
      appointment.time === sourceTime && 
      appointment.workerId === sourceWorkerId
    );
    if (customerAppointments.length === 0) {
      setDraggedItem(null);
      return;
    }
    // Check if target slot has existing appointments (for swapping)
    const existingAppointments = assignedSchedule.filter(appointment => 
      appointment.workerId === targetWorkerId && 
      appointment.day === targetDay && 
      appointment.time === targetTime
    );
    const targetWorkerName = sortedWorkers.find(w => (w.WorkerID || w.Name) === targetWorkerId)?.Name || targetWorkerId;
    // Update UI immediately for better UX
    let updatedSchedule;
    if (existingAppointments.length > 0) {
      // Handle swap - move ALL customer cars and ALL existing appointments
      updatedSchedule = assignedSchedule.map(appointment => {
        // Move ALL customer appointments to target
        if (appointment.customerId === customerId && 
            appointment.day === sourceDay && 
            appointment.time === sourceTime && 
            appointment.workerId === sourceWorkerId) {
          return {
            ...appointment,
            day: targetDay,
            time: targetTime,
            workerId: targetWorkerId,
            workerName: targetWorkerName,
            isLocked: 'TRUE'
          };
        }
        // Move existing appointments to source
        if (appointment.workerId === targetWorkerId && 
            appointment.day === targetDay && 
            appointment.time === targetTime) {
          const sourceWorkerName = sortedWorkers.find(w => (w.WorkerID || w.Name) === sourceWorkerId)?.Name || sourceWorkerId;
          return {
            ...appointment,
            day: sourceDay,
            time: sourceTime,
            workerId: sourceWorkerId,
            workerName: sourceWorkerName,
            isLocked: 'TRUE'
          };
        }
        return appointment;
      });
    } else {
      // Handle simple move - move ALL customer appointments
      updatedSchedule = assignedSchedule.map(appointment => {
        if (appointment.customerId === customerId && 
            appointment.day === sourceDay && 
            appointment.time === sourceTime && 
            appointment.workerId === sourceWorkerId) {
          return {
            ...appointment,
            day: targetDay,
            time: targetTime,
            workerId: targetWorkerId,
            workerName: targetWorkerName,
            isLocked: 'TRUE'
          };
        }
        return appointment;
      });
    }
    if (onScheduleUpdate) {
      onScheduleUpdate(updatedSchedule);
    }
    setDraggedItem(null);
    // Add drag & drop change to pending changes (same as wash type changes)
    const firstAppointment = customerAppointments[0];
    const taskId = `${customerId}-${sourceDay}-${sourceTime}-${firstAppointment.carPlate}`;
    // Get source worker info for proper swapping
    const sourceWorker = sortedWorkers.find(w => (w.WorkerID || w.Name) === sourceWorkerId);
    // Add to pending changes and save automatically
    const changeData = {
      type: 'dragDrop',
      taskId,
      newWorkerName: targetWorkerName,
      newWorkerId: targetWorkerId,
      sourceDay,
      sourceTime,
      targetDay,
      targetTime,
      isSlotSwap: existingAppointments.length > 0,
      sourceWorkerName: sourceWorker?.Name || '',
      sourceWorkerId: sourceWorker?.WorkerID || sourceWorker?.Name || '',
      timestamp: Date.now()
    };
    // Auto-save drag & drop change immediately
    setTimeout(async () => {
      const changes = [changeData];
      // If there are existing appointments at target (swap case), add swap changes
      if (existingAppointments.length > 0) {
        existingAppointments.forEach(existingApt => {
          const swapTaskId = `${existingApt.customerId}-${targetDay}-${targetTime}-${existingApt.carPlate}`;
          const swapChangeData = {
            type: 'dragDrop',
            taskId: swapTaskId,
            newWorkerName: sourceWorker?.Name || '',
            sourceDay: targetDay,
            sourceTime: targetTime,
            targetDay: sourceDay,
            targetTime: sourceTime,
            isSlotSwap: true,
            timestamp: Date.now()
          };
          changes.push(swapChangeData);
        });
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/batch-update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': localStorage.getItem('userId') || 'WEB-USER',
            'X-User-Name': localStorage.getItem('userName') || 'Web User'
          },
          body: JSON.stringify({ changes })
        });
        if (response.ok) {
          // Success - no page reload needed for drag & drop
          console.log('✅ Drag & drop completed successfully');
        } else {
          const data = await response.json();
          console.error('❌ Failed to save drag & drop:', data.error);
        }
      } catch (error) {
        console.error('❌ Error saving drag & drop:', error);
      }
    }, 100);
  };
  return (
    <>
    <table className="timetable" key={`week-${currentWeekOffset}-${weekStartDate.getTime()}`}>
      <thead>
        <tr>
          <th rowSpan="2">Time</th>
          {days.map((day, dayIndex) => {
            const targetDate = new Date(weekStartDate);
            targetDate.setDate(weekStartDate.getDate() + dayIndex);
            const displayDate = targetDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit'
            });
            return (
              <th key={day} colSpan={sortedWorkers.length}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{day.substring(0, 3)}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{displayDate}</div>
                </div>
              </th>
            );
          })}
        </tr>
        <tr>
          {days.map((day, dayIndex) => 
            sortedWorkers.map((worker, workerIndex) => (
              <th 
                key={`${day}-${worker.WorkerID || worker.Name}`}
                className={workerIndex === sortedWorkers.length - 1 ? 'day-separator' : ''}
                style={{ fontSize: '11px' }}
              >
                {worker.Name}
              </th>
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map((time, timeIndex) => (
          <tr key={time}>
            <td className="time-slot">{time}</td>
            {days.map((day, dayIndex) => 
              sortedWorkers.map((worker, workerIndex) => (
                <td 
                  key={`${day}-${worker.WorkerID || worker.Name}-${time}`}
                  className={`${workerIndex === sortedWorkers.length - 1 ? 'day-separator' : ''} drop-zone`}
                  style={{ padding: '4px', width: '120px' }}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e, day, time, worker.WorkerID || worker.Name);
                  }}
                >
                  {(() => {
                    const workerId = worker.WorkerID || worker.Name;
                    const appointments = getAppointmentsForWorkerDayTime(workerId, day, time);
                    // Debug first few cells
                    if (timeIndex === 0 && dayIndex === 0 && workerIndex === 0) {
                      }
                    const groupedByCustomer = appointments.reduce((groups, appointment) => {
                      const customerKey = `${appointment.customerId}-${appointment.carPlate}`;
                      if (!groups[customerKey]) {
                        groups[customerKey] = [];
                      }
                      groups[customerKey].push(appointment);
                      return groups;
                    }, {});
                    return Object.entries(groupedByCustomer).map(([customerKey, customerAppointments]) => {
                      const groupKey = `${worker.WorkerID || worker.Name}-${day}-${time}-${customerKey}`;
                      const customerId = customerAppointments[0]?.customerId;
                      return (
                        <div 
                          key={groupKey} 
                          className="customer-group" 
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, customerId, day, time, worker.WorkerID || worker.Name)}
                        >
                          {customerAppointments.map((appointment, index) => {
                            const key = `${groupKey}-${index}`;
                            return (
                              <div 
                                key={key}
                                className={`appointment-item ${appointment.washType === 'INT' ? 'int-type' : ''} ${appointment.washType === 'CANCELLED' || appointment.status === 'Cancelled' ? 'cancelled-task' : ''} ${appointment.washType === 'COMPLETED' || appointment.status === 'Completed' || appointment.isCompleted ? 'completed-task' : ''} ${appointment.customerId && appointment.customerId.startsWith('MANUAL_') ? 'manual-appointment' : ''}`}
                                style={{ 
                                  position: 'relative',
                                  opacity: savingTasks.has(`${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`) ? 0.7 : 1,
                                  border: savedTasks.has(`${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`) ? '2px solid #28a745' : 'none',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={(e) => {
                                  // Only filter if not clicking on interactive elements
                                  if (!e.target.closest('.customer-name, .wash-type, .delete-btn') && !showOverrideMenu) {
                                    e.stopPropagation();
                                    if (onCustomerFilter) {
                                      onCustomerFilter(appointment.customerId);
                                    }
                                  }
                                }}
                              >
                                <div 
                                  className={`customer-name ${appointment.packageType && appointment.packageType.toLowerCase().includes('bi week') ? 'bi-week-badge' : ''} ${appointment.customerStatus === 'Booked' ? 'booked-customer' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCustomerNameClick(appointment.customerId);
                                  }}
                                >
                                  {appointment.customerName}
                                  {appointment.customerId && appointment.customerId.startsWith('MANUAL_') && (
                                    <button 
                                      className="delete-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeleteAppointment) {
                                          onDeleteAppointment(appointment.customerId);
                                        }
                                      }}
                                      title="Delete Appointment"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                                <div className="villa">{appointment.villa}</div>
                                <div className="car-plate">{appointment.carPlate}</div>
                                <div 
                                  className="wash-type"
                                  onClick={(e) => {
                                    // Don't allow editing completed/cancelled tasks
                                    if (appointment.washType === 'CANCELLED' || appointment.washType === 'COMPLETED' || appointment.status === 'Completed' || appointment.status === 'Cancelled' || appointment.isCompleted) {
                                      e.stopPropagation();
                                      return;
                                    }
                                    handleOverrideClick(e, appointment);
                                  }}
                                  style={{ 
                                    cursor: (appointment.washType === 'CANCELLED' || appointment.washType === 'COMPLETED' || appointment.status === 'Completed' || appointment.status === 'Cancelled' || appointment.isCompleted) ? 'default' : 'pointer', 
                                    fontWeight: 'bold',
                                    position: 'relative'
                                  }}
                                  title={(appointment.washType === 'CANCELLED' || appointment.status === 'Cancelled') ? 'Task was cancelled' : 
                                         (appointment.washType === 'COMPLETED' || appointment.status === 'Completed' || appointment.isCompleted) ? 'Task completed' : 
                                         'Click to change wash type'}
                                >
                                  {appointment.customerStatus === 'Booked' ? '📋 BOOKED' : 
                                   appointment.originalWashType || appointment.washType}
                                  {savingTasks.has(`${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`) && (
                                    <span style={{
                                      position: 'absolute',
                                      top: '-5px',
                                      right: '-5px',
                                      fontSize: '10px',
                                      color: '#ffc107'
                                    }}>💾</span>
                                  )}
                                  {savedTasks.has(`${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`) && (
                                    <span style={{
                                      position: 'absolute',
                                      top: '-5px',
                                      right: '-5px',
                                      fontSize: '10px',
                                      color: '#28a745'
                                    }}>✅</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                </td>
              ))
            )}
          </tr>
        ))}
      </tbody>
    </table>
    {/* Override Menu - Outside table */}
    {showOverrideMenu && (() => {
      const appointment = assignedSchedule.find(apt => 
        `${apt.customerId}-${apt.day}-${apt.time}-${apt.carPlate}` === showOverrideMenu
      );
      return appointment ? (
        <div style={{
          position: 'fixed',
          top: menuPosition.y,
          left: menuPosition.x,
          backgroundColor: 'white',
          border: '2px solid #28a745',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          zIndex: 99999,
          minWidth: '180px'
        }}>
          <div style={{
            padding: '12px 15px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #eee',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#28a745',
            textAlign: 'center'
          }}>
            Change Wash Type
          </div>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 18px',
              border: 'none',
              backgroundColor: appointment.washType === 'EXT' ? '#e8f5e9' : 'white',
              cursor: 'pointer',
              fontSize: '16px',
              textAlign: 'center',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: appointment.washType === 'EXT' ? 'bold' : 'normal'
            }}
            onClick={() => handleWashTypeChange(appointment, 'EXT')}
          >
            🚗 EXT Only {appointment.washType === 'EXT' && '✓'}
          </button>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 18px',
              border: 'none',
              backgroundColor: appointment.washType === 'INT' ? '#e8f5e9' : 'white',
              cursor: 'pointer',
              fontSize: '16px',
              textAlign: 'center',
              borderBottom: '1px solid #f0f0f0',
              fontWeight: appointment.washType === 'INT' ? 'bold' : 'normal'
            }}
            onClick={() => handleWashTypeChange(appointment, 'INT')}
          >
            🧽 EXT + INT {appointment.washType === 'INT' && '✓'}
          </button>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 18px',
              border: 'none',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              textAlign: 'center',
              borderBottom: '1px solid #c82333'
            }}
            onClick={() => handleDeleteTask(appointment)}
          >
            🗑️ Delete Task
          </button>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 18px',
              border: 'none',
              backgroundColor: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              textAlign: 'center'
            }}
            onClick={() => setShowOverrideMenu(null)}
          >
            ❌ Close
          </button>
        </div>
      ) : null;
    })()}
    <Modal
      isOpen={modal.isOpen}
      onClose={() => setModal({ isOpen: false })}
      type={modal.type}
      title={modal.title}
      message={modal.message}
      onConfirm={modal.onConfirm}
    />
    {/* Customer Info Modal */}
    {customerInfo.isOpen && (
      <div className="customer-info-modal" onClick={() => setCustomerInfo({ isOpen: false, data: null, appointments: [] }) }>
        <div className="customer-info-content" onClick={(e) => e.stopPropagation()}>
          <div className="customer-info-header">
            <h3>{customerInfo.data?.CustomerName || 'Customer Information'}</h3>
            <button 
              className="close-customer-info"
              onClick={() => setCustomerInfo({ isOpen: false, data: null, appointments: [] })}
            >
              ×
            </button>
          </div>
          <div className="customer-info-body">
            <div className="info-row">
              <span className="info-label">Customer ID:</span>
              <span className="info-value">{customerInfo.data?.CustomerID || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{customerInfo.data?.Name || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Villa:</span>
              <span className="info-value">{customerInfo.data?.Villa || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{customerInfo.data?.Phone || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Package:</span>
              <span className="info-value">{customerInfo.data?.Washman_Package || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Serves:</span>
              <span className="info-value">{customerInfo.data?.Serves || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Car Plates:</span>
              <span className="info-value">{customerInfo.data?.CarPlates || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Wash Days:</span>
              <span className="info-value">{customerInfo.data?.Days || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Scheduled Appointments:</span>
              <span className="info-value">
                {customerInfo.appointments && customerInfo.appointments.length > 0 ? (
                  <div style={{ textAlign: 'right' }}>
                    {customerInfo.appointments.map((apt, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>
                        {apt.day} {apt.time} - {apt.carPlate} ({apt.washType})
                      </div>
                    ))}
                  </div>
                ) : 'No appointments scheduled'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Fee:</span>
              <span className="info-value">{customerInfo.data?.Fee || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Start Date:</span>
              <span className="info-value">{customerInfo.data?.['start date'] || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Payment:</span>
              <span className="info-value">{customerInfo.data?.payment || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value">{customerInfo.data?.Status || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    )}
    <WeekPatternModal
      isOpen={weekPatternModal.isOpen}
      onClose={() => setWeekPatternModal({ isOpen: false, customerInfo: null, changedAppointment: null, weekAppointments: [] })}
      customerInfo={weekPatternModal.customerInfo}
      changedAppointment={weekPatternModal.changedAppointment}
      weekAppointments={weekPatternModal.weekAppointments}
      onApplyChanges={handleWeekPatternApply}
    />
    </>
  );
});
export default WorkerScheduleView;
