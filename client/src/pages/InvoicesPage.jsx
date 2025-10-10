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
  const [monthFilter, setMonthFilter] = useState('All');
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
    paymentStatus: 'pending',
    paymentMethod: 'Cash',
    notes: ''
  });
  const [showBankSettings, setShowBankSettings] = useState(false);
  const [bankConfig, setBankConfig] = useState({
    accountHolderName: 'GLOGO PARKING CAR WASHING LLC',
    bankName: 'ENBD',
    accountNumber: '1015942086801',
    iban: 'AE390260001015942086801'
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentClient, setPaymentClient] = useState(null);
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);
  const [bulkInvoiceProgress, setBulkInvoiceProgress] = useState({ current: 0, total: 0, isProcessing: false });
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [pendingInvoiceId, setPendingInvoiceId] = useState(null);
  const [showVatSettings, setShowVatSettings] = useState(false);
  const [vatRate, setVatRate] = useState(0);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showDueToday, setShowDueToday] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState(null);

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
    
    // Load VAT rate from localStorage
    const savedVatRate = localStorage.getItem('vatRate');
    if (savedVatRate) {
      setVatRate(parseFloat(savedVatRate));
    }
  }, []);

  // Recalculate stats when month filter changes
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      calculateStats(invoices);
    }
  }, [monthFilter, invoices]);

  const loadInvoices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/all`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          setInvoices(data.invoices || []);
          calculateStats(data.invoices || []);
        }
      } else {
        console.error('Server error:', response.status);
        setInvoices([]);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (invoiceData) => {
    if (!invoiceData || !Array.isArray(invoiceData)) {
      return;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Determine which month to calculate stats for
    let targetMonth = currentMonth;
    if (monthFilter !== 'All' && monthFilter !== 'Current') {
      targetMonth = parseInt(monthFilter);
    }
    
    // Filter invoices for target month
    const monthInvoices = invoiceData.filter(invoice => {
      const dateField = invoice.InvoiceDate || invoice.CreatedAt;
      if (!dateField) return false;
      
      const invoiceDate = new Date(dateField);
      const invoiceMonth = invoiceDate.getMonth() + 1;
      const invoiceYear = invoiceDate.getFullYear();
      
      if (monthFilter === 'All') {
        return invoiceMonth === currentMonth && invoiceYear === currentYear;
      } else if (monthFilter === 'Current') {
        return invoiceMonth === currentMonth && invoiceYear === currentYear;
      } else {
        return invoiceMonth === targetMonth && invoiceYear === currentYear;
      }
    });
    
    // Calculate monthly stats
    const monthTotal = monthInvoices.reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    const monthCount = monthInvoices.length;
    
    // Filter month invoices by status
    const monthPaidInvoices = monthInvoices.filter(inv => inv.Status === 'Paid');
    const monthPendingInvoices = monthInvoices.filter(inv => inv.Status === 'Pending');
    
    const monthPaidTotal = monthPaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    const monthPendingTotal = monthPendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    const allTimeTotal = invoiceData.reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    
    setMonthlyStats({
      thisMonth: { total: monthTotal, count: monthCount },
      paid: { total: monthPaidTotal, count: monthPaidInvoices.length },
      pending: { total: monthPendingTotal, count: monthPendingInvoices.length },
      allTime: { total: allTimeTotal, count: invoiceData.length }
    });
  };

  const loadMonthlyStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object') {
          setMonthlyStats(data);
        }
      }
    } catch (err) {
      console.error('Failed to load monthly stats:', err);
    }
  };

  const handleOneTimeInvoice = async () => {
    // Get the highest GLOGO number from existing invoices
    let maxGlogoNumber = 2510041; // Start from base number
    invoices.forEach(invoice => {
      if (invoice.Ref && invoice.Ref.startsWith('GLOGO-')) {
        const match = invoice.Ref.match(/GLOGO-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxGlogoNumber) maxGlogoNumber = num;
        }
      }
    });
    
    const nextGlogoNumber = maxGlogoNumber + 1;
    
    const tempClient = {
      name: oneTimeInvoiceData.clientName || 'Walk-in Customer',
      villa: oneTimeInvoiceData.villa || 'N/A',
      phone: oneTimeInvoiceData.phone || 'N/A',
      fee: parseFloat(oneTimeInvoiceData.amount) || 0,
      washmanPackage: 'One-Time Service',
      typeOfCar: oneTimeInvoiceData.vehicleTypes || 'N/A',
      serves: oneTimeInvoiceData.serves || 'One-time car wash service',
      payment: oneTimeInvoiceData.paymentStatus,
      startDate: new Date().toLocaleDateString('en-GB'),
      isOneTime: true,
      nextInvoiceNumber: `GLOGO-${nextGlogoNumber}`
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
    // Build serviceDate from Start and End columns
    let serviceDate = null;
    if (invoice.Start && invoice.End) {
      serviceDate = `${invoice.Start} - ${invoice.End}`;
    } else if (invoice.Start) {
      serviceDate = invoice.Start;
    }
    
    // Extract phone from Notes for one-time invoices
    let phone = 'N/A';
    if (invoice.Notes && invoice.Notes.includes('Phone:')) {
      const phoneMatch = invoice.Notes.match(/Phone: ([^,]+)/);
      if (phoneMatch) phone = phoneMatch[1];
    }
    
    const clientDataForPrint = {
      name: invoice.CustomerName,
      villa: invoice.Villa,
      phone: phone,
      fee: invoice.TotalAmount,
      washmanPackage: invoice.PackageID || 'Standard Service',
      typeOfCar: invoice.Vehicle || 'N/A',
      serves: invoice.Services || invoice.PackageID || '',
      payment: invoice.Status === 'Paid' ? 'yes/cash' : 'pending',
      invoiceDate: invoice.InvoiceDate,
      serviceDate: serviceDate,
      customerID: invoice.CustomerID,
      existingRef: invoice.Ref || invoice.InvoiceID,
      isReprint: true
    };
    
    setSelectedClientForInvoice(clientDataForPrint);
    setShowInvoiceGenerator(true);
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadAvailableClients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/available`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          setAvailableClients(data.availableClients || []);
          setInvoicedClients(data.invoicedClients || []);
        }
      }
    } catch (err) {
      console.error('Failed to load available clients:', err);
    }
  };

  const createBulkInvoices = async () => {
    if (!availableClients || availableClients.length === 0) {
      setAlertMessage('No clients available for invoicing this month');
      setShowAlert(true);
      return;
    }

    setBulkInvoiceProgress({ current: 0, total: availableClients.length, isProcessing: true });
    
    let successCount = 0;
    let skipCount = 0;
    
    try {
      for (let i = 0; i < availableClients.length; i++) {
        const client = availableClients[i];
        setBulkInvoiceProgress({ current: i + 1, total: availableClients.length, isProcessing: true });
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerID: client.CustomerID,
              totalAmount: client.Fee,
              paymentStatus: 'pending',
              paymentMethod: '',
              notes: `Bulk invoice created for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
            })
          });
          
          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('already has an invoice')) {
              skipCount++;
              console.log(`Skipped ${client.Name} - already has invoice`);
            } else {
              console.error(`Failed to create invoice for ${client.Name}:`, errorData.error);
            }
          }
        } catch (clientError) {
          console.error(`Error creating invoice for ${client.Name}:`, clientError);
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setBulkInvoiceProgress({ current: 0, total: 0, isProcessing: false });
      setShowBulkInvoiceModal(false);
      loadInvoices();
      loadAvailableClients();
      loadMonthlyStats();
      
      let message = `Bulk invoice process completed!\n`;
      message += `✅ Created: ${successCount} invoices\n`;
      if (skipCount > 0) {
        message += `⏭️ Skipped: ${skipCount} (already have invoices)`;
      }
      
      setAlertMessage(message);
      setShowAlert(true);
    } catch (error) {
      setBulkInvoiceProgress({ current: 0, total: 0, isProcessing: false });
      setAlertMessage('Error creating bulk invoices: ' + error.message);
      setShowAlert(true);
    }
  };

  const createInvoice = () => {
    const selectedCustomer = customers.find(c => c.CustomerID === newInvoice.customerID);
    if (!selectedCustomer) {
      setAlertMessage('Please select a customer');
      setShowAlert(true);
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
      setConfirmMessage(`Customer ${selectedCustomer.Name} already has an invoice for this month (${existingInvoice.Ref || existingInvoice.InvoiceID}). Would you like to reprint the existing invoice instead?`);
      setConfirmCallback(() => () => {
        handleReprintInvoice(existingInvoice);
        setShowCreateModal(false);
      });
      setShowConfirm(true);
      return;
    }
    
    const clientData = {
      name: selectedCustomer.Name,
      villa: selectedCustomer.Villa,
      phone: selectedCustomer.Phone || 'N/A',
      fee: parseFloat(newInvoice.totalAmount) || selectedCustomer.Fee || 0,
      washmanPackage: selectedCustomer.Washman_Package || selectedCustomer.Package || 'Standard Package',
      typeOfCar: selectedCustomer.CarPlates || selectedCustomer.TypeOfCar || 'N/A',
      serves: selectedCustomer.Serves || '',
      payment: newInvoice.paymentStatus,
      paymentMethod: newInvoice.paymentMethod,
      startDate: selectedCustomer.Start_Date || new Date().toLocaleDateString('en-GB'),
      customerID: selectedCustomer.CustomerID,
      serviceDate: null // Will be calculated by backend
    };
    
    setSelectedClientForInvoice(clientData);
    setShowInvoiceGenerator(true);
    setShowCreateModal(false);
    setNewInvoice({ customerID: '', totalAmount: '', paymentStatus: 'pending', paymentMethod: 'Cash', notes: '' });
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
    setConfirmMessage('Are you sure you want to delete this invoice?');
    setConfirmCallback(() => async () => {
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
    });
    setShowConfirm(true);
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
    if (!invoices || !Array.isArray(invoices)) {
      return [];
    }
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.Villa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.InvoiceID?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || invoice.Status === statusFilter;
      
      let matchesMonth = true;
      if (monthFilter !== 'All') {
        const dateField = invoice.InvoiceDate || invoice.CreatedAt;
        if (dateField) {
          const invoiceDate = new Date(dateField);
          const invoiceMonth = invoiceDate.getMonth() + 1;
          const invoiceYear = invoiceDate.getFullYear();
          const currentYear = new Date().getFullYear();
          
          if (monthFilter === 'Current') {
            const currentMonth = new Date().getMonth() + 1;
            matchesMonth = invoiceMonth === currentMonth && invoiceYear === currentYear;
          } else {
            matchesMonth = invoiceMonth === parseInt(monthFilter) && invoiceYear === currentYear;
          }
        } else {
          matchesMonth = false;
        }
      }
      
      // Apply due today filter - only pending invoices with service start today or before
      let matchesDueToday = true;
      if (showDueToday) {
        if (invoice.Status !== 'Pending') {
          matchesDueToday = false;
        } else {
          const today = new Date();
          const todayDate = today.getDate();
          
          if (invoice.Start) {
            let serviceStartDay;
            if (invoice.Start.includes('/')) {
              const startParts = invoice.Start.split('/');
              if (startParts.length === 3) {
                serviceStartDay = parseInt(startParts[0]);
              }
            } else if (invoice.Start.includes('-')) {
              const startDate = new Date(invoice.Start);
              serviceStartDay = startDate.getDate();
            }
            matchesDueToday = serviceStartDay && serviceStartDay <= todayDate;
          } else {
            matchesDueToday = false;
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesMonth && matchesDueToday;
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
    padding: '16px 12px',
    textAlign: 'center',
    fontWeight: '600',
    color: 'white',
    borderBottom: '2px solid #dee2e6',
    fontSize: '16px',
    whiteSpace: 'nowrap'
  };

  const tableCellStyle = {
    padding: '16px 12px',
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: '14px',
    whiteSpace: 'nowrap'
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        padding: '20px 0',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(40, 167, 69, 0.3)'
      }}>
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '10px 15px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ← Back
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                margin: 0,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                📋 Invoice Management System
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1.1rem',
                margin: '5px 0 0 0',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}>
                Manage your invoices and billing efficiently
              </p>
            </div>
            
            <div></div>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px' }}>
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowClientsPanel(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            👥 Clients ({availableClients?.length || 0})
          </button>
          <button
            onClick={() => setShowOneTimeInvoiceForm(true)}
            style={{
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(253, 126, 20, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            ⚡ One-Time
          </button>
          <button
            onClick={() => setShowBulkInvoiceModal(true)}
            disabled={!availableClients || availableClients.length === 0}
            style={{
              backgroundColor: (!availableClients || availableClients.length === 0) ? '#6c757d' : '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: (!availableClients || availableClients.length === 0) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(111, 66, 193, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            📋 Bulk Invoices
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            + New Invoice
          </button>
          <button
            onClick={() => setShowVatSettings(true)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            📊 VAT Settings
          </button>
          <button
            onClick={() => {
              setShowDueToday(!showDueToday);
              if (!showDueToday) {
                setStatusFilter('Pending');
                setSearchTerm('');
              } else {
                setStatusFilter('All');
              }
            }}
            style={{
              backgroundColor: showDueToday ? '#28a745' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            📋 {showDueToday ? 'Show All' : 'Due Today'}
          </button>
        </div>
        
      {/* Search and Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginBottom: '20px',
        justifyContent: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by customer name, villa, or invoice ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '400px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            width: '200px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            width: '200px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="All">All Months</option>
          <option value="Current">Current Month</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <div style={{ fontSize: '14px', color: '#666', whiteSpace: 'nowrap' }}>
          Total: {getFilteredInvoices().length}
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            border: '2px solid #e8f5e8'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
          <h3 style={{ color: '#28a745', margin: '0 0 5px 0' }}>{monthlyStats?.thisMonth?.total || 0} AED</h3>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>This Month</p>
          <small style={{ color: '#666' }}>{monthlyStats?.thisMonth?.count || 0} invoices</small>
        </div>

        <div 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('Paid');
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            border: '2px solid #d4edda'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          <h3 style={{ color: '#28a745', margin: '0 0 5px 0' }}>{monthlyStats?.paid?.total || 0} AED</h3>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Paid</p>
          <small style={{ color: '#666' }}>{monthlyStats?.paid?.count || 0} invoices</small>
        </div>

        <div 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('Pending');
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            border: '2px solid #fff3cd'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ color: '#ffc107', margin: '0 0 5px 0' }}>{monthlyStats?.pending?.total || 0} AED</h3>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Pending</p>
          <small style={{ color: '#666' }}>{monthlyStats?.pending?.count || 0} invoices</small>
        </div>

        <div 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('All');
          }}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            border: '2px solid #e2e3f1'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <h3 style={{ color: '#6f42c1', margin: '0 0 5px 0' }}>{monthlyStats?.allTime?.total || 0} AED</h3>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Total</p>
          <small style={{ color: '#666' }}>{monthlyStats?.allTime?.count || 0} invoices</small>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading invoices...</div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '1400px', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#28a745' }}>
                  <th style={tableHeaderStyle}>#</th>
                  <th style={tableHeaderStyle}>Created</th>
                  <th style={tableHeaderStyle}>REF</th>
                  <th style={tableHeaderStyle}>Invoice ID</th>
                  <th style={tableHeaderStyle}>Customer</th>
                  <th style={tableHeaderStyle}>Villa</th>
                  <th style={tableHeaderStyle}>Amount</th>
                  <th style={tableHeaderStyle}>Service Start</th>
                  <th style={tableHeaderStyle}>Due Date</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Payment</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredInvoices().map((invoice, index) => (
                  <tr key={invoice.InvoiceID} style={{
                    backgroundColor: index % 2 === 0 ? '#f0f8f0' : '#e8f5e8',
                    borderBottom: '1px solid #c3e6c3'
                  }}>
                    <td style={tableCellStyle}>
                      <strong style={{ color: '#28a745', fontSize: '16px' }}>{index + 1}</strong>
                    </td>
                    <td style={tableCellStyle}>
                      {invoice.CreatedAt ? new Date(invoice.CreatedAt).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td style={tableCellStyle}>
                      <strong style={{ color: '#28a745' }}>{invoice.Ref || '-'}</strong>
                    </td>
                    <td style={tableCellStyle}>
                      <strong style={{ color: '#007bff' }}>{invoice.InvoiceID}</strong>
                    </td>
                    <td style={tableCellStyle}>
                      <span 
                        onClick={() => {
                          setSelectedClientDetails(invoice);
                          setShowClientDetails(true);
                        }}
                        style={{
                          cursor: 'pointer',
                          color: '#007bff',
                          textDecoration: 'underline'
                        }}
                      >
                        {invoice.CustomerName}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{invoice.Villa}</td>
                    <td style={tableCellStyle}>
                      <strong style={{ color: '#28a745' }}>AED {invoice.TotalAmount}</strong>
                    </td>
                    <td style={tableCellStyle}>
                      {invoice.Start || (invoice.InvoiceDate ? new Date(invoice.InvoiceDate).toLocaleDateString('en-GB') : '-')}
                    </td>
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
                                setPendingInvoiceId(invoice.InvoiceID);
                                setShowPaymentMethodModal(true);
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

      {/* Bulk Invoice Modal */}
      {showBulkInvoiceModal && (
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
            width: '500px',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#28a745' }}>📋 Create Bulk Invoices</h3>
            
            {!bulkInvoiceProgress.isProcessing ? (
              <>
                <div style={{ marginBottom: '20px', fontSize: '16px', color: '#666' }}>
                  This will create invoices for all available clients ({availableClients?.length || 0} clients) for the current month.
                </div>
                
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6'
                }}>
                  <strong>Month:</strong> {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}<br/>
                  <strong>Clients:</strong> {availableClients?.length || 0}<br/>
                  <strong>Status:</strong> All invoices will be created as "Pending"
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={createBulkInvoices}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    🚀 Create All Invoices
                  </button>
                  <button
                    onClick={() => setShowBulkInvoiceModal(false)}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                  Creating Invoices...
                </div>
                
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#e9ecef',
                    borderRadius: '10px',
                    height: '20px',
                    marginBottom: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: '#28a745',
                      height: '100%',
                      width: `${(bulkInvoiceProgress.current / bulkInvoiceProgress.total) * 100}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {bulkInvoiceProgress.current} / {bulkInvoiceProgress.total} invoices created
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {Math.round((bulkInvoiceProgress.current / bulkInvoiceProgress.total) * 100)}% complete
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Please wait while we create all invoices...
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                {(customers || []).map(customer => (
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
              <label>Payment Status:</label>
              <select
                value={newInvoice.paymentStatus || 'pending'}
                onChange={(e) => setNewInvoice({...newInvoice, paymentStatus: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="pending">⏳ Pending</option>
                <option value="PAID">✅ Paid</option>
              </select>
            </div>
            
            {newInvoice.paymentStatus === 'PAID' && (
              <div style={{ marginBottom: '15px' }}>
                <label>Payment Method:</label>
                <select
                  value={newInvoice.paymentMethod || 'Cash'}
                  onChange={(e) => setNewInvoice({...newInvoice, paymentMethod: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="Bank">🏦 Bank Transfer</option>
                </select>
              </div>
            )}
            
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Status</label>
                  <select
                    value={editingInvoice.Status || ''}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditingInvoice({
                        ...editingInvoice, 
                        Status: newStatus,
                        PaymentMethod: newStatus === 'Pending' ? '' : editingInvoice.PaymentMethod
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Paid">✅ Paid</option>
                    <option value="Overdue">❌ Overdue</option>
                  </select>
                </div>
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
                          status: editingInvoice.Status,
                          paymentMethod: editingInvoice.Status === 'Pending' ? '' : editingInvoice.PaymentMethod,
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
                  ✅ Available for Invoice ({availableClients?.filter(client => 
                    client.Name?.toLowerCase().includes(availableSearch.toLowerCase()) ||
                    client.Villa?.toLowerCase().includes(availableSearch.toLowerCase())
                  ).length || 0})
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
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button
                    onClick={() => setShowDueOnly(!showDueOnly)}
                    style={{
                      backgroundColor: showDueOnly ? '#28a745' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📅 {showDueOnly ? 'Show All' : 'Due Today'}
                  </button>
                </div>
                <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                  {(availableClients || []).filter(client => {
                    const today = new Date().getDate();
                    const matchesSearch = client.Name?.toLowerCase().includes(availableSearch.toLowerCase()) ||
                      client.Villa?.toLowerCase().includes(availableSearch.toLowerCase());
                    if (!showDueOnly) return matchesSearch;
                    if (!client.Start_Date) return false;
                    const startDay = parseInt(client.Start_Date.split('/')[0]);
                    return matchesSearch && startDay <= today;
                  }).map(client => (
                    <div key={client.CustomerID} style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>{client.Name}</strong>
                        {(() => {
                          const today = new Date().getDate();
                          const startDay = client.Start_Date ? parseInt(client.Start_Date.split('/')[0]) : null;
                          const isDue = startDay && startDay <= today;
                          return isDue ? <span style={{ color: '#dc3545', fontSize: '12px', marginLeft: '5px' }}>📅 DUE</span> : null;
                        })()}
                        <br/>
                        <small style={{ color: '#666' }}>Villa: {client.Villa} | Fee: AED {client.Fee}</small>
                        {client.Start_Date && <><br/><small style={{ color: '#17a2b8' }}>Start: Day {client.Start_Date.split('/')[0]}</small></>}
                      </div>
                      <button
                        onClick={() => {
                          setShowPaymentConfirm(true);
                          setPaymentClient(client);
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
                  {(availableClients || []).filter(client => 
                    client.Name?.toLowerCase().includes(availableSearch.toLowerCase()) ||
                    client.Villa?.toLowerCase().includes(availableSearch.toLowerCase())
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
                  📝 Already Invoiced ({invoicedClients?.filter(client => 
                    client.Name?.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                    client.Villa?.toLowerCase().includes(invoicedSearch.toLowerCase())
                  ).length || 0})
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
                  {(invoicedClients || []).filter(client => 
                    client.Name?.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                    client.Villa?.toLowerCase().includes(invoicedSearch.toLowerCase())
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
                  {(invoicedClients || []).filter(client => 
                    client.Name?.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                    client.Villa?.toLowerCase().includes(invoicedSearch.toLowerCase())
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
          bankConfig={bankConfig}
          vatRate={vatRate}
          existingRef={selectedClientForInvoice?.existingRef}
          existingPaidStatus={selectedClientForInvoice?.payment === 'yes/cash' || selectedClientForInvoice?.payment === 'yes/bank' || selectedClientForInvoice?.payment === 'paid'}
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

      {/* Custom Alert Modal */}
      {showAlert && (
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
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '300px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '20px', fontSize: '16px' }}>
              {alertMessage}
            </div>
            <button
              onClick={() => setShowAlert(false)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {showConfirm && (
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
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '350px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '25px', fontSize: '16px', lineHeight: '1.5' }}>
              {confirmMessage}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  if (confirmCallback) confirmCallback();
                  setShowConfirm(false);
                  setConfirmCallback(null);
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmCallback(null);
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
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
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '350px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: 'bold' }}>
              💰 Payment Method
            </div>
            <div style={{ marginBottom: '20px', fontSize: '16px', color: '#666' }}>
              How was this invoice paid?
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  updateInvoiceStatus(pendingInvoiceId, 'Paid', 'Cash');
                  setShowPaymentMethodModal(false);
                  setPendingInvoiceId(null);
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                💵 Cash
              </button>
              <button
                onClick={() => {
                  updateInvoiceStatus(pendingInvoiceId, 'Paid', 'Bank');
                  setShowPaymentMethodModal(false);
                  setPendingInvoiceId(null);
                }}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🏦 Bank
              </button>
              <button
                onClick={() => {
                  setShowPaymentMethodModal(false);
                  setPendingInvoiceId(null);
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAT Settings Modal */}
      {showVatSettings && (
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
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: 'bold' }}>
              📊 VAT Settings
            </div>
            <div style={{ marginBottom: '20px', fontSize: '16px', color: '#666' }}>
              Set the VAT rate for all invoices
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>VAT Rate (%):</label>
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                style={{
                  width: '100px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  textAlign: 'center'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.setItem('vatRate', vatRate.toString());
                  setShowVatSettings(false);
                  setAlertMessage(`VAT rate set to ${vatRate}%`);
                  setShowAlert(true);
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowVatSettings(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {showClientDetails && selectedClientDetails && (
        <div 
          onClick={() => setShowClientDetails(false)}
          style={{
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
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              width: '700px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #28a745',
              paddingBottom: '10px'
            }}>
              <h3 style={{ color: '#28a745', margin: 0 }}>👤 Client Complete Details</h3>
              <button
                onClick={() => setShowClientDetails(false)}
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

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Basic Info Section */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{ color: '#28a745', margin: '0 0 15px 0' }}>📋 Basic Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Name:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedClientDetails.CustomerName}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Villa:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedClientDetails.Villa}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Phone:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        // Extract phone from Notes for one-time invoices
                        if (selectedClientDetails.Notes && selectedClientDetails.Notes.includes('Phone:')) {
                          const phoneMatch = selectedClientDetails.Notes.match(/Phone: ([^,]+)/);
                          if (phoneMatch) return phoneMatch[1];
                        }
                        // Get phone from customer data
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        return customerData?.Phone || 'N/A';
                      })()} 
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Customer ID:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', color: '#007bff' }}>{selectedClientDetails.CustomerID || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Service Package & Vehicle Info */}
              <div style={{
                backgroundColor: '#e7f3ff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #b3d9ff'
              }}>
                <h4 style={{ color: '#007bff', margin: '0 0 15px 0' }}>🚗 Vehicle & Package Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Package/Service:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        return customerData?.Washman_Package || customerData?.Package || selectedClientDetails.PackageID || 'Standard Service';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Vehicle Type:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        return customerData?.CarPlates || customerData?.TypeOfCar || selectedClientDetails.Vehicle || 'N/A';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Services (Serves):</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        return customerData?.Serves || selectedClientDetails.Services || 'N/A';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Number of Cars:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        if (customerData?.CarPlates) {
                          return customerData.CarPlates.split(',').length;
                        }
                        return '1';
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule & Timing */}
              <div style={{
                backgroundColor: '#fff3cd',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <h4 style={{ color: '#856404', margin: '0 0 15px 0' }}>📅 Schedule & Timing</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Service Start Date:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        return customerData?.Start_Date || selectedClientDetails.Start || '-';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Service End Date:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {(() => {
                        const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                        return customerData?.End_Date || selectedClientDetails.End || '-';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Due Date:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedClientDetails.DueDate || '-'}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Service Schedule:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {selectedClientDetails.Start && selectedClientDetails.End ? 
                        `${selectedClientDetails.Start} - ${selectedClientDetails.End}` : 
                        selectedClientDetails.Start || 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice & Payment Info */}
              <div style={{
                backgroundColor: '#d4edda',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <h4 style={{ color: '#155724', margin: '0 0 15px 0' }}>💰 Invoice & Payment Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Invoice ID:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', color: '#007bff' }}>{selectedClientDetails.InvoiceID}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>REF Number:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px', color: '#28a745' }}>{selectedClientDetails.Ref || '-'}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Amount:</label>
                    <p style={{ margin: '5px 0', fontSize: '18px', color: '#28a745', fontWeight: 'bold' }}>AED {selectedClientDetails.TotalAmount}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Status:</label>
                    <p style={{ 
                      margin: '5px 0', 
                      fontSize: '16px',
                      color: selectedClientDetails.Status === 'Paid' ? '#28a745' : selectedClientDetails.Status === 'Pending' ? '#ffc107' : '#dc3545',
                      fontWeight: 'bold'
                    }}>{selectedClientDetails.Status}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Payment Method:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>{selectedClientDetails.PaymentMethod || '-'}</p>
                  </div>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#666' }}>Created Date:</label>
                    <p style={{ margin: '5px 0', fontSize: '16px' }}>
                      {selectedClientDetails.CreatedAt ? new Date(selectedClientDetails.CreatedAt).toLocaleDateString('en-GB') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Customer Info */}
              {(() => {
                const customerData = customers.find(c => c.CustomerID === selectedClientDetails.CustomerID);
                if (customerData) {
                  return (
                    <div style={{
                      backgroundColor: '#f3e5f5',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '1px solid #e1bee7'
                    }}>
                      <h4 style={{ color: '#6a1b9a', margin: '0 0 15px 0' }}>📊 Additional Customer Info</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {customerData.Fee && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#666' }}>Monthly Fee:</label>
                            <p style={{ margin: '5px 0', fontSize: '16px' }}>AED {customerData.Fee}</p>
                          </div>
                        )}
                        {customerData.Payment && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#666' }}>Payment Status:</label>
                            <p style={{ margin: '5px 0', fontSize: '16px' }}>{customerData.Payment}</p>
                          </div>
                        )}
                        {customerData.Location && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#666' }}>Location:</label>
                            <p style={{ margin: '5px 0', fontSize: '16px' }}>{customerData.Location}</p>
                          </div>
                        )}
                        {customerData.Email && (
                          <div>
                            <label style={{ fontWeight: 'bold', color: '#666' }}>Email:</label>
                            <p style={{ margin: '5px 0', fontSize: '16px' }}>{customerData.Email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Notes Section */}
              {selectedClientDetails.Notes && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4 style={{ color: '#6c757d', margin: '0 0 10px 0' }}>📝 Notes</h4>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px', 
                    lineHeight: '1.5'
                  }}>{selectedClientDetails.Notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Confirm Modal */}
      {showPaymentConfirm && paymentClient && (
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
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ marginBottom: '25px', fontSize: '18px', fontWeight: 'bold' }}>
              💰 Payment Status
            </div>
            <div style={{ marginBottom: '20px', fontSize: '16px', color: '#666' }}>
              {paymentClient.Name} - {paymentClient.Villa}<br/>
              Amount: AED {paymentClient.Fee}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  // Check if customer already has invoice this month
                  const currentMonth = new Date().getMonth() + 1;
                  const currentYear = new Date().getFullYear();
                  const existingInvoice = invoices.find(invoice => {
                    const dateField = invoice.InvoiceDate || invoice.CreatedAt;
                    if (!dateField) return false;
                    
                    const invoiceDate = new Date(dateField);
                    const invoiceMonth = invoiceDate.getMonth() + 1;
                    const invoiceYear = invoiceDate.getFullYear();
                    
                    return invoice.CustomerID === paymentClient.CustomerID && 
                           invoiceMonth === currentMonth && 
                           invoiceYear === currentYear;
                  });
                  
                  if (existingInvoice) {
                    setAlertMessage(`Customer ${paymentClient.Name} already has an invoice for this month (${existingInvoice.Ref || existingInvoice.InvoiceID})`);
                    setShowAlert(true);
                    setShowPaymentConfirm(false);
                    setPaymentClient(null);
                    return;
                  }
                  
                  const clientData = {
                    name: paymentClient.Name,
                    villa: paymentClient.Villa,
                    phone: paymentClient.Phone || 'N/A',
                    fee: paymentClient.Fee || 0,
                    washmanPackage: paymentClient.Washman_Package || paymentClient.Package || 'Standard Package',
                    typeOfCar: paymentClient.CarPlates || paymentClient.TypeOfCar || 'N/A',
                    serves: paymentClient.Serves || '',
                    payment: 'PAID',
                    paymentMethod: 'Cash',
                    startDate: paymentClient.Start_Date || new Date().toLocaleDateString('en-GB'),
                    customerID: paymentClient.CustomerID
                  };
                  setSelectedClientForInvoice(clientData);
                  setShowInvoiceGenerator(true);
                  setShowClientsPanel(false);
                  setShowPaymentConfirm(false);
                  setPaymentClient(null);
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                💵 Paid Cash
              </button>
              <button
                onClick={() => {
                  // Check if customer already has invoice this month
                  const currentMonth = new Date().getMonth() + 1;
                  const currentYear = new Date().getFullYear();
                  const existingInvoice = invoices.find(invoice => {
                    const dateField = invoice.InvoiceDate || invoice.CreatedAt;
                    if (!dateField) return false;
                    
                    const invoiceDate = new Date(dateField);
                    const invoiceMonth = invoiceDate.getMonth() + 1;
                    const invoiceYear = invoiceDate.getFullYear();
                    
                    return invoice.CustomerID === paymentClient.CustomerID && 
                           invoiceMonth === currentMonth && 
                           invoiceYear === currentYear;
                  });
                  
                  if (existingInvoice) {
                    setAlertMessage(`Customer ${paymentClient.Name} already has an invoice for this month (${existingInvoice.Ref || existingInvoice.InvoiceID})`);
                    setShowAlert(true);
                    setShowPaymentConfirm(false);
                    setPaymentClient(null);
                    return;
                  }
                  
                  const clientData = {
                    name: paymentClient.Name,
                    villa: paymentClient.Villa,
                    phone: paymentClient.Phone || 'N/A',
                    fee: paymentClient.Fee || 0,
                    washmanPackage: paymentClient.Washman_Package || paymentClient.Package || 'Standard Package',
                    typeOfCar: paymentClient.CarPlates || paymentClient.TypeOfCar || 'N/A',
                    serves: paymentClient.Serves || '',
                    payment: 'PAID',
                    paymentMethod: 'Bank',
                    startDate: paymentClient.Start_Date || new Date().toLocaleDateString('en-GB'),
                    customerID: paymentClient.CustomerID
                  };
                  setSelectedClientForInvoice(clientData);
                  setShowInvoiceGenerator(true);
                  setShowClientsPanel(false);
                  setShowPaymentConfirm(false);
                  setPaymentClient(null);
                }}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🏦 Paid Bank
              </button>
              <button
                onClick={() => {
                  // Check if customer already has invoice this month
                  const currentMonth = new Date().getMonth() + 1;
                  const currentYear = new Date().getFullYear();
                  const existingInvoice = invoices.find(invoice => {
                    const dateField = invoice.InvoiceDate || invoice.CreatedAt;
                    if (!dateField) return false;
                    
                    const invoiceDate = new Date(dateField);
                    const invoiceMonth = invoiceDate.getMonth() + 1;
                    const invoiceYear = invoiceDate.getFullYear();
                    
                    return invoice.CustomerID === paymentClient.CustomerID && 
                           invoiceMonth === currentMonth && 
                           invoiceYear === currentYear;
                  });
                  
                  if (existingInvoice) {
                    setAlertMessage(`Customer ${paymentClient.Name} already has an invoice for this month (${existingInvoice.Ref || existingInvoice.InvoiceID})`);
                    setShowAlert(true);
                    setShowPaymentConfirm(false);
                    setPaymentClient(null);
                    return;
                  }
                  
                  const clientData = {
                    name: paymentClient.Name,
                    villa: paymentClient.Villa,
                    phone: paymentClient.Phone || 'N/A',
                    fee: paymentClient.Fee || 0,
                    washmanPackage: paymentClient.Washman_Package || paymentClient.Package || 'Standard Package',
                    typeOfCar: paymentClient.CarPlates || paymentClient.TypeOfCar || 'N/A',
                    serves: paymentClient.Serves || '',
                    payment: 'pending',
                    paymentMethod: '',
                    startDate: paymentClient.Start_Date || new Date().toLocaleDateString('en-GB'),
                    customerID: paymentClient.CustomerID
                  };
                  setSelectedClientForInvoice(clientData);
                  setShowInvoiceGenerator(true);
                  setShowClientsPanel(false);
                  setShowPaymentConfirm(false);
                  setPaymentClient(null);
                }}
                style={{
                  backgroundColor: '#ffc107',
                  color: 'black',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ⏳ Pending
              </button>
              <button
                onClick={() => {
                  setShowPaymentConfirm(false);
                  setPaymentClient(null);
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default InvoicesPage;