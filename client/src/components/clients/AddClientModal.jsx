import { useState } from 'react';

function AddClientModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    CustomerID: '',
    Name: '',
    Villa: '',
    Phone: '',
    'Number of car': '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAdd(formData);
      setFormData({
        CustomerID: '',
        Name: '',
        Villa: '',
        Phone: '',
        'Number of car': '',
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
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
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
            
            <div>
              <label>Number of Cars:</label>
              <input
                type="number"
                name="Number of car"
                value={formData['Number of car']}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label>Car Plates:</label>
              <input
                type="text"
                name="CarPlates"
                value={formData.CarPlates}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label>Days:</label>
              <input
                type="text"
                name="Days"
                value={formData.Days}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label>Time:</label>
              <input
                type="text"
                name="Time"
                value={formData.Time}
                onChange={handleChange}
              />
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
          
          <div style={{ marginTop: '15px' }}>
            <label>Notes:</label>
            <textarea
              name="Notes"
              value={formData.Notes}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-success">
              Add Client
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClientModal;