import React, { useState } from 'react';

const WorkerScheduleView = ({ workers, assignedSchedule, onScheduleUpdate, onDeleteAppointment, onWashTypeUpdate }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [showOverrideMenu, setShowOverrideMenu] = useState(null);
  const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
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
    
    if (appointments.length > 0) {
      console.log(`[DEBUG WorkerSchedule] Worker ${workerId} - ${day} ${time}:`, appointments.map(a => `${a.customerName}(${a.customerId})`));
    }
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
    setShowOverrideMenu(showOverrideMenu === taskId ? null : taskId);
  };

  const handleWashTypeChange = async (appointment, newWashType) => {
    const taskId = `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}`;
    if (onWashTypeUpdate) {
      await onWashTypeUpdate(taskId, newWashType);
    }
    setShowOverrideMenu(null);
  };

  const handleDrop = (e, targetDay, targetTime, targetWorkerId) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const { customerId, day: sourceDay, time: sourceTime, workerId: sourceWorkerId } = draggedItem;
    
    if (sourceDay === targetDay && sourceTime === targetTime && sourceWorkerId === targetWorkerId) {
      setDraggedItem(null);
      return;
    }

    // Check if target worker already has appointments at this time
    const existingAppointments = assignedSchedule.filter(appointment => 
      appointment.workerId === targetWorkerId && 
      appointment.day === targetDay && 
      appointment.time === targetTime
    );

    let updatedSchedule;

    if (existingAppointments.length > 0) {
      // Swap appointments between workers
      updatedSchedule = assignedSchedule.map(appointment => {
        // Move dragged customer to target worker
        if (appointment.customerId === customerId && 
            appointment.day === sourceDay && 
            appointment.time === sourceTime && 
            appointment.workerId === sourceWorkerId) {
          return {
            ...appointment,
            day: targetDay,
            time: targetTime,
            workerId: targetWorkerId,
            workerName: workers.find(w => (w.WorkerID || w.Name) === targetWorkerId)?.Name || targetWorkerId
          };
        }
        // Move existing appointments to source worker
        if (appointment.workerId === targetWorkerId && 
            appointment.day === targetDay && 
            appointment.time === targetTime) {
          return {
            ...appointment,
            day: sourceDay,
            time: sourceTime,
            workerId: sourceWorkerId,
            workerName: workers.find(w => (w.WorkerID || w.Name) === sourceWorkerId)?.Name || sourceWorkerId
          };
        }
        return appointment;
      });
    } else {
      // Simple move to empty slot
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
            workerName: workers.find(w => (w.WorkerID || w.Name) === targetWorkerId)?.Name || targetWorkerId
          };
        }
        return appointment;
      });
    }

    if (onScheduleUpdate) {
      onScheduleUpdate(updatedSchedule);
    }
    setDraggedItem(null);
  };

  return (
    <table className="timetable">
      <thead>
        <tr>
          <th rowSpan="2">Time</th>
          {days.map(day => (
            <th key={day} colSpan={workers.length}>{day}</th>
          ))}
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
                              >
                                <div className="customer-name">
                                  {appointment.customerName}
                                  {appointment.packageType && appointment.packageType.toLowerCase().includes('bi week') && (
                                    <span className="bi-week-badge">BI</span>
                                  )}
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
                                <div className="villa">Villa {appointment.villa}</div>
                                <div className="car-plate">{appointment.carPlate}</div>
                                <div 
                                  className="wash-type"
                                  onClick={(e) => handleOverrideClick(e, appointment)}
                                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                  title="Click to change wash type"
                                >
                                  {appointment.washType}
                                </div>
                                
                                {/* Override Menu */}
                                {showOverrideMenu === `${appointment.customerId}-${appointment.day}-${appointment.time}-${appointment.carPlate}` && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',
                                    backgroundColor: 'white',
                                    border: '2px solid #28a745',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 1000,
                                    minWidth: '120px'
                                  }}>
                                    <div style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                                      Change to:
                                    </div>
                                    <button
                                      onClick={() => handleWashTypeChange(appointment, 'EXT')}
                                      disabled={appointment.washType === 'EXT'}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: 'none',
                                        backgroundColor: appointment.washType === 'EXT' ? '#f8f9fa' : 'white',
                                        color: appointment.washType === 'EXT' ? '#6c757d' : '#28a745',
                                        cursor: appointment.washType === 'EXT' ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        textAlign: 'left'
                                      }}
                                    >
                                      🚗 EXT Only
                                    </button>
                                    <button
                                      onClick={() => handleWashTypeChange(appointment, 'INT')}
                                      disabled={appointment.washType === 'INT'}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: 'none',
                                        backgroundColor: appointment.washType === 'INT' ? '#f8f9fa' : 'white',
                                        color: appointment.washType === 'INT' ? '#6c757d' : '#dc3545',
                                        cursor: appointment.washType === 'INT' ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        borderTop: '1px solid #eee'
                                      }}
                                    >
                                      🧽 EXT + INT
                                    </button>
                                    <button
                                      onClick={() => setShowOverrideMenu(null)}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: 'none',
                                        backgroundColor: '#f8f9fa',
                                        color: '#6c757d',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        borderTop: '1px solid #eee'
                                      }}
                                    >
                                      ❌ Cancel
                                    </button>
                                  </div>
                                )}
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
  );
};

export default WorkerScheduleView;