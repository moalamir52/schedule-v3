import { useState, useEffect } from 'react';

function BookingOverviewPage() {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/schedule/overview');
        if (!response.ok) throw new Error('Failed to fetch overview data');
        const data = await response.json();
        setOverviewData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'Full') return '#dc3545';
    if (status === 'Available') return '#28a745';
    return '#fd7e14';
  };

  if (loading) return <div>Loading schedule overview...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#1e7e34', marginBottom: '30px', textAlign: 'center' }}>
        Booking Overview
      </h1>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '15px',
                backgroundColor: '#1e7e34',
                color: 'white',
                border: '1px solid #ddd',
                fontWeight: 'bold'
              }}>
                Time
              </th>
              {days.map(day => (
                <th key={day} style={{
                  padding: '15px',
                  backgroundColor: '#1e7e34',
                  color: 'white',
                  border: '1px solid #ddd',
                  fontWeight: 'bold'
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <td style={{
                  padding: '12px 15px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {time}
                </td>
                {days.map(day => {
                  const cellData = overviewData?.[day]?.[time];
                  const status = cellData?.status || 'Available';
                  return (
                    <td key={`${day}-${time}`} style={{
                      padding: '12px 15px',
                      border: '1px solid #ddd',
                      backgroundColor: getStatusColor(status),
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {status}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BookingOverviewPage;