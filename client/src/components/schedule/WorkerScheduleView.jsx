import React, { useState } from 'react';
import Modal from '../Modal';

const WorkerScheduleView = ({ workers, assignedSchedule, onScheduleUpdate, onDeleteAppointment, onWashTypeUpdate, onCustomerFilter, customerFilter, currentWeekOffset = 0 }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [showOverrideMenu, setShowOverrideMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
  const [customerInfo, setCustomerInfo] = useState({ isOpen: false, data: null, appointments: [] });
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];
  
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
  
  if (!workers || workers.length === 0 || !assignedSchedule || assignedSchedule.length === 0) {
    return <div className="text-center">Press 'Auto' to generate the schedule.</div>;
  }

  const getAppointmentsForWorkerDayTime = (workerId, day, time) => {
    const appointments = assignedSchedule.filter(appointment => 
      appointment.workerId === workerId && 
      appointment.day === day && 
      appointment.time === time
    );
    

    return appointments;
  };

  const handleDragStart = (e, customerId, day, time, workerId) => {
    const dragData = { customerId, day, time, workerId };
    setDraggedItem(dragData);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

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

  const handleWashTypeChange = async (appointment, newWashType) => {
    try {
      const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/update-task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          taskId, 
          newWorkerName: appointment.workerName,
          newWashType
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wash type');
      }
      
      // Update local state
      if (onScheduleUpdate) {
        const updatedSchedule = assignedSchedule.map(task => 
          `${task.customerId}-${task.day}-${task.time}-${task.carPlate}` === taskId
            ? { ...task, washType: newWashType, isLocked: 'TRUE' }
            : task
        );
        onScheduleUpdate(updatedSchedule);
      }
      
    } catch (error) {
      alert(`Error updating wash type: ${error.message}`);
    }
    
    setShowOverrideMenu(null);
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

  const handleCancelBooking = (appointment) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel this booking?\n\nCustomer: ${appointment.customerName}\nVilla: ${appointment.villa}\nTime: ${appointment.day} ${appointment.time}\nCar: ${appointment.carPlate}`,
      onConfirm: () => confirmCancelBooking(appointment)
    });
  };

  const confirmCancelBooking = async (appointment) => {
    setModal({ isOpen: false });
    
    try {
      const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/cancel-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      // Remove the booking from local state
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
        message: 'Booking cancelled successfully!'
      });
      
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Error cancelling booking: ${error.message}`
      });
    }
  };

  const handleDrop = async (e, targetDay, targetTime, targetWorkerId) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const { customerId, day: sourceDay, time: sourceTime, workerId: sourceWorkerId } = draggedItem;
    
    if (sourceDay === targetDay && sourceTime === targetTime && sourceWorkerId === targetWorkerId) {
      setDraggedItem(null);
      return;
    }
    
    // If dragging to same day/time but different worker, it's a simple worker change
    if (sourceDay === targetDay && sourceTime === targetTime && sourceWorkerId !== targetWorkerId) {
      // This is just a worker change, not a slot swap
    }

    // Find the dragged appointment
    const draggedAppointment = assignedSchedule.find(appointment => 
      appointment.customerId === customerId && 
      appointment.day === sourceDay && 
      appointment.time === sourceTime && 
      appointment.workerId === sourceWorkerId
    );

    if (!draggedAppointment) {
      setDraggedItem(null);
      return;
    }

    // Check if target slot has existing appointments (for swapping)
    const existingAppointments = assignedSchedule.filter(appointment => 
      appointment.workerId === targetWorkerId && 
      appointment.day === targetDay && 
      appointment.time === targetTime
    );

    try {
      const taskId = `${customerId}-${sourceDay}-${sourceTime}-${draggedAppointment.carPlate}`;
      const targetWorkerName = workers.find(w => (w.WorkerID || w.Name) === targetWorkerId)?.Name || targetWorkerId;
      
      let requestBody = { 
        taskId, 
        newWorkerName: targetWorkerName,
        sourceDay,
        sourceTime,
        targetDay,
        targetTime
      };
      
      // If there are existing appointments, we're doing a slot swap
      if (existingAppointments.length > 0) {
        requestBody.isSlotSwap = true;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/update-task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task assignment');
      }
      
      // Update local state based on whether it's a swap or simple move
      let updatedSchedule;
      
      if (existingAppointments.length > 0) {
        // Handle swap
        updatedSchedule = assignedSchedule.map(appointment => {
          // Move dragged appointment to target
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
            const sourceWorkerName = workers.find(w => (w.WorkerID || w.Name) === sourceWorkerId)?.Name || sourceWorkerId;
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
        // Handle simple move
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
      
    } catch (error) {
      alert(`Error updating assignment: ${error.message}`);
    }
    
    setDraggedItem(null);
  };

  return (
    <>
    <table className="timetable">
      <thead>
        <tr>
          <th rowSpan="2">Time</th>
          {days.map(day => {
            // Calculate actual date for this day based on weekOffset (Saturday = start of work week)
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
            mondayOfWeek.setDate(mondayOfWeek.getDate() + (currentWeekOffset * 7));
            
            const dayOffsets = {
              'Monday': 0,
              'Tuesday': 1,
              'Wednesday': 2, 
              'Thursday': 3,
              'Friday': 4,
              'Saturday': 5
            };
            const targetDate = new Date(mondayOfWeek);
            targetDate.setDate(mondayOfWeek.getDate() + dayOffsets[day]);
            
            const displayDate = targetDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit'
            });
            
            return (
              <th key={day} colSpan={workers.length}>
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
            workers.map((worker, workerIndex) => (
              <th 
                key={`${day}-${worker.WorkerID || worker.Name}`} 
                className={workerIndex === workers.length - 1 ? 'day-separator' : ''}
                style={{ fontSize: '11px' }}
              >
                {worker.Name}
              </th>
            ))
          )}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map(time => (
          <tr key={time}>
            <td className="time-slot">{time}</td>
            {days.map((day, dayIndex) => 
              workers.map((worker, workerIndex) => (
                <td 
                  key={`${day}-${worker.WorkerID || worker.Name}-${time}`} 
                  className={`${workerIndex === workers.length - 1 ? 'day-separator' : ''} drop-zone`}
                  style={{ padding: '4px', width: '120px' }}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, day, time, worker.WorkerID || worker.Name)}
                >
                  {(() => {
                    const appointments = getAppointmentsForWorkerDayTime(worker.WorkerID || worker.Name, day, time);
                    const groupedByCustomer = appointments.reduce((groups, appointment) => {
                      const customerId = appointment.customerId;
                      if (!groups[customerId]) {
                        groups[customerId] = [];
                      }
                      groups[customerId].push(appointment);
                      return groups;
                    }, {});
                    
                    return Object.entries(groupedByCustomer).map(([customerId, customerAppointments]) => {
                      const groupKey = `${worker.WorkerID || worker.Name}-${day}-${time}-${customerId}`;
                      return (
                        <div 
                          key={groupKey} 
                          className="customer-group" 
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, customerId, day, time, worker.WorkerID || worker.Name)}
                          onDragOver={(e) => handleDragOver(e)}
                          onDrop={(e) => handleDrop(e, day, time, worker.WorkerID || worker.Name)}
                        >
                          {customerAppointments.map((appointment, index) => {
                            const key = `${groupKey}-${index}`;
                            return (
                              <div 
                                key={key}
                                className={`appointment-item ${appointment.washType === 'INT' ? 'int-type' : ''}`}
                                style={{ position: 'relative' }}
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
                                  className={`customer-name ${appointment.packageType && appointment.packageType.toLowerCase().includes('bi week') ? 'bi-week-badge' : ''}`}
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
                                  onClick={(e) => handleOverrideClick(e, appointment)}
                                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                  title="Click to change wash type"
                                >
                                  {appointment.washType}
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
            onClick={() => handleCancelBooking(appointment)}
          >
            🗑️ Cancel Booking
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
      <div className="customer-info-modal" onClick={() => setCustomerInfo({ isOpen: false, data: null, appointments: [] })}>
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
    </>
  );
};

export default WorkerScheduleView;