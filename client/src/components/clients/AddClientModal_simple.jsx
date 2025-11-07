import { useState } from 'react';

function AddClientModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    CustomerID: '',
    Name: '',
    Villa: '',
    Phone: '',
    'Number of car': 1,
    CarPlates: '',
    Days: 'Saturday',
    Time: '9:00 AM',
    Notes: '',
    Washman_Package: '',
    Fee: '',
    'start date': '',
    payment: '',
    Status: 'Active',
    Serves: ''
  });
  
  const [cars, setCars] = useState([{ 
    plate: '', 
    appointments: [{ day: 'Saturday', time: '9:00 AM' }] 
  }]);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Convert cars to format: CarA:Sat@9:00AM+Mon@2:00PM | CarB:Tue@10:00AM
      const timeData = cars.map(car => {
        const appointments = car.appointments.map(apt => 
          `${apt.day.substring(0,3)}@${apt.time}`
        ).join('+');
        return `${car.plate}:${appointments}`;
      }).join(' | ');
      
      const processedData = {
        ...formData,
        'Number of car': cars.length,
        CarPlates: cars.map(car => car.plate).join(', '),
        Time: timeData
      };
      
      await onAdd(processedData);
      
      // Reset form
      setFormData({
        CustomerID: '',
        Name: '',
        Villa: '',
        Phone: '',
        'Number of car': 1,
        CarPlates: '',
        Days: 'Saturday',
        Time: '9:00 AM',
        Notes: '',
        Washman_Package: '',
        Fee: '',
        'start date': '',
        payment: '',
        Status: 'Active',
        Serves: ''
      });
      setCars([{ 
        plate: '', 
        appointments: [{ day: 'Saturday', time: '9:00 AM' }] 
      }]);
      
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error adding client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          width: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '20px', color: '#548235' }}>Add New Client</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Customer ID:</label>
              <input
                type="text"
                name="CustomerID"
                value={formData.CustomerID}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label>Name:</label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label>Villa:</label>
              <input
                type="text"
                name="Villa"
                value={formData.Villa}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label>Phone:</label>
              <input
                type="text"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>🚗 Cars & Appointments:</label>
              {cars.map((car, carIndex) => (
                <div key={carIndex} style={{
                  border: '2px solid #28a745',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '15px',
                  backgroundColor: '#f8fff8'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '60px', color: '#28a745', fontSize: '16px' }}>🚗 Car {carIndex + 1}:</span>
                    {cars.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCars(cars.filter((_, i) => i !== carIndex))}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ❌ Remove Car
                      </button>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#666' }}>Car Plate Number:</label>
                    <input
                      type="text"
                      placeholder="Enter car plate number"
                      value={car.plate}
                      onChange={(e) => {
                        const newCars = [...cars];
                        newCars[carIndex].plate = e.target.value;
                        setCars(newCars);
                      }}
                      required
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div style={{
                    backgroundColor: '#e8f4fd',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #bee5eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ fontWeight: 'bold', color: '#0c5460' }}>📅 Appointments for this car:</label>
                      <button
                        type="button"
                        onClick={() => {
                          const newCars = [...cars];
                          newCars[carIndex].appointments.push({ day: 'Saturday', time: '9:00 AM' });
                          setCars(newCars);
                        }}
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ➕ Add Appointment
                      </button>
                    </div>
                    
                    {car.appointments.map((appointment, aptIndex) => (
                      <div key={aptIndex} style={{
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        padding: '10px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: '1px solid #d1ecf1'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0c5460' }}>Appointment {aptIndex + 1}:</span>
                          {car.appointments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newCars = [...cars];
                                newCars[carIndex].appointments = newCars[carIndex].appointments.filter((_, i) => i !== aptIndex);
                                setCars(newCars);
                              }}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              ❌
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <select
                            value={appointment.day}
                            onChange={(e) => {
                              const newCars = [...cars];
                              newCars[carIndex].appointments[aptIndex].day = e.target.value;
                              setCars(newCars);
                            }}
                            style={{
                              padding: '6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <option value="Saturday">📅 Saturday</option>
                            <option value="Monday">📅 Monday</option>
                            <option value="Tuesday">📅 Tuesday</option>
                            <option value="Wednesday">📅 Wednesday</option>
                            <option value="Thursday">📅 Thursday</option>
                            <option value="Friday">📅 Friday</option>
                          </select>
                          <select
                            value={appointment.time}
                            onChange={(e) => {
                              const newCars = [...cars];
                              newCars[carIndex].appointments[aptIndex].time = e.target.value;
                              setCars(newCars);
                            }}
                            style={{
                              padding: '6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <option value="6:00 AM">⏰ 6:00 AM</option>
                            <option value="7:00 AM">⏰ 7:00 AM</option>
                            <option value="8:00 AM">⏰ 8:00 AM</option>
                            <option value="9:00 AM">⏰ 9:00 AM</option>
                            <option value="10:00 AM">⏰ 10:00 AM</option>
                            <option value="11:00 AM">⏰ 11:00 AM</option>
                            <option value="12:00 PM">⏰ 12:00 PM</option>
                            <option value="1:00 PM">⏰ 1:00 PM</option>
                            <option value="2:00 PM">⏰ 2:00 PM</option>
                            <option value="3:00 PM">⏰ 3:00 PM</option>
                            <option value="4:00 PM">⏰ 4:00 PM</option>
                            <option value="5:00 PM">⏰ 5:00 PM</option>
                            <option value="6:00 PM">⏰ 6:00 PM</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCars([...cars, { 
                    plate: '', 
                    appointments: [{ day: 'Saturday', time: '9:00 AM' }] 
                  }]);
                }}
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                }}
              >
                🚗➕ Add Another Car
              </button>
            </div>
            
            <div>
              <label>Package:</label>
              <select
                name="Washman_Package"
                value={formData.Washman_Package}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Package</option>
                <option value="2 Ext">2 Ext</option>
                <option value="2 Ext 1 INT week">2 Ext 1 INT week</option>
                <option value="3 Ext 1 INT week">3 Ext 1 INT week</option>
                <option value="2 Ext 1 INT bi week">2 Ext 1 INT bi week</option>
                <option value="3 Ext 1 INT bi week">3 Ext 1 INT bi week</option>
              </select>
            </div>
            
            <div>
              <label>Fee:</label>
              <input
                type="text"
                name="Fee"
                value={formData.Fee}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label>Start Date:</label>
              <input
                type="date"
                name="start date"
                value={formData['start date']}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label>Status:</label>
              <select
                name="Status"
                value={formData.Status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
            <label>Notes:</label>
            <textarea
              name="Notes"
              value={formData.Notes}
              onChange={handleChange}
              rows="3"
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', gridColumn: '1 / -1' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Adding...' : 'Add Client'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClientModal;