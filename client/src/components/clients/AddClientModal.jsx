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
  
  const [cars, setCars] = useState([{ plate: '', washType: 'EXT' }]);
  const [appointments, setAppointments] = useState([{ day: 'Saturday', time: '9:00 AM' }]);
  
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
  
  // Generate next customer ID when modal opens
  useEffect(() => {
    if (isOpen) {
      generateNextCustomerId();
    }
  }, [isOpen]);
  
  const generateNextCustomerId = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/next-id`);
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, CustomerID: data.nextId }));
      }
    } catch (error) {
      console.error('Error generating customer ID:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare client data
      const clientData = {
        ...formData,
        'Number of car': cars.length,
        CarPlates: cars.map(car => car.plate).join(', '),
        Days: appointments.map(apt => apt.day).join('-'),
        Time: appointments.map(apt => apt.time).join(' & '),
        cars: cars,
        appointments: appointments,
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
      setCars([{ plate: '', washType: 'EXT' }]);
      setAppointments([{ day: 'Saturday', time: '9:00 AM' }]);
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
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>🚗 Cars:</label>
              {cars.map((car, index) => (
                <div key={index} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Car {index + 1}:</span>
                    {cars.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCars(cars.filter((_, i) => i !== index))}
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
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Car plate number"
                      value={car.plate}
                      onChange={(e) => {
                        const newCars = [...cars];
                        newCars[index].plate = e.target.value;
                        setCars(newCars);
                      }}
                      required
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <select
                      value={car.washType}
                      onChange={(e) => {
                        const newCars = [...cars];
                        newCars[index].washType = e.target.value;
                        setCars(newCars);
                      }}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="EXT">EXT Only</option>
                      <option value="INT">EXT + INT</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCars([...cars, { plate: '', washType: 'EXT' }])}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 15px',
                  cursor: 'pointer'
                }}
              >
                + Add Another Car
              </button>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>📅 Appointments:</label>
              {appointments.map((apt, index) => (
                <div key={index} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  marginBottom: '10px',
                  backgroundColor: '#f0f8ff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '100px' }}>Appointment {index + 1}:</span>
                    {appointments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAppointments(appointments.filter((_, i) => i !== index))}
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
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <select
                      value={apt.day}
                      onChange={(e) => {
                        const newApts = [...appointments];
                        newApts[index].day = e.target.value;
                        setAppointments(newApts);
                      }}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="Saturday">Saturday</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                    </select>
                    <select
                      value={apt.time}
                      onChange={(e) => {
                        const newApts = [...appointments];
                        newApts[index].time = e.target.value;
                        setAppointments(newApts);
                      }}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="6:00 AM">6:00 AM</option>
                      <option value="7:00 AM">7:00 AM</option>
                      <option value="8:00 AM">8:00 AM</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const packageLimit = getPackageLimit(formData.Washman_Package);
                  if (packageLimit === 0) {
                    alert('Please select a package first to determine appointment limits.');
                    return;
                  }
                  if (appointments.length >= packageLimit) {
                    alert(`Package "${formData.Washman_Package}" allows maximum ${packageLimit} appointments per week.`);
                    return;
                  }
                  setAppointments([...appointments, { day: 'Saturday', time: '9:00 AM' }]);
                }}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 15px',
                  cursor: 'pointer'
                }}
              >
                + Add Another Appointment
              </button>
              {formData.Washman_Package && (
                <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0 0 0' }}>
                  Package "{formData.Washman_Package}" allows maximum {getPackageLimit(formData.Washman_Package)} appointments per week.
                  Current: {appointments.length}/{getPackageLimit(formData.Washman_Package)}
                </p>
              )}
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