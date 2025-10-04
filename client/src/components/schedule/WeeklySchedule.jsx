function WeeklySchedule({ scheduleData }) {
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
      console.log(`[DEBUG WeeklySchedule] ${day} ${time}:`, appointments.map(a => `${a.customerName}(${a.customerId})`));
    }
    return appointments;
  };

  return (
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
                      console.log(`[DEBUG WeeklySchedule] Key: ${key}`);
                      return (
                        <div 
                          key={key}
                          className={`appointment-item ${appointment.washType === 'INT' ? 'int-type' : ''}`}
                        >
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
  );
}

export default WeeklySchedule;