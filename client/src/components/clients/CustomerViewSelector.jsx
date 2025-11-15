import React, { useState } from 'react';
import CustomerProfilePage from './CustomerProfilePage';
import './CustomerViewSelector.css';

const CustomerViewSelector = ({ customerId, customerName, onClose }) => {
  const [selectedView, setSelectedView] = useState(null);
  
  console.log('CustomerViewSelector rendered with:', { customerId, customerName, selectedView });

  if (selectedView === 'full') {
    console.log('Showing full customer profile for:', customerId);
    return <CustomerProfilePage customerId={customerId} onClose={onClose} />;
  }

  if (selectedView === 'quick') {
    console.log('Showing quick view for:', customerId);
    return <QuickCustomerInfo customerId={customerId} onClose={onClose} />;
  }

  console.log('Showing view selector options');

  return (
    <div className="view-selector-overlay" onClick={onClose}>
      <div className="view-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="selector-header">
          <h3>Customer Information</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="selector-content">
          <p>How would you like to view <strong>{customerName}</strong> information?</p>
          
          <div className="view-options">
            <button 
              className="view-option quick-view"
              onClick={() => {
                console.log('Quick view selected');
                setSelectedView('quick');
              }}
            >
              <div className="option-icon">⚡</div>
              <div className="option-text">
                <h4>Quick View</h4>
                <p>Basic information only</p>
              </div>
            </button>

            <button 
              className="view-option full-view"
              onClick={() => {
                console.log('Full view selected');
                setSelectedView('full');
              }}
            >
              <div className="option-icon">📋</div>
              <div className="option-text">
                <h4>Full Profile</h4>
                <p>Complete customer information page</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickCustomerInfo = ({ customerId, onClose }) => {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchQuickInfo();
  }, [customerId]);

  const fetchQuickInfo = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/customers`);
      const customers = await response.json();
      const customer = customers.find(c => c.CustomerID === customerId);
      
      if (customer) {
        setCustomerData({
          CustomerID: customer.CustomerID,
          CustomerName: customer.CustomerName || customer.Name,
          Villa: customer.Villa,
          Washman_Package: customer.Washman_Package,
          Days: customer.Days,
          Time: customer.Time,
          CarPlates: customer.CarPlates,
          Status: customer.Status,
          Notes: customer.Notes
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="quick-info-overlay" onClick={onClose}>
      <div className="quick-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-header">
          <h3>{customerData?.CustomerName || customerData?.Name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="quick-content">
          <div className="info-row">
            <span className="label">Villa:</span>
            <span className="value">{customerData?.Villa}</span>
          </div>
          <div className="info-row">
            <span className="label">Package:</span>
            <span className="value">{customerData?.Washman_Package}</span>
          </div>
          <div className="info-row">
            <span className="label">Days:</span>
            <span className="value">{customerData?.Days}</span>
          </div>
          <div className="info-row">
            <span className="label">Time:</span>
            <span className="value">{customerData?.Time}</span>
          </div>
          <div className="info-row">
            <span className="label">Cars:</span>
            <span className="value">{customerData?.CarPlates}</span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className={`status ${customerData?.Status?.toLowerCase()}`}>
              {customerData?.Status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewSelector;