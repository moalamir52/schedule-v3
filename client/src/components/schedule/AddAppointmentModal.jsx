import React, { useState, useEffect } from 'react';
const AddAppointmentModal = ({ isOpen, onClose, onAdd, workers = [] }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    villa: '',
    day: 'Saturday',
    time: '9:00 AM',
    workerName: '',
    cars: [{ plate: '', washType: 'EXT' }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];
  useEffect(() => {
    if (workers.length > 0 && !formData.workerName) {
      setFormData(prev => ({ ...prev, workerName: workers[0].Name }));
    }
  }, [workers]);
  const fetchAvailableWorkers = async (day, time) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/available-workers?day=${day}&time=${time}`);
      const data = await response.json();
      if (data.success) {
        setAvailableWorkers(data.availableWorkers);
        // Reset worker selection if current worker is not available
        if (formData.workerName && !data.availableWorkers.find(w => w.Name === formData.workerName)) {
          setFormData(prev => ({ ...prev, workerName: data.availableWorkers[0]?.Name || '' }));
        }
      }
    } catch (err) {
      setAvailableWorkers(workers); // Fallback to all workers
    }
  };
  useEffect(() => {
    if (formData.day && formData.time) {
      fetchAvailableWorkers(formData.day, formData.time);
    }
  }, [formData.day, formData.time, workers]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.villa || !formData.workerName || formData.cars.some(car => !car.plate.trim())) {
      setError('Customer Name, Villa, Worker and at least one car plate are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Send each car as separate appointment
      for (const car of formData.cars) {
        await onAdd({
          customerName: formData.customerName,
          villa: formData.villa,
          day: formData.day,
          time: formData.time,
          workerName: formData.workerName,
          washType: car.washType,
          carPlate: car.plate
        });
      }
      setFormData({
        customerName: '',
        villa: '',
        day: 'Saturday',
        time: '9:00 AM',
        workerName: workers[0]?.Name || '',
        cars: [{ plate: '', washType: 'EXT' }]
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add appointment');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Appointment</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="appointment-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          <div className="form-group">
            <label>👤 Customer Name:</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div className="form-group">
            <label>🏠 Villa:</label>
            <input
              type="text"
              value={formData.villa}
              onChange={(e) => setFormData(prev => ({ ...prev, villa: e.target.value }))}
              placeholder="Enter villa name/number"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>📅 Day:</label>
              <select
                value={formData.day}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, day: e.target.value, workerName: '' }));
                }}
              >
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>⏰ Time:</label>
              <select
                value={formData.time}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, time: e.target.value, workerName: '' }));
                }}
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>👷 Worker: {availableWorkers.length > 0 && `(${availableWorkers.length} available)`}</label>
            <select
              value={formData.workerName}
              onChange={(e) => setFormData(prev => ({ ...prev, workerName: e.target.value }))}
              required
            >
              <option value="">Select Worker</option>
              {availableWorkers.map(worker => (
                <option key={worker.WorkerID} value={worker.Name}>
                  {worker.Name} ✅
                </option>
              ))}
              {workers.filter(w => !availableWorkers.find(aw => aw.WorkerID === w.WorkerID)).map(worker => (
                <option key={worker.WorkerID} value={worker.Name} disabled>
                  {worker.Name} ❌ (Busy)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>🚗 Cars:</label>
            {formData.cars.map((car, index) => (
              <div key={index} style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', minWidth: '60px' }}>Car {index + 1}:</span>
                  {formData.cars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCars = formData.cars.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, cars: newCars }));
                      }}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    value={car.plate}
                    onChange={(e) => {
                      const newCars = [...formData.cars];
                      newCars[index].plate = e.target.value;
                      setFormData(prev => ({ ...prev, cars: newCars }));
                    }}
                    placeholder="Car plate number"
                    required
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <select
                    value={car.washType}
                    onChange={(e) => {
                      const newCars = [...formData.cars];
                      newCars[index].washType = e.target.value;
                      setFormData(prev => ({ ...prev, cars: newCars }));
                    }}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="EXT">EXT</option>
                    <option value="INT">INT</option>
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  cars: [...prev.cars, { plate: '', washType: 'EXT' }]
                }));
              }}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              + Add Another Car
            </button>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '⏳ Adding...' : '✅ Add Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddAppointmentModal;