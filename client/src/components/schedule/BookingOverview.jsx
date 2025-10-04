function BookingOverview({ overviewData }) {
  if (!overviewData || Object.keys(overviewData).length === 0) {
    return <div>No overview data available.</div>;
  }

  const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const getSlotClass = (status) => {
    if (status === 'Full') return 'slot-full';
    if (status === 'Available') return 'slot-available';
    return 'slot-partial';
  };

  return (
    <div>
      <table className="timetable">
        <thead>
          <tr>
            <th>Time</th>
            {days.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time}>
              <td className="time-slot">{time}</td>
              {days.map(day => {
                const slotData = overviewData[day]?.[time];
                const status = slotData?.status || 'Available';
                return (
                  <td 
                    key={`${day}-${time}`}
                    className={getSlotClass(status)}
                  >
                    {status}
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

export default BookingOverview;