import { useState, useEffect } from 'react';

function AddClientModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    CustomerID: '',
    Name: '',
    Villa: '',
    Phone: '',
    'Number of car': 1,
    CarPlates: '',
    Days: '',
    Time: '',
    Notes: '',
    Washman_Package: '',
    Fee: '',
    'start date': '',
    payment: '',
    Status: 'Active',
    Serves: ''
  });
  
  const [scheduleType, setScheduleType] = useState('same'); // 'same' or 'different'
  const [cars, setCars] = useState([{ 
    plate: '', 
    washType: 'EXT', 
    appointments: [{ day: 'Saturday', time: '9:00 AM' }] 
  }]);
  const [sharedAppointment, setSharedAppointment] = useState({ day: 'Saturday', time: '9:00 AM' });
  
  // Package limits
  const getPackageLimit = (packageName) => {
    if (!packageName) return 0;
    const pkg = packageName.toLowerCase();
    if (pkg.includes('2 ext 1 int')) return 2;
    if (pkg.includes('3 ext 1 int')) return 3;
    if (pkg.includes('2 ext')) return 2;
    return 0;
  };
  const [additionalServices, setAdditionalServices] = useState([]);
  const [loading, setLoading] = useState(false);
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare client data
      const clientData = {
        ...formData,
        'Number of car': cars.length,
        CarPlates: cars.map(car => car.plate).join(', '),
        Days: cars.map(car => car.appointments.map(apt => apt.day).join('+')).join('-'),
        Time: cars.map(car => car.appointments.map(apt => apt.time).join('+')).join(' & '),
        cars: cars,
        additionalServices: additionalServices
      };
      
      await onAdd(clientData);
      
      // Reset form
      setFormData({
        CustomerID: '',
        Name: '',
        Villa: '',
        Phone: '',
        'Number of car': 1,
        CarPlates: '',
        Days: '',
        Time: '',
        Notes: '',
        Washman_Package: '',
        Fee: '',
        'start date': '',
        payment: '',
        Status: 'Active',
        Serves: ''
      });
      setScheduleType('same');
      setSharedAppointment({ day: 'Saturday', time: '9:00 AM' });
      setCars([{ 
        plate: '', 
        washType: 'EXT', 
        appointments: [{ day: 'Saturday', time: '9:00 AM' }] 
      }]);
      setAdditionalServices([]);
      
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
        
        {/* Schedule Type Selection */}
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '25px',
          border: '2px solid #28a745'
        }}>
          <h3 style={{ color: '#28a745', marginBottom: '15px', textAlign: 'center' }}>📅 Appointment Schedule Type</h3>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 15px',
              borderRadius: '8px',
              backgroundColor: scheduleType === 'same' ? '#28a745' : 'white',
              color: scheduleType === 'same' ? 'white' : '#28a745',
              border: '2px solid #28a745',
              fontWeight: 'bold'
            }}>
              <input
                type="radio"
                name="scheduleType"
                value="same"
                checked={scheduleType === 'same'}
                onChange={(e) => {
                  setScheduleType(e.target.value);
                  // Reset cars to use shared appointment
                  setCars(cars.map(car => ({
                    ...car,
                    appointments: [{ ...sharedAppointment }]
                  })));
                }}
                style={{ margin: 0 }}
              />
              🕐 All cars same time
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 15px',
              borderRadius: '8px',
              backgroundColor: scheduleType === 'different' ? '#007bff' : 'white',
              color: scheduleType === 'different' ? 'white' : '#007bff',
              border: '2px solid #007bff',
              fontWeight: 'bold'
            }}>
              <input
                type="radio"
                name="scheduleType"
                value="different"
                checked={scheduleType === 'different'}
                onChange={(e) => setScheduleType(e.target.value)}
                style={{ margin: 0 }}
              />
              🕐🕑 Each car different time
            </label>
          </div>
        </div>
        
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
              />
            </div>
            
            <div>
              <label>Villa:</label>
              <input
                type="text"
                name="Villa"
                value={formData.Villa}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label>Phone:</label>
              <input
                type="text"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
              />
            </div>
            
            {/* Shared Appointment (when all cars same time) */}
            {scheduleType === 'same' && (
              <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '2px solid #ffc107'
                }}>
                  <h4 style={{ color: '#856404', marginBottom: '15px', textAlign: 'center' }}>📅 Shared Appointment for All Cars</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Day:</label>
                      <select
                        value={sharedAppointment.day}
                        onChange={(e) => {
                          const newSharedApt = { ...sharedAppointment, day: e.target.value };
                          setSharedAppointment(newSharedApt);
                          // Update all cars
                          setCars(cars.map(car => ({
                            ...car,
                            appointments: [{ ...newSharedApt }]
                          })));
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="Saturday">🗓️ Saturday</option>
                        <option value="Monday">🗓️ Monday</option>
                        <option value="Tuesday">🗓️ Tuesday</option>
                        <option value="Wednesday">🗓️ Wednesday</option>
                        <option value="Thursday">🗓️ Thursday</option>
                        <option value="Friday">🗓️ Friday</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time:</label>
                      <select
                        value={sharedAppointment.time}
                        onChange={(e) => {
                          const newSharedApt = { ...sharedAppointment, time: e.target.value };
                          setSharedAppointment(newSharedApt);
                          // Update all cars
                          setCars(cars.map(car => ({
                            ...car,
                            appointments: [{ ...newSharedApt }]
                          })));
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
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
                </div>
              </div>
            )}
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                🚗 Cars {scheduleType === 'same' ? '(All same appointment)' : '& Individual Appointments'}:
              </label>
              {cars.map((car, index) => (
                <div key={index} style={{ 
                  border: '2px solid #28a745', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  marginBottom: '15px',
                  backgroundColor: '#f8fff8'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '60px', color: '#28a745', fontSize: '16px' }}>🚗 Car {index + 1}:</span>
                    {cars.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCars(cars.filter((_, i) => i !== index))}
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
                  
                  {/* Car Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#666' }}>Car Plate Number:</label>
                      <input
                        type="text"
                        placeholder="Enter car plate number"
                        value={car.plate}
                        onChange={(e) => {
                          const newCars = [...cars];
                          newCars[index].plate = e.target.value;
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
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#666' }}>Wash Type:</label>
                      <select
                        value={car.washType}
                        onChange={(e) => {
                          const newCars = [...cars];
                          newCars[index].washType = e.target.value;
                          setCars(newCars);
                        }}
                        style={{ 
                          padding: '10px', 
                          border: '1px solid #ddd', 
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '14px'
                        }}
                      >
                        <option value="EXT">🧽 EXT Only</option>
                        <option value="INT">🧽🧼 EXT + INT</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Appointments for this car */}
                  {scheduleType === 'same' ? (
                    /* Show shared appointment (read-only) */
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '6px',
                      border: '1px solid #dee2e6',
                      textAlign: 'center'
                    }}>
                      <span style={{ color: '#6c757d', fontSize: '14px' }}>
                        📅 Shared: {sharedAppointment.day} at {sharedAppointment.time}
                      </span>
                    </div>
                  ) : (
                    /* Show individual appointments */
                    <div style={{ 
                      backgroundColor: '#e8f4fd', 
                      padding: '15px', 
                      borderRadius: '8px',
                      border: '1px solid #bee5eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ fontWeight: 'bold', color: '#0c5460' }}>📅 Individual Schedule:</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newCars = [...cars];
                            newCars[index].appointments.push({ day: 'Saturday', time: '9:00 AM' });
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
                                  newCars[index].appointments = newCars[index].appointments.filter((_, i) => i !== aptIndex);
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
                                newCars[index].appointments[aptIndex].day = e.target.value;
                                setCars(newCars);
                              }}
                              style={{ 
                                padding: '6px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              <option value="Saturday">🗓️ Saturday</option>
                              <option value="Monday">🗓️ Monday</option>
                              <option value="Tuesday">🗓️ Tuesday</option>
                              <option value="Wednesday">🗓️ Wednesday</option>
                              <option value="Thursday">🗓️ Thursday</option>
                              <option value="Friday">🗓️ Friday</option>
                            </select>
                            <select
                              value={appointment.time}
                              onChange={(e) => {
                                const newCars = [...cars];
                                newCars[index].appointments[aptIndex].time = e.target.value;
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
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newCar = { 
                    plate: '', 
                    washType: 'EXT', 
                    appointments: scheduleType === 'same' 
                      ? [{ ...sharedAppointment }] 
                      : [{ day: 'Saturday', time: '9:00 AM' }]
                  };
                  setCars([...cars, newCar]);
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
              >
                <option value="">Select Package</option>
                <option value="2 Ext ">2 Ext</option>
                <option value="2 Ext 1 INT week">2 Ext 1 INT week</option>
                <option value="3 Ext 1 INT week">3 Ext 1 INT week</option>
                <option value="2 Ext 1 INT bi week">2 Ext 1 INT bi week</option>
                <option value="3 Ext 1 INT bi week">3 Ext 1 INT bi week</option>
                <option value="3 Ext 1 INT bi week ">3 Ext 1 INT bi week</option>
              </select>
            </div>
            
            <div>
              <label>Fees:</label>
              <input
                type="text"
                name="Fee"
                value={formData.Fee}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label>Start Date:</label>
              <input
                type="date"
                name="start date"
                value={formData['start date']}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label>Status:</label>
              <select
                name="Status"
                value={formData.Status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>🛠️ Additional Services:</label>
            {additionalServices.map((service, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '10px',
                backgroundColor: '#fff8dc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '80px' }}>Service {index + 1}:</span>
                  <button
                    type="button"
                    onClick={() => setAdditionalServices(additionalServices.filter((_, i) => i !== index))}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Service name (e.g., Engine cleaning, Tire shine)"
                    value={service.name}
                    onChange={(e) => {
                      const newServices = [...additionalServices];
                      newServices[index].name = e.target.value;
                      setAdditionalServices(newServices);
                    }}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={service.price}
                    onChange={(e) => {
                      const newServices = [...additionalServices];
                      newServices[index].price = e.target.value;
                      setAdditionalServices(newServices);
                    }}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAdditionalServices([...additionalServices, { name: '', price: '' }])}
              style={{
                background: '#ffc107',
                color: '#212529',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 15px',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              + Add Additional Service
            </button>
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Notes:</label>
            <textarea
              name="Notes"
              value={formData.Notes}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
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