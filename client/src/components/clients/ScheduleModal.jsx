import { useState, useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

function CarCard({ car, isDragging, onDragStart, onDragEnd }) {
  const handleDragStart = (e) => {
    console.log('🚗 CarCard DragStart:', car);
    console.log('📎 Setting drag data:', car);
    e.dataTransfer.setData('text/plain', car);
    if (onDragStart) {
      onDragStart(e, car);
    }
  };

  const handleDragEnd = (e) => {
    console.log('🏁 CarCard DragEnd:', car);
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        margin: '4px',
        backgroundColor: isDragging ? '#e3f2fd' : '#f8f9fa',
        border: '2px solid #ddd',
        borderRadius: '8px',
        cursor: 'grab',
        minWidth: '80px',
        transition: 'all 0.2s',
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <div style={{ fontSize: '20px', marginBottom: '2px' }}>🚗</div>
      <div style={{ 
        fontSize: '9px', 
        fontWeight: 'bold', 
        textAlign: 'center',
        wordBreak: 'break-all',
        lineHeight: '1.1'
      }}>
        {car || 'Unknown'}
      </div>
    </div>
  );
}

function DropZone({ day, time, cars, onDrop, onRemoveCar }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const carData = e.dataTransfer.getData('text/plain');
    console.log('🎯 DropZone received car:', carData);
    onDrop(day, time, carData);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: '60px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '4px',
        backgroundColor: isDragOver ? '#e8f5e8' : cars.length > 0 ? '#fff3e0' : 'white',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {cars.map((car, index) => (
        <div key={index} style={{ position: 'relative' }}>
          <CarCard car={car} />
          <button
            onClick={() => onRemoveCar(day, time, car)}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#dc3545',
              color: 'white',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      ))}
      {cars.length === 0 && (
        <div style={{ color: '#999', fontSize: '10px', textAlign: 'center' }}>
          Drop cars here
        </div>
      )}
    </div>
  );
}

function ScheduleModal({ isOpen, onClose, client, onSave }) {
  const [schedule, setSchedule] = useState({});
  const [draggedCar, setDraggedCar] = useState(null);
  const [availableCars, setAvailableCars] = useState([]);

  useEffect(() => {
    if (client && isOpen) {
      // Parse car plates
      const cars = client.CarPlates ? 
        client.CarPlates.split(',').map(car => car.trim()).filter(car => car) : 
        ['Car 1', 'Car 2']; // Default cars if no plates
      
      setAvailableCars(cars);
      
      // Parse existing schedule from Notes field
      const existingSchedule = {};
      // Initialize empty schedule
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(time => {
          existingSchedule[`${day}-${time}`] = [];
        });
      });
      
      // Parse existing schedules from both Notes and Time fields
      const parseScheduleData = (scheduleText, source) => {
        if (!scheduleText) return;
        
        const scheduleEntries = scheduleText.split(',').map(entry => entry.trim());
        scheduleEntries.forEach(entry => {
          // Parse format: "Mon@8:00 AM CarName" or "8:00 AM CarName"
          if (entry.includes('@')) {
            const parts = entry.split('@');
            if (parts.length >= 2) {
              const dayAbbr = parts[0].trim();
              const timeAndCar = parts[1].trim();
              
              // Split time and car name
              const timeParts = timeAndCar.split(' ');
              if (timeParts.length >= 2) {
                const time = `${timeParts[0]} ${timeParts[1]}`; // "8:00 AM"
                const carName = timeParts.length > 2 ? timeParts.slice(2).join(' ') : cars[0]; // Car name or first car
                
                const dayMap = {
                  'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
                  'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday'
                };
                const fullDay = dayMap[dayAbbr];
                if (fullDay && TIME_SLOTS.includes(time)) {
                  const key = `${fullDay}-${time}`;
                  if (existingSchedule[key] && !existingSchedule[key].includes(carName)) {
                    existingSchedule[key].push(carName);
                  }
                }
              }
            }
          } else {
            // Handle car-specific format: "8:00 AM CarName"
            const timeMatch = entry.match(/(\d{1,2}:\d{2}\s*[AP]M)\s+(.+)/i);
            if (timeMatch) {
              const time = timeMatch[1];
              const carName = timeMatch[2].trim();
              
              // If no specific day, use Saturday as default
              const defaultDay = 'Saturday';
              if (TIME_SLOTS.includes(time)) {
                const key = `${defaultDay}-${time}`;
                if (existingSchedule[key] && !existingSchedule[key].includes(carName)) {
                  existingSchedule[key].push(carName);
                }
              }
            }
          }
        });
      };
      
      // Parse Notes first (higher priority)
      parseScheduleData(client.Notes, 'Notes');
      // Parse Time field
      parseScheduleData(client.Time, 'Time');
      
      setSchedule(existingSchedule);
    }
  }, [client, isOpen]);

  const handleDragStart = (e, car) => {
    console.log('🚀 Drag Start:', car);
    e.dataTransfer.setData('text/plain', car);
    setDraggedCar(car);
  };

  const handleDragEnd = () => {
    console.log('🏁 Drag End');
    setDraggedCar(null);
  };

  const handleDrop = (day, time, car) => {
    console.log('📍 Drop:', { day, time, car });
    const key = `${day}-${time}`;
    setSchedule(prev => {
      console.log('📋 Current Schedule:', prev);
      const newSchedule = { ...prev };
      
      // Remove car from all other slots first
      Object.keys(newSchedule).forEach(slotKey => {
        const beforeFilter = newSchedule[slotKey].length;
        newSchedule[slotKey] = newSchedule[slotKey].filter(c => c !== car);
        const afterFilter = newSchedule[slotKey].length;
        if (beforeFilter !== afterFilter) {
          console.log(`🗑️ Removed ${car} from ${slotKey}`);
        }
      });
      
      // Add car to new slot
      if (!newSchedule[key]) newSchedule[key] = [];
      if (!newSchedule[key].includes(car)) {
        newSchedule[key] = [...newSchedule[key], car];
        console.log(`✅ Added ${car} to ${key}`);
      }
      
      console.log('📋 New Schedule:', newSchedule);
      return newSchedule;
    });
  };

  const handleRemoveCar = (day, time, car) => {
    console.log('🗑️ Remove Car:', { day, time, car });
    const key = `${day}-${time}`;
    setSchedule(prev => {
      const newSchedule = {
        ...prev,
        [key]: (prev[key] || []).filter(c => c !== car)
      };
      console.log('📋 After Remove:', newSchedule);
      return newSchedule;
    });
  };

  const handleSave = () => {
    // Convert schedule to Day@Time format with car names
    const daySchedules = [];
    const dayTimeMap = {};
    
    Object.entries(schedule).forEach(([key, cars]) => {
      if (cars.length > 0) {
        const [day, time] = key.split('-');
        const dayAbbr = day.substring(0, 3);
        
        cars.forEach(car => {
          daySchedules.push(`${dayAbbr}@${time} ${car}`);
        });
        
        if (!dayTimeMap[dayAbbr]) {
          dayTimeMap[dayAbbr] = [];
        }
        if (!dayTimeMap[dayAbbr].includes(time)) {
          dayTimeMap[dayAbbr].push(time);
        }
      }
    });

    const days = Object.keys(dayTimeMap).join(', ');
    const time = daySchedules.join(', ');

    onSave({
      Days: days,
      Time: time, // Visual Scheduler writes to Time field
      Notes: '' // Keep Notes empty for manual editing (has priority)
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#548235', margin: 0 }}>
            Schedule Cars - {client?.Name}
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999'
          }}>×</button>
        </div>

        {/* Available Cars */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>Available Cars:</h4>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              💡 Example: Car1 at 1PM Sat, Car2 at 2PM Sat, Both at 1PM Wed
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {availableCars.filter(car => {
              // Only show cars that are not scheduled anywhere
              return !Object.values(schedule).some(cars => cars.includes(car));
            }).map(car => (
              <CarCard
                key={car}
                car={car}
                isDragging={draggedCar === car}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
                  Time
                </th>
                {DAYS.map(day => (
                  <th key={day} style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    backgroundColor: '#f8f9fa',
                    minWidth: '120px'
                  }}>
                    {day.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time}>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {time}
                  </td>
                  {DAYS.map(day => (
                    <td key={`${day}-${time}`} style={{ 
                      padding: '4px', 
                      border: '1px solid #ddd' 
                    }}>
                      <DropZone
                        day={day}
                        time={time}
                        cars={schedule[`${day}-${time}`] || []}
                        onDrop={handleDrop}
                        onRemoveCar={handleRemoveCar}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleModal;