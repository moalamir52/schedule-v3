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
  
  // Memoize appointment lookup to prevent redundant filtering
  const appointmentLookup = useMemo(() => {
    if (!assignedSchedule || assignedSchedule.length === 0) {
      return {};
    }
    const lookup = {};
    assignedSchedule.forEach(appointment => {
      const key = `${appointment.workerId}-${appointment.day}-${appointment.time}`;
      if (!lookup[key]) {
        lookup[key] = [];
      }
      lookup[key].push(appointment);
    });
    return lookup;
  }, [assignedSchedule]);

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
    console.log('🔧 [WORKER-CHANGE] Starting worker change...');
    console.log('🔧 [WORKER-CHANGE] Appointment:', appointment);
    console.log('🔧 [WORKER-CHANGE] New worker:', newWorkerName);
    
    const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
    console.log('🔧 [WORKER-CHANGE] Task ID:', taskId);
    
    // Update UI immediately
    if (onScheduleUpdate) {
      console.log('🔧 [WORKER-CHANGE] Updating UI...');
      const updatedSchedule = assignedSchedule.map(task => 
        `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
          ? { ...task, workerName: newWorkerName, isLocked: 'TRUE' }
          : task
      );
      onScheduleUpdate(updatedSchedule);
      console.log('🔧 [WORKER-CHANGE] UI updated');
    }
    
    // Save immediately to server using batch update
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
      
      console.log('🔧 [WORKER-CHANGE] Sending request with data:', changeData);
      console.log('🔧 [WORKER-CHANGE] API URL:', `${import.meta.env.VITE_API_URL}/api/schedule/assign/batch-update`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/batch-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': localStorage.getItem('userId') || 'WEB-USER',
          'X-User-Name': localStorage.getItem('userName') || 'Web User'
        },
        body: JSON.stringify({ changes: [changeData] })
      });
      
      console.log('🔧 [WORKER-CHANGE] Response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.log('🔧 [WORKER-CHANGE] Error response:', data);
        throw new Error(data.error || 'Failed to update worker');
      }
      
      const responseData = await response.json();
      console.log('🔧 [WORKER-CHANGE] Success response:', responseData);
      
      console.log('🔧 [WORKER-CHANGE] Worker change completed successfully!');
      // Success - no alert needed
      
    } catch (error) {
      console.error('🔧 [WORKER-CHANGE] Error:', error);
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
      type: 'washType',
      taskId,
      newWashType,
      workerName: appointment.workerName,
      timestamp: Date.now()
    };
    
    console.log('[WASH-TYPE] Preparing to save wash type change:', changeData);
    
    // Auto-save wash type change immediately
    setTimeout(async () => {
      console.log('[WASH-TYPE] Auto-saving wash type change...');
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
          console.log('[WASH-TYPE] ✅ Wash type saved successfully!');
          // Success - no alert needed
        } else {
          console.error('[WASH-TYPE] ❌ Failed to save wash type');
        }
      } catch (error) {
        console.error('[WASH-TYPE] ❌ Error saving:', error);
      }
    }, 100);
    
    console.log('[WASH-TYPE] Change will be saved automatically.');
    
    setShowOverrideMenu(null);
  };

  const handleWeekPatternApply = (changes) => {
    // Apply the changed appointment first
    const changedTaskId = `${weekPatternModal.changedAppointment.customerId || assignedSchedule.find(apt => 
      apt.day === weekPatternModal.changedAppointment.day && 
      apt.carPlate === weekPatternModal.changedAppointment.carPlate
    )?.customerId}-${weekPatternModal.changedAppointment.day}-${assignedSchedule.find(apt => 
      apt.day === weekPatternModal.changedAppointment.day && 
      apt.carPlate === weekPatternModal.changedAppointment.carPlate
    )?.time}-${weekPatternModal.changedAppointment.carPlate}`;
    
    // Update UI for all changes
    if (onScheduleUpdate) {
      let updatedSchedule = [...assignedSchedule];
      
      // Apply the original change
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
    
    // Auto-save all week pattern changes
    const allChanges = [
      {
        type: 'washType',
        taskId: changedTaskId,
        newWashType: weekPatternModal.changedAppointment.newWashType,
        timestamp: Date.now()
      },
      ...changes.map(change => ({
        type: 'washType',
        taskId: change.taskId,
        newWashType: change.newWashType,
        timestamp: Date.now()
      }))
    ];
    
    // Save all changes immediately
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
          console.log('[WEEK-PATTERN] ✅ Week pattern changes saved successfully!');
          // Success - no alert needed
        }
      } catch (error) {
        console.error('[WEEK-PATTERN] ❌ Error saving:', error);
      }
    }, 100);
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
    
    try {
      const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
      
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
      
      // Remove the task from local state immediately
      if (onScheduleUpdate) {
        const updatedSchedule = assignedSchedule.filter(task => 
          `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` !== taskId
        );
        onScheduleUpdate(updatedSchedule);
      }
      
      setShowOverrideMenu(null);
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: `Task deleted successfully!\n\nCustomer: ${appointment.customerName}\nVilla: ${appointment.villa}\nCar: ${appointment.carPlate}`
      });
      
    } catch (error) {
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
      console.log('[DRAG-DROP] ⚠️ No dragged item found');
      return;
    }
    
    console.log('[DRAG-DROP] 📦 Drop started:', {
      draggedItem,
      target: { targetDay, targetTime, targetWorkerId }
    });
    
    const { customerId, day: sourceDay, time: sourceTime, workerId: sourceWorkerId } = draggedItem;
    
    if (sourceDay === targetDay && sourceTime === targetTime && sourceWorkerId === targetWorkerId) {
      console.log('[DRAG-DROP] ⚠️ Same position drop - ignoring');
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
      console.log('[DRAG-DROP] ⚠️ No customer appointments found');
      setDraggedItem(null);
      return;
    }
    
    console.log('[DRAG-DROP] 📋 Found appointments:', customerAppointments.length);

    // Check if target slot has existing appointments (for swapping)
    const existingAppointments = assignedSchedule.filter(appointment => 
      appointment.workerId === targetWorkerId && 
      appointment.day === targetDay && 
      appointment.time === targetTime
    );

    const targetWorkerName = sortedWorkers.find(w => (w.WorkerID || w.Name) === targetWorkerId)?.Name || targetWorkerId;
    
    console.log('[DRAG-DROP] 👷 Target worker:', targetWorkerName);
    console.log('[DRAG-DROP] 🔄 Existing appointments at target:', existingAppointments.length);
    
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
      console.log('[DRAG-DROP] 🔄 Updating UI with new schedule');
      onScheduleUpdate(updatedSchedule);
    }
    
    setDraggedItem(null);

    // Add drag & drop change to pending changes (same as wash type changes)
    const firstAppointment = customerAppointments[0];
    const taskId = `${customerId}-${sourceDay}-${sourceTime}-${firstAppointment.carPlate}`;
    
    console.log('[DRAG-DROP] 📤 Adding to pending changes:', {
      taskId,
      targetWorkerName,
      targetWorkerId,
      sourceDay,
      sourceTime,
      targetDay,
      targetTime,
      isSlotSwap: existingAppointments.length > 0
    });
    
    console.log('[DRAG-DROP] 🔍 Worker details:', {
      targetWorker: sortedWorkers.find(w => (w.WorkerID || w.Name) === targetWorkerId),
      allWorkers: sortedWorkers.map(w => ({ id: w.WorkerID, name: w.Name }))
    });
    
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
    
    console.log('[DRAG-DROP] Preparing to save drag & drop change:', changeData);
    
    // Auto-save drag & drop change immediately
    setTimeout(async () => {
      console.log('[DRAG-DROP] Auto-saving drag & drop change...');
      
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
          console.log('[DRAG-DROP] ✅ Drag & drop saved successfully!');
          // Success - no alert needed
        } else {
          console.error('[DRAG-DROP] ❌ Failed to save drag & drop');
        }
      } catch (error) {
        console.error('[DRAG-DROP] ❌ Error saving:', error);
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
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{day}</div>
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
                                  position: 'relative'
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
                                    fontWeight: 'bold'
                                  }}
                                  title={(appointment.washType === 'CANCELLED' || appointment.status === 'Cancelled') ? 'Task was cancelled' : 
                                         (appointment.washType === 'COMPLETED' || appointment.status === 'Completed' || appointment.isCompleted) ? 'Task completed' : 
                                         'Click to change wash type'}
                                >
                                  {appointment.customerStatus === 'Booked' ? '📋 BOOKED' : 
                                   appointment.originalWashType || appointment.washType}
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
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              textAlign: 'center',
              borderBottom: '1px solid #f0f0f0'
            }}
            onClick={() => handleWashTypeChange(appointment, 'EXT')}
          >
            🚗 EXT Only
          </button>
          <button
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 18px',
              border: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              textAlign: 'center',
              borderBottom: '1px solid #f0f0f0'
            }}
            onClick={() => handleWashTypeChange(appointment, 'INT')}
          >
            🧽 EXT + INT
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
