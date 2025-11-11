import { useState, useEffect } from 'react';
import ScheduleModal from './ScheduleModal';
function EditClientModal({ isOpen, onClose, onUpdate, client }) {
  const [formData, setFormData] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [cars, setCars] = useState([{ plate: '', washType: 'EXT' }]);
  // Convert date from "02-Sep-2025" to "2025-09-02" format
  const convertDateToInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + ' 12:00:00'); // Add time to avoid timezone issues
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };
  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        'start date': convertDateToInput(client['start date'])
      });
      
      // Parse existing car plates
      if (client.CarPlates) {
        const carPlates = client.CarPlates.split(',').map(plate => plate.trim()).filter(plate => plate);
        const parsedCars = carPlates.map(plate => ({ plate, washType: 'EXT' }));
        setCars(parsedCars.length > 0 ? parsedCars : [{ plate: '', washType: 'EXT' }]);
      } else {
        setCars([{ plate: '', washType: 'EXT' }]);
      }
    }
  }, [client]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        'Number of car': cars.length,
        CarPlates: cars.map(car => car.plate).filter(plate => plate.trim()).join(', ')
      };
      await onUpdate(client.CustomerID, updatedData);
      onClose();
    } catch (error) {
      }
  };
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleScheduleSave = (scheduleData) => {
    setFormData({
      ...formData,
      ...scheduleData
    });
  };

  const updateCarPlates = (newCars) => {
    setCars(newCars);
    setFormData({
      ...formData,
      'Number of car': newCars.length,
      CarPlates: newCars.map(car => car.plate).filter(plate => plate.trim()).join(', ')
    });
  };
  if (!isOpen || !client) return null;
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
        <h2 style={{ marginBottom: '20px', color: '#548235' }}>Edit Client</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Customer ID:</label>
              <input
                type="text"
                name="CustomerID"
                value={formData.CustomerID || ''}
                onChange={handleChange}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div>
              <label>Name:</label>
              <input
                type="text"
                name="Name"
                value={formData.Name || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Villa:</label>
              <input
                type="text"
                name="Villa"
                value={formData.Villa || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Phone:</label>
              <input
                type="text"
                name="Phone"
                value={formData.Phone || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Number of Cars:</label>
              <input
                type="number"
                name="Number of car"
                value={formData['Number of car'] || ''}
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
                        onClick={() => updateCarPlates(cars.filter((_, i) => i !== index))}
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
                        updateCarPlates(newCars);
                      }}
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
                onClick={() => updateCarPlates([...cars, { plate: '', washType: 'EXT' }])}
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
            <div>
              <label>Days:</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  type="text"
                  name="Days"
                  value={formData.Days || ''}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🚗 Schedule
                </button>
              </div>
            </div>
            <div>
              <label>Time:</label>
              <input
                type="text"
                name="Time"
                value={formData.Time || ''}
                onChange={handleChange}
                readOnly
              />
            </div>
            <div>
              <label>Package:</label>
              <select
                name="Washman_Package"
                value={formData.Washman_Package || ''}
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
                value={formData.Fee || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Start Date:</label>
              <input
                type="date"
                name="start date"
                value={formData['start date'] || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Status:</label>
              <select
                name="Status"
                value={formData.Status || ''}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label>Notes:</label>
            <textarea
              name="Notes"
              value={formData.Notes || ''}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">
              Update Client
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
        
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          client={{
            ...formData,
            CarPlates: cars.map(car => car.plate).filter(plate => plate.trim()).join(', ')
          }}
          onSave={handleScheduleSave}
        />
      </div>
    </div>
  );
}
export default EditClientModal;