import React, { useState, useEffect } from 'react';
import InvoiceGenerator from '../components/InvoiceGenerator';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState(null);
  const [showOneTimeInvoiceForm, setShowOneTimeInvoiceForm] = useState(false);
  const [oneTimeInvoiceData, setOneTimeInvoiceData] = useState({
    clientName: '',
    villa: '',
    phone: '',
    serviceDescription: '',
    vehicleTypes: '',
    serves: '',
    amount: '',
    paymentStatus: 'pending',
    notes: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    thisMonth: { total: 0, count: 0 },
    paid: { total: 0, count: 0 },
    pending: { total: 0, count: 0 },
    allTime: { total: 0, count: 0 }
  });
  const [availableClients, setAvailableClients] = useState([]);
  const [invoicedClients, setInvoicedClients] = useState([]);
  const [showClientsPanel, setShowClientsPanel] = useState(false);
  const [availableSearch, setAvailableSearch] = useState('');
  const [invoicedSearch, setInvoicedSearch] = useState('');
  const [newInvoice, setNewInvoice] = useState({
    customerID: '',
    totalAmount: '',
    dueDate: '',
    notes: ''
  });
  const [showBankSettings, setShowBankSettings] = useState(false);
  const [bankConfig, setBankConfig] = useState({
    accountHolderName: 'GLOGO PARKING CAR WASHING LLC',
    bankName: 'ENBD',
    accountNumber: '1015942086801',
    iban: 'AE390260001015942086801'
  });

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadAvailableClients();
    loadMonthlyStats();
    
    // Load bank config from localStorage
    const savedBankConfig = localStorage.getItem('bankConfig');
    if (savedBankConfig) {
      setBankConfig(JSON.parse(savedBankConfig));
    }
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/all`);
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
        calculateStats(data.invoices);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (invoiceData) => {
    const total = invoiceData.length;
    const paid = invoiceData.filter(inv => inv.Status === 'Paid').length;
    const pending = invoiceData.filter(inv => inv.Status === 'Pending').length;
    const totalAmount = invoiceData.reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    const paidAmount = invoiceData.filter(inv => inv.Status === 'Paid').reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    const pendingAmount = invoiceData.filter(inv => inv.Status === 'Pending').reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    
    setStats({ total, paid, pending, totalAmount, paidAmount, pendingAmount });
  };

  const loadMonthlyStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/stats`);
      const data = await response.json();
      setMonthlyStats(data);
    } catch (err) {
      console.error('Failed to load monthly stats:', err);
    }
  };

  const handleOneTimeInvoice = async () => {
    const tempClient = {
      name: oneTimeInvoiceData.clientName || 'Walk-in Customer',
      villa: oneTimeInvoiceData.villa || 'N/A',
      phone: oneTimeInvoiceData.phone || 'N/A',
      fee: parseFloat(oneTimeInvoiceData.amount) || 0,
      washmanPackage: 'One-Time Service',
      typeOfCar: oneTimeInvoiceData.vehicleTypes || 'N/A',
      serves: oneTimeInvoiceData.serves || 'One-time car wash service',
      payment: oneTimeInvoiceData.paymentStatus,
      startDate: new Date().toLocaleDateString('en-GB')
    };

    // Invoice will be saved by InvoiceGenerator

    setSelectedClientForInvoice(tempClient);
    setShowInvoiceGenerator(true);
    setShowOneTimeInvoiceForm(false);
    
    setOneTimeInvoiceData({
      clientName: '',
      villa: '',
      phone: '',
      serviceDescription: '',
      vehicleTypes: '',
      serves: '',
      amount: '',
      paymentStatus: 'pending',
      notes: ''
    });
  };

  const handleReprintInvoice = (invoice) => {
    const clientDataForPrint = {
      name: invoice.CustomerName,
      villa: invoice.Villa,
      phone: invoice.Phone || 'N/A',
      fee: invoice.TotalAmount,
      washmanPackage: invoice.PackageID || 'Standard Service',
      typeOfCar: invoice.VehicleType || 'N/A',
      serves: invoice.Services || '',
      payment: invoice.Status === 'Paid' ? 'yes/cash' : 'pending',
      invoiceDate: invoice.InvoiceDate,
      startDate: invoice.ServiceDate || invoice.InvoiceDate,
      customerID: invoice.CustomerID,
      existingRef: invoice.Ref || invoice.InvoiceID // استخدام عمود Ref أولاً
    };
    
    setSelectedClientForInvoice(clientDataForPrint);
    setShowInvoiceGenerator(true);
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadAvailableClients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/available`);
      const data = await response.json();
      if (data.success) {
        setAvailableClients(data.availableClients);
        setInvoicedClients(data.invoicedClients);
      }
    } catch (err) {
      console.error('Failed to load available clients:', err);
    }
  };

  const createInvoice = () => {
    const selectedCustomer = customers.find(c => c.CustomerID === newInvoice.customerID);
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    
    // Check if customer already has invoice this month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const existingInvoice = invoices.find(invoice => {
      const dateField = invoice.InvoiceDate || invoice.CreatedAt;
      if (!dateField) return false;
      
      const invoiceDate = new Date(dateField);
      const invoiceMonth = invoiceDate.getMonth() + 1;
      const invoiceYear = invoiceDate.getFullYear();
      
      return invoice.CustomerID === selectedCustomer.CustomerID && 
             invoiceMonth === currentMonth && 
             invoiceYear === currentYear;
    });
    
    if (existingInvoice) {
      if (confirm(`Customer ${selectedCustomer.Name} already has an invoice for this month (${existingInvoice.Ref || existingInvoice.InvoiceID}). Would you like to reprint the existing invoice instead?`)) {
        handleReprintInvoice(existingInvoice);
        setShowCreateModal(false);
        return;
      } else {
        return;
      }
    }
    
    const clientData = {
      name: selectedCustomer.Name,
      villa: selectedCustomer.Villa,
      phone: selectedCustomer.Phone || 'N/A',
      fee: parseFloat(newInvoice.totalAmount) || selectedCustomer.Fee || 0,
      washmanPackage: selectedCustomer.Washman_Package || selectedCustomer.Package || 'Standard Package',
      typeOfCar: selectedCustomer.CarPlates || selectedCustomer.TypeOfCar || 'N/A',
      serves: selectedCustomer.Serves || '',
      payment: selectedCustomer.Payment || 'pending',
      startDate: selectedCustomer.Start_Date || new Date().toLocaleDateString('en-GB'),
      customerID: selectedCustomer.CustomerID
    };
    
    setSelectedClientForInvoice(clientData);
    setShowInvoiceGenerator(true);
    setShowCreateModal(false);
    setNewInvoice({ customerID: '', totalAmount: '', dueDate: '', notes: '' });
  };

  const updateInvoiceStatus = async (invoiceId, status, paymentMethod = '') => {
    console.log('[FRONTEND] Updating invoice:', { invoiceId, status, paymentMethod });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/update/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentMethod })
      });
      
      console.log('[FRONTEND] Update response status:', response.status);
      const data = await response.json();
      console.log('[FRONTEND] Update response data:', data);
      
      if (response.ok) {
        console.log('[FRONTEND] Update successful, reloading invoices...');
        loadInvoices();
        loadMonthlyStats();
      } else {
        console.error('[FRONTEND] Update failed:', data);
      }
    } catch (err) {
      console.error('[FRONTEND] Failed to update invoice:', err);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    console.log('Attempting to delete invoice:', invoiceId);
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/delete/${invoiceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadInvoices();
        loadAvailableClients();
        loadMonthlyStats();
      }
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  const exportInvoices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Failed to export invoices:', err);
    }
  };

  const getFilteredInvoices = () => {
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.Villa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.InvoiceID.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || invoice.Status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return '#28a745';
      case 'Pending': return '#ffc107';
      case 'Overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const tableHeaderStyle = {
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#495057',
    borderBottom: '2px solid #dee2e6'
  };

  const tableCellStyle = {
    padding: '12px 8px',
    verticalAlign: 'middle'
  };

  const actionButtonStyle = (bgColor, textColor = 'white') => ({
    background: bgColor,
    color: textColor,
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '11px',
    minWidth: 'auto',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap'
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button
            onClick={() => window.location.href = '/'}
            className="btn-back"
          >
            ← Back
          </button>
          
        </div>
        
        <div className="header-center">
          <h1>Invoice Management System</h1>
        </div>
        
        <div className="header-actions">
            <button
              onClick={() => setShowClientsPanel(true)}
              className="btn btn-secondary"
            >
              👥 Available Clients ({availableClients.length})
            </button>
            <button
              onClick={() => setShowOneTimeInvoiceForm(true)}
              className="btn btn-secondary"
            >
              ⚡ One-Time Invoice
            </button>
            <button
              onClick={exportInvoices}
              className="btn btn-secondary"
            >
              📊 Export All
            </button>
            <button
              onClick={() => setShowBankSettings(true)}
              className="btn btn-primary"
            >
              🏦 Bank Settings
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              + New Invoice
            </button>
          </div>
        </div>
        
      {/* Search and Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by customer name, villa, or invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            minWidth: '120px'
          }}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Total: {getFilteredInvoices().length} invoices
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{monthlyStats.thisMonth.total} AED</h3>
            <p>This Month</p>
            <small>{monthlyStats.thisMonth.count} invoices</small>
            <small style={{ display: 'block', color: '#007bff', cursor: 'pointer' }}>Click to view all</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3 style={{ color: '#28a745' }}>{monthlyStats.paid.total} AED</h3>
            <p>Paid</p>
            <small>{monthlyStats.paid.count} invoices</small>
            <small style={{ display: 'block', color: '#007bff', cursor: 'pointer' }}>Click to view paid</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3 style={{ color: '#ffc107' }}>{monthlyStats.pending.total} AED</h3>
            <p>Pending</p>
            <small>{monthlyStats.pending.count} invoices</small>
            <small style={{ display: 'block', color: '#007bff', cursor: 'pointer' }}>Click to view pending</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3 style={{ color: '#6f42c1' }}>{monthlyStats.allTime.total} AED</h3>
            <p>Total</p>
            <small>{monthlyStats.allTime.count} invoices</small>
            <small style={{ display: 'block', color: '#007bff', cursor: 'pointer' }}>Click to view all time</small>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading invoices...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={tableHeaderStyle}>Invoice ID</th>
                  <th style={tableHeaderStyle}>Customer</th>
                  <th style={tableHeaderStyle}>Villa</th>
                  <th style={tableHeaderStyle}>Amount</th>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>Due Date</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Payment</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredInvoices().map((invoice, index) => (
                  <tr key={invoice.InvoiceID} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <td style={tableCellStyle}>
                      <strong style={{ color: '#007bff' }}>{invoice.InvoiceID}</strong>
                    </td>
                    <td style={tableCellStyle}>{invoice.CustomerName}</td>
                    <td style={tableCellStyle}>{invoice.Villa}</td>
                    <td style={tableCellStyle}>
                      <strong style={{ color: '#28a745' }}>AED {invoice.TotalAmount}</strong>
                    </td>
                    <td style={tableCellStyle}>{invoice.InvoiceDate}</td>
                    <td style={tableCellStyle}>{invoice.DueDate}</td>
                    <td style={tableCellStyle}>
                      <span style={{
                        backgroundColor: getStatusColor(invoice.Status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {invoice.Status}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{invoice.PaymentMethod || '-'}</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {invoice.Status === 'Pending' && (
                          <>
                            <button
                              onClick={() => {
                                console.log('[BUTTON CLICK] Mark as Paid clicked for:', invoice.InvoiceID);
                                updateInvoiceStatus(invoice.InvoiceID, 'Paid', 'Cash');
                              }}
                              style={actionButtonStyle('#28a745')}
                              title="Mark as Paid"
                            >
                              Paid
                            </button>
                            <button
                              onClick={() => {
                                console.log('[BUTTON CLICK] Mark as Overdue clicked for:', invoice.InvoiceID);
                                updateInvoiceStatus(invoice.InvoiceID, 'Overdue');
                              }}
                              style={actionButtonStyle('#dc3545')}
                              title="Mark as Overdue"
                            >
                              Overdue
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            console.log('[BUTTON CLICK] Edit clicked for:', invoice);
                            // Get customer data from customers sheet
                            const customerData = customers.find(c => c.CustomerID === invoice.CustomerID);
                            const enrichedInvoice = {
                              ...invoice,
                              Phone: customerData?.Phone || invoice.Phone || '',
                              ServiceDescription: customerData?.Washman_Package || invoice.ServiceDescription || '',
                              Services: customerData?.Serves || invoice.Services || '',
                              VehicleType: customerData?.CarPlates || invoice.VehicleType || '',
                              NumberOfCars: customerData?.CarPlates ? customerData.CarPlates.split(',').length : 1,
                              Payment: customerData?.Payment || invoice.Payment || ''
                            };
                            setEditingInvoice(enrichedInvoice);
                          }}
                          style={actionButtonStyle('#17a2b8')}
                          title="Edit Invoice"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleReprintInvoice(invoice)}
                          style={actionButtonStyle('#ffc107', 'black')}
                          title="Print Invoice"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => deleteInvoice(invoice.InvoiceID)}
                          style={actionButtonStyle('#dc3545')}
                          title="Delete Invoice"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {getFilteredInvoices().length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                fontSize: '16px'
              }}>
                {searchTerm || statusFilter !== 'All' ? 'No invoices match your search criteria' : 'No invoices found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Create New Invoice</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Customer:</label>
              <select
                value={newInvoice.customerID}
                onChange={(e) => setNewInvoice({...newInvoice, customerID: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.CustomerID} value={customer.CustomerID}>
                    {customer.Name} - {customer.Villa}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Total Amount:</label>
              <input
                type="number"
                value={newInvoice.totalAmount}
                onChange={(e) => setNewInvoice({...newInvoice, totalAmount: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Due Date:</label>
              <input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label>Notes:</label>
              <textarea
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  height: '60px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={createInvoice}
                style={{
                  flex: 1,
                  background: '#007bff',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Create Invoice
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  background: '#6c757d',
                  color: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-Time Invoice Form */}
      {showOneTimeInvoiceForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #fd7e14',
              paddingBottom: '10px'
            }}>
              <h3 style={{ color: '#fd7e14', margin: 0 }}>⚡ One-Time Invoice</h3>
              <button
                onClick={() => setShowOneTimeInvoiceForm(false)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Client Name</label>
                <input
                  type="text"
                  value={oneTimeInvoiceData.clientName}
                  onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, clientName: e.target.value})}
                  placeholder="Enter client name (optional)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Villa</label>
                  <input
                    type="text"
                    value={oneTimeInvoiceData.villa}
                    onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, villa: e.target.value})}
                    placeholder="Villa number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
                  <input
                    type="tel"
                    value={oneTimeInvoiceData.phone}
                    onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, phone: e.target.value})}
                    placeholder="Phone number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Service Description</label>
                <input
                  type="text"
                  value={oneTimeInvoiceData.serviceDescription}
                  onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, serviceDescription: e.target.value})}
                  placeholder="e.g., Car wash service, Interior cleaning"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Vehicle Type(s)</label>
                <input
                  type="text"
                  value={oneTimeInvoiceData.vehicleTypes}
                  onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, vehicleTypes: e.target.value})}
                  placeholder="e.g., Sedan, SUV, Hatchback"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Services</label>
                <input
                  type="text"
                  value={oneTimeInvoiceData.serves}
                  onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, serves: e.target.value})}
                  placeholder="e.g., Exterior wash, Interior cleaning"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Amount (AED)</label>
                <input
                  type="number"
                  value={oneTimeInvoiceData.amount}
                  onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, amount: e.target.value})}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Payment Status</label>
                <select
                  value={oneTimeInvoiceData.paymentStatus}
                  onChange={(e) => setOneTimeInvoiceData({...oneTimeInvoiceData, paymentStatus: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="yes/cash">✅ Paid (Cash)</option>
                  <option value="yes/bank">✅ Paid (Bank)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setShowOneTimeInvoiceForm(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleOneTimeInvoice}
                  style={{
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ⚡ Create & Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #17a2b8',
              paddingBottom: '10px'
            }}>
              <h3 style={{ color: '#17a2b8', margin: 0 }}>✏️ Edit Invoice: {editingInvoice.Ref || editingInvoice.InvoiceID}</h3>
              <button
                onClick={() => setEditingInvoice(null)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Client Name *</label>
                <input
                  type="text"
                  value={editingInvoice.CustomerName}
                  onChange={(e) => setEditingInvoice({...editingInvoice, CustomerName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Villa</label>
                  <input
                    type="text"
                    value={editingInvoice.Villa}
                    onChange={(e) => setEditingInvoice({...editingInvoice, Villa: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
                  <input
                    type="tel"
                    value={editingInvoice.Phone || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, Phone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Service Description</label>
                <input
                  type="text"
                  value={editingInvoice.ServiceDescription || ''}
                  onChange={(e) => setEditingInvoice({...editingInvoice, ServiceDescription: e.target.value})}
                  placeholder="e.g., 3 Ext 1 INT bi week Car Wash Service"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Services (Serves)</label>
                <input
                  type="text"
                  value={editingInvoice.Services || ''}
                  onChange={(e) => setEditingInvoice({...editingInvoice, Services: e.target.value})}
                  placeholder="e.g., 2 Ext 1 INT week+ garage bi-weekly"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Vehicle Type(s)</label>
                  <input
                    type="text"
                    value={editingInvoice.VehicleType || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, VehicleType: e.target.value})}
                    placeholder="e.g., 2 sedan"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Number of Cars</label>
                  <input
                    type="number"
                    value={editingInvoice.NumberOfCars || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, NumberOfCars: e.target.value})}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Amount (AED) *</label>
                <input
                  type="number"
                  value={editingInvoice.TotalAmount}
                  onChange={(e) => setEditingInvoice({...editingInvoice, TotalAmount: e.target.value})}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Payment Method</label>
                  <select
                    value={editingInvoice.PaymentMethod || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, PaymentMethod: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Bank">🏦 Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Payment</label>
                  <input
                    type="text"
                    value={editingInvoice.Payment || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, Payment: e.target.value})}
                    placeholder="paid or amount (e.g., 200)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Notes</label>
                <textarea
                  value={editingInvoice.Notes || ''}
                  onChange={(e) => setEditingInvoice({...editingInvoice, Notes: e.target.value})}
                  placeholder="Additional notes..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    height: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                backgroundColor: '#e7f3ff',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #b3d9ff',
                fontSize: '14px',
                color: '#0066cc'
              }}>
                ℹ️ Note: This will update the invoice with the same reference number ({editingInvoice.Ref || editingInvoice.InvoiceID}) and automatically print the updated version.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setEditingInvoice(null)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/update/${editingInvoice.InvoiceID}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customerName: editingInvoice.CustomerName,
                          villa: editingInvoice.Villa,
                          totalAmount: editingInvoice.TotalAmount,
                          paymentMethod: editingInvoice.PaymentMethod,
                          notes: editingInvoice.Notes
                        })
                      });
                      
                      if (response.ok) {
                        // Update and print
                        const clientDataForPrint = {
                          name: editingInvoice.CustomerName,
                          villa: editingInvoice.Villa,
                          phone: editingInvoice.Phone || 'N/A',
                          fee: editingInvoice.TotalAmount,
                          washmanPackage: editingInvoice.ServiceDescription || 'Standard Service',
                          typeOfCar: editingInvoice.VehicleType || 'N/A',
                          serves: editingInvoice.Services || '',
                          payment: editingInvoice.PaymentMethod === 'Cash' ? 'yes/cash' : editingInvoice.PaymentMethod === 'Bank' ? 'yes/bank' : 'pending',
                          customerID: editingInvoice.CustomerID,
                          existingRef: editingInvoice.Ref || editingInvoice.InvoiceID
                        };
                        
                        setSelectedClientForInvoice(clientDataForPrint);
                        setShowInvoiceGenerator(true);
                        setEditingInvoice(null);
                        loadInvoices();
                      }
                    } catch (err) {
                      console.error('Failed to update invoice:', err);
                    }
                  }}
                  style={{
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✏️ Update & Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Clients Panel */}
      {showClientsPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#17a2b8', margin: 0 }}>👥 Client Status - {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
              <button
                onClick={() => setShowClientsPanel(false)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Available Clients */}
              <div>
                <h4 style={{ color: '#28a745', marginBottom: '15px' }}>
                  ✅ Available for Invoice ({availableClients.filter(client => 
                    client.Name.toLowerCase().includes(availableSearch.toLowerCase()) ||
                    client.Villa.toLowerCase().includes(availableSearch.toLowerCase())
                  ).length})
                </h4>
                <input
                  type="text"
                  placeholder="Search available clients..."
                  value={availableSearch}
                  onChange={(e) => setAvailableSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}
                />
                <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                  {availableClients.filter(client => 
                    client.Name.toLowerCase().includes(availableSearch.toLowerCase()) ||
                    client.Villa.toLowerCase().includes(availableSearch.toLowerCase())
                  ).map(client => (
                    <div key={client.CustomerID} style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>{client.Name}</strong><br/>
                        <small style={{ color: '#666' }}>Villa: {client.Villa} | Fee: AED {client.Fee}</small>
                      </div>
                      <button
                        onClick={() => {
                          const clientData = {
                            name: client.Name,
                            villa: client.Villa,
                            phone: client.Phone || 'N/A',
                            fee: client.Fee || 0,
                            washmanPackage: client.Washman_Package || client.Package || 'Standard Package',
                            typeOfCar: client.CarPlates || client.TypeOfCar || 'N/A',
                            serves: client.Serves || '',
                            payment: client.Payment || 'pending',
                            startDate: client.Start_Date || new Date().toLocaleDateString('en-GB'),
                            customerID: client.CustomerID
                          };
                          setSelectedClientForInvoice(clientData);
                          setShowInvoiceGenerator(true);
                          setShowClientsPanel(false);
                        }}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Create Invoice
                      </button>
                    </div>
                  ))}
                  {availableClients.filter(client => 
                    client.Name.toLowerCase().includes(availableSearch.toLowerCase()) ||
                    client.Villa.toLowerCase().includes(availableSearch.toLowerCase())
                  ).length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      {availableSearch ? 'No clients match your search' : 'All clients have invoices for this month'}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoiced Clients */}
              <div>
                <h4 style={{ color: '#ffc107', marginBottom: '15px' }}>
                  📝 Already Invoiced ({invoicedClients.filter(client => 
                    client.Name.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                    client.Villa.toLowerCase().includes(invoicedSearch.toLowerCase())
                  ).length})
                </h4>
                <input
                  type="text"
                  placeholder="Search invoiced clients..."
                  value={invoicedSearch}
                  onChange={(e) => setInvoicedSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}
                />
                <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                  {invoicedClients.filter(client => 
                    client.Name.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                    client.Villa.toLowerCase().includes(invoicedSearch.toLowerCase())
                  ).map(client => {
                    // Find the invoice for this client
                    const clientInvoice = invoices.find(inv => inv.CustomerID === client.CustomerID);
                    
                    return (
                      <div key={client.CustomerID} style={{
                        padding: '12px',
                        borderBottom: '1px solid #eee',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong>{client.Name}</strong><br/>
                          <small style={{ color: '#666' }}>Villa: {client.Villa} | Fee: AED {client.Fee}</small>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              if (clientInvoice) {
                                handleReprintInvoice(clientInvoice);
                                setShowClientsPanel(false);
                              }
                            }}
                            style={{
                              backgroundColor: '#ffc107',
                              color: 'black',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                            title="Reprint Invoice"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => {
                              if (clientInvoice) {
                                // Enrich invoice with customer data
                                const enrichedInvoice = {
                                  ...clientInvoice,
                                  Phone: client.Phone || clientInvoice.Phone || '',
                                  ServiceDescription: client.Washman_Package || clientInvoice.ServiceDescription || '',
                                  Services: client.Serves || clientInvoice.Services || '',
                                  VehicleType: client.CarPlates || clientInvoice.VehicleType || '',
                                  NumberOfCars: client.CarPlates ? client.CarPlates.split(',').length : 1,
                                  Payment: client.Payment || clientInvoice.Payment || ''
                                };
                                setEditingInvoice(enrichedInvoice);
                                setShowClientsPanel(false);
                              }
                            }}
                            style={{
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                            title="Edit Invoice"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {invoicedClients.filter(client => 
                    client.Name.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                    client.Villa.toLowerCase().includes(invoicedSearch.toLowerCase())
                  ).length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      {invoicedSearch ? 'No clients match your search' : 'No invoices created this month'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Settings Modal */}
      {showBankSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ color: '#00695C', marginBottom: '20px' }}>🏦 Bank Details Settings</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Account Holder Name:</label>
              <input
                type="text"
                value={bankConfig.accountHolderName}
                onChange={(e) => setBankConfig({...bankConfig, accountHolderName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Bank Name:</label>
              <input
                type="text"
                value={bankConfig.bankName}
                onChange={(e) => setBankConfig({...bankConfig, bankName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Account Number:</label>
              <input
                type="text"
                value={bankConfig.accountNumber}
                onChange={(e) => setBankConfig({...bankConfig, accountNumber: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>IBAN:</label>
              <input
                type="text"
                value={bankConfig.iban}
                onChange={(e) => setBankConfig({...bankConfig, iban: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.setItem('bankConfig', JSON.stringify(bankConfig));
                  setShowBankSettings(false);
                }}
                style={{
                  backgroundColor: '#00695C',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                💾 Save Settings
              </button>
              <button
                onClick={() => setShowBankSettings(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator */}
      {showInvoiceGenerator && selectedClientForInvoice && (
        <InvoiceGenerator
          clientData={selectedClientForInvoice}
          onClose={() => {
            setShowInvoiceGenerator(false);
            setSelectedClientForInvoice(null);
            loadAvailableClients(); // Refresh client lists
          }}
          onInvoiceCreated={(invoice) => {
            loadInvoices();
            loadAvailableClients(); // Refresh client lists
            console.log('Invoice created:', invoice);
          }}
        />
      )}
    </div>
  );
};

export default InvoicesPage;