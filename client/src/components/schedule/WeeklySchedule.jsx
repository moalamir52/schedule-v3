import React, { useState } from 'react';
import CustomerViewSelector from '../clients/CustomerViewSelector';

function WeeklySchedule({ scheduleData }) {
  const [showCustomerView, setShowCustomerView] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCustomerClick = (customerId, customerName) => {
    console.log('WeeklySchedule handleCustomerClick called with:', { customerId, customerName });
    setSelectedCustomer({ id: customerId, name: customerName });
    setShowCustomerView(true);
    console.log('showCustomerView set to true');
  };

  const handleCloseCustomerView = () => {
    setShowCustomerView(false);
    setSelectedCustomer(null);
  };
  const daysOfWeek = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];
  // Function to find appointments for a specific day and time
  const getAppointmentsForDayAndTime = (day, time) => {
    const appointments = scheduleData.filter(appointment => 
      appointment.washDay === day && appointment.washTime === time
    );
    if (appointments.length > 0) {
    }
    return appointments;
  };
  return (
    <>
    <div style={{ overflowX: 'auto' }}>
      <table className="timetable">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Time</th>
            {daysOfWeek.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="time-slot">{timeSlot}</td>
              {daysOfWeek.map(day => {
                const appointments = getAppointmentsForDayAndTime(day, timeSlot);
                return (
                  <td key={`${day}-${timeSlot}`}>
                    {appointments.map((appointment, index) => {
                      const key = `${day}-${appointment.customerId || 'no-id'}-${timeSlot}-${index}`;
                      return (
                        <div 
                          key={key}
                          className={`appointment-item ${appointment.washType === 'INT' ? 'int-type' : ''}`}
                        >
                        <div 
                          className="customer-name"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Customer name clicked:', appointment.customerId, appointment.customerName);
                            handleCustomerClick(appointment.customerId, appointment.customerName);
                          }}
                          title="اضغط لعرض معلومات العميل"
                        >
                          {appointment.customerName}
                        </div>
                        <div className="villa">Villa {appointment.villa}</div>
                        <div className="car-plate">{appointment.carPlate}</div>
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {/* Customer View Selector */}
    {showCustomerView && selectedCustomer && (
      <CustomerViewSelector 
        customerId={selectedCustomer.id}
        customerName={selectedCustomer.name}
        onClose={handleCloseCustomerView}
      />
    )}
    </>
  );
}
export default WeeklySchedule;