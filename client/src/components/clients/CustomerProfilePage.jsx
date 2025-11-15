import React, { useState, useEffect } from 'react';
import './CustomerProfilePage.css';

const CustomerProfilePage = ({ customerId, onClose }) => {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customerId) {
      fetchCustomerProfile();
    }
  }, [customerId]);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      
      // Get customer data
      const customersRes = await fetch(`http://localhost:5001/api/customers`);
      const customers = await customersRes.json();
      const customer = customers.find(c => c.CustomerID === customerId);
      
      if (!customer) {
        setError('Customer not found');
        return;
      }
      
      // Get this week's schedule
      let thisWeekSchedule = [];
      try {
        const scheduleRes = await fetch(`http://localhost:5001/api/schedule/assign/current`);
        const scheduleData = await scheduleRes.json();
        if (scheduleData.success && scheduleData.assignments) {
          thisWeekSchedule = scheduleData.assignments.filter(task => 
            task.customerId === customerId || task.CustomerID === customerId
          );
        }
      } catch (e) {
        console.log('Could not fetch schedule:', e);
      }
      
      // Get full history
      let fullHistory = [];
      try {
        const historyRes = await fetch(`http://localhost:5001/api/schedule/assign/wash-history/${customerId}`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.success && historyData.history) {
            fullHistory = historyData.history;
          }
        }
      } catch (e) {
        console.log('Could not fetch history:', e);
        fullHistory = [];
      }
      
      // Get real invoices for this customer
      let billing = [];
      try {
        const invoicesRes = await fetch(`http://localhost:5001/api/invoices?customerId=${customerId}`);
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          if (invoicesData.success && Array.isArray(invoicesData.invoices)) {
            billing = invoicesData.invoices;
            console.log(`Found ${billing.length} invoices for customer ${customerId}:`, billing);
          }
        } else {
          console.log('Invoice API returned:', invoicesRes.status, invoicesRes.statusText);
        }
      } catch (e) {
        console.log('Could not fetch invoices:', e);
        billing = [];
      }
      
      setCustomerData({
        customer: {
          CustomerID: customer.CustomerID,
          CustomerName: customer.CustomerName || customer.Name,
          Villa: customer.Villa,
          Status: customer.Status,
          Washman_Package: customer.Washman_Package,
          Days: customer.Days,
          Time: customer.Time,
          Notes: customer.Notes,
          CarPlates: customer.CarPlates
        },
        thisWeekSchedule: Array.isArray(thisWeekSchedule) ? thisWeekSchedule.map(task => ({
          Day: task.day || task.Day,
          Time: task.time || task.Time,
          CarPlate: task.carPlate || task.CarPlate,
          WashType: task.washType || task.WashType,
          WorkerName: task.workerName || task.WorkerName
        })) : [],
        fullHistory: Array.isArray(fullHistory) ? fullHistory.map(record => ({
          WashDate: record.washDate || record.WashDate,
          Day: record.Day,
          WashType: record.washType || record.WashType,
          CarPlate: record.carPlate || record.CarPlate
        })) : [],
        billing: Array.isArray(billing) ? billing.map(invoice => ({
          Ref: invoice.Ref,
          InvoiceDate: invoice.InvoiceDate || invoice.CreatedAt,
          TotalAmount: invoice.TotalAmount,
          Currency: invoice.Currency || 'AED',
          Status: invoice.Status
        })) : []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-profile-overlay">
        <div className="customer-profile-modal">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-profile-overlay">
        <div className="customer-profile-modal">
          <div className="error-message">Error: {error}</div>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  if (!customerData) return null;

  const { customer, thisWeekSchedule, fullHistory, billing } = customerData;

  return (
    <div className="customer-profile-overlay" onClick={onClose}>
      <div className="customer-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="profile-header-content">
            <h1 className="customer-name">{customer.CustomerName}</h1>
            <div className="status-badge active">Status: {customer.Status}</div>
            <div className="profile-meta">
              <span className="villa">Villa: {customer.Villa}</span>
              <span className="customer-id">ID: {customer.CustomerID}</span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          {/* Customer Information */}
          <div className="profile-section">
            <h2>Customer Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Package:</label>
                <span>{customer.Washman_Package}</span>
              </div>
              <div className="info-item">
                <label>Days:</label>
                <span>{customer.Days}</span>
              </div>
              <div className="info-item">
                <label>Time:</label>
                <span>{customer.Time}</span>
              </div>
              <div className="info-item full-width">
                <label>Notes:</label>
                <span>{customer.Notes || 'No notes'}</span>
              </div>
            </div>
          </div>

          {/* Car Plates */}
          <div className="profile-section">
            <h2>Car Plates</h2>
            <div className="car-plates-list">
              {customer.CarPlates?.split(',').map((plate, index) => (
                <span key={index} className="car-plate-badge">
                  {plate.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* This Week's Schedule */}
          <div className="profile-section">
            <h2>This Week's Schedule</h2>
            <div className="schedule-table">
              {thisWeekSchedule && thisWeekSchedule.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Car Plate</th>
                      <th>Wash Type</th>
                      <th>Worker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thisWeekSchedule.map((schedule, index) => (
                      <tr key={index}>
                        <td>{schedule.Day}</td>
                        <td>{schedule.Time}</td>
                        <td>{schedule.CarPlate}</td>
                        <td>
                          <span className={`wash-type ${schedule.WashType?.toLowerCase()}`}>
                            {schedule.WashType}
                          </span>
                        </td>
                        <td>{schedule.WorkerName || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No schedule for this week</div>
              )}
            </div>
          </div>

          {/* Full History */}
          <div className="profile-section">
            <h2>Full History</h2>
            <div className="history-table">
              {fullHistory && fullHistory.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Wash Type</th>
                      <th>Car Plate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullHistory.map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.WashDate).toLocaleDateString('en-GB')}</td>
                        <td>{record.Day || 'N/A'}</td>
                        <td>
                          <span className={`wash-type ${record.WashType?.toLowerCase()}`}>
                            {record.WashType}
                          </span>
                        </td>
                        <td>{record.CarPlate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No history records</div>
              )}
              <div className="history-note">Showing latest records</div>
            </div>
          </div>

          {/* Billing */}
          <div className="profile-section">
            <h2>Billing</h2>
            <div className="billing-table">
              {billing && billing.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice Ref</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.map((invoice, index) => (
                      <tr key={index}>
                        <td>{invoice.Ref}</td>
                        <td>{new Date(invoice.InvoiceDate).toLocaleDateString('en-GB')}</td>
                        <td>{invoice.TotalAmount} {invoice.Currency}</td>
                        <td>
                          <span className={`status-badge ${invoice.Status?.toLowerCase()}`}>
                            {invoice.Status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No billing records</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;