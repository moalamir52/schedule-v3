import React, { useState, useEffect } from 'react';
import InvoiceGenerator from '../components/InvoiceGenerator';
import InvoiceStats from '../components/invoices/InvoiceStats';
import ClientSummaryCard from '../components/invoices/ClientSummaryCard';
import InvoiceFilterBar from '../components/invoices/InvoiceFilterBar';
import InvoiceTable from '../components/invoices/InvoiceTable';
import BulkInvoiceModal from '../components/invoices/BulkInvoiceModal';
import PaymentMethodModal from '../components/invoices/PaymentMethodModal';
import ClientDetailsModal from '../components/invoices/ClientDetailsModal';
import CheckDuplicatesModal from '../components/invoices/CheckDuplicatesModal';
import InvoiceFormModal from '../components/invoices/InvoiceFormModal';
import OneTimeInvoiceModal from '../components/invoices/OneTimeInvoiceModal';
import BankSettingsModal from '../components/invoices/BankSettingsModal';
import VatSettingsModal from '../components/invoices/VatSettingsModal';
import PaymentStatusConfirmModal from '../components/invoices/PaymentStatusConfirmModal';
import ClientsPanelModal from '../components/invoices/ClientsPanelModal';
// Add CSS to hide number input spinners
const hideSpinnersStyle = `
  /* Hide Chrome, Safari, Edge, Opera spinners */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Hide Firefox spinners */
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;
// Inject the CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = hideSpinnersStyle;
  document.head.appendChild(styleElement);
}
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
    vehicleTypes: '',
    serves: '',
    amount: '',
    paymentStatus: 'pending',
    notes: '',
    serviceDate: new Date().toISOString().split('T')[0],
    selectedServices: []
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
    notes: '',
    selectedServices: []
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
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceCategory, setServiceCategory] = useState('all');
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesData, setDuplicatesData] = useState({ duplicates: [], summary: {} });
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  const [deletingDuplicates, setDeletingDuplicates] = useState(false);
  const [clientsSummary, setClientsSummary] = useState({ subscriptionClients: 0, oneTimeClients: 0, totalClients: 0 });
  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadAvailableClients();
    loadMonthlyStats();
    loadServices();
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
  // Recalculate stats when invoices or month filter changes
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      calculateStats(invoices);
      calculateClientsSummary(invoices, monthFilter);
      // Reload available clients after invoices are loaded
      loadAvailableClients();
    }
  }, [monthFilter, invoices]);
  const loadInvoices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/all`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          const invoiceData = data.invoices || [];

          setInvoices(invoiceData);
          // Force calculate stats immediately after setting invoices
          setTimeout(() => calculateStats(invoiceData), 100);
        }
      } else {
        setInvoices([]);
        setMonthlyStats({
          thisMonth: { total: 0, count: 0 },
          paid: { total: 0, count: 0 },
          pending: { total: 0, count: 0 },
          allTime: { total: 0, count: 0 }
        });
      }
    } catch (err) {
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

    // Helper to get representative date (priority: Service Start > Invoice Date > CreatedAt)
    const getInvoiceDate = (inv) => {
      const dateStr = inv.Start || inv.InvoiceDate || inv.CreatedAt;
      if (!dateStr) return null;

      // Handle DD/MM/YYYY
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
      }

      // Handle other formats (ISO, DD-MMM-YY, etc)
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    // Filter invoices for target month/year
    const monthInvoices = invoiceData.filter(invoice => {
      if (monthFilter === 'All') return true;

      const invoiceDate = getInvoiceDate(invoice);
      if (!invoiceDate) return false;

      const invoiceMonth = invoiceDate.getMonth() + 1;
      const invoiceYear = invoiceDate.getFullYear();

      if (monthFilter === 'Current') {
        return invoiceMonth === currentMonth && invoiceYear === currentYear;
      } else {
        // If a specific month is selected (1-12)
        const targetMonth = parseInt(monthFilter);
        return invoiceMonth === targetMonth && invoiceYear === currentYear;
      }
    });

    // Calculate monthly stats
    const monthTotal = monthInvoices.reduce((sum, inv) => sum + (parseFloat(inv.TotalAmount) || 0), 0);
    const monthCount = monthInvoices.length;

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
    // This function is kept for compatibility but stats are now calculated from invoices
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
    const totalAmount = oneTimeInvoiceData.selectedServices.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
    // Determine service category for subject
    const getServiceCategory = (services) => {
      const hasCarService = services.some(s =>
        s.name.toLowerCase().includes('clean car') || s.name.toLowerCase().includes('garage')
      );
      const hasHomeService = services.some(s =>
        s.name.toLowerCase().includes('exterior glass') ||
        s.name.toLowerCase().includes('facade') ||
        s.name.toLowerCase().includes('garden cleaning') ||
        s.name.toLowerCase().includes('house painting')
      );
      if (hasCarService && hasHomeService) {
        return 'Car & Home Services';
      } else if (hasCarService) {
        return 'Car Services';
      } else if (hasHomeService) {
        return 'Home Services';
      } else {
        return 'General Services';
      }
    };
    const tempClient = {
      name: oneTimeInvoiceData.clientName || 'Walk-in Customer',
      villa: oneTimeInvoiceData.villa || 'N/A',
      phone: oneTimeInvoiceData.phone || 'N/A',
      fee: totalAmount,
      washmanPackage: 'One-Time Service',
      typeOfCar: oneTimeInvoiceData.vehicleTypes || 'N/A',
      serves: oneTimeInvoiceData.selectedServices.map((s, index) => `${index + 1}. ${s.name} (AED ${s.price})`).join('\n'),
      subject: getServiceCategory(oneTimeInvoiceData.selectedServices),
      payment: oneTimeInvoiceData.paymentStatus,
      startDate: new Date().toLocaleDateString('en-GB'),
      isOneTime: true,
      selectedServices: oneTimeInvoiceData.selectedServices,
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
      vehicleTypes: '',
      serves: '',
      amount: '',
      paymentStatus: 'pending',
      notes: '',
      selectedServices: []
    });
  };
  const saveBankConfig = () => {
    localStorage.setItem('bankConfig', JSON.stringify(bankConfig));
    setShowBankSettings(false);
    setAlertMessage('Bank settings saved successfully');
    setShowAlert(true);
  };
  const saveVatRate = () => {
    localStorage.setItem('vatRate', vatRate.toString());
    setShowVatSettings(false);
    setAlertMessage(`VAT rate updated to ${vatRate}%`);
    setShowAlert(true);
  };
  const handleReprintInvoice = async (invoice) => {
    try {
      // Reload invoice data from server to get latest updates
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/all`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          // Find the updated invoice
          const updatedInvoice = data.invoices.find(inv =>
            inv.InvoiceID === invoice.InvoiceID || inv.Ref === invoice.Ref
          );
          if (updatedInvoice) {
            invoice = updatedInvoice; // Use updated data
          }
        }
      }
    } catch (error) {
    }
    // Find the customer data from the loaded customers list
    const customerData = customers.find(c => c.CustomerID === invoice.CustomerID);
    // Build serviceDate from Start and End columns
    let serviceDate = null;
    if (invoice.Start && invoice.End) {
      serviceDate = `${invoice.Start} - ${invoice.End}`;
    } else if (invoice.Start) {
      serviceDate = invoice.Start;
    }
    // Extract phone from Notes for one-time invoices, with fallback to customer data
    let phone = 'N/A';
    if (invoice.Notes && invoice.Notes.includes('Phone:')) {
      const phoneMatch = invoice.Notes.match(/Phone: ([^,]+)/);
      if (phoneMatch) phone = phoneMatch[1];
    }
    if (phone === 'N/A' && customerData?.Phone) {
      phone = customerData.Phone;
    }
    const clientDataForPrint = {
      name: customerData?.Name || invoice.CustomerName,
      villa: customerData?.Villa || invoice.Villa,
      phone: phone,
      fee: invoice.TotalAmount || customerData?.Fee,
      washmanPackage: invoice.PackageID || customerData?.Washman_Package || customerData?.Package || 'Standard Service',
      typeOfCar: invoice.Vehicle || customerData?.CarPlates || customerData?.TypeOfCar || 'N/A',
      serves: invoice.Services || customerData?.Serves || '',
      payment: invoice.Status === 'Paid' ? 'yes/cash' : 'pending',
      invoiceDate: invoice.InvoiceDate,
      serviceDate: serviceDate,
      startDate: invoice.Start,
      endDate: invoice.End,
      customerID: invoice.CustomerID,
      existingRef: invoice.Ref || invoice.InvoiceID,
      subject: invoice.Subject || customerData?.Serves || '',
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
      // Error handled silently
    }
  };
  const loadAvailableClients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/available`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          const serverAvailable = data.availableClients || [];
          const serverInvoiced = data.invoicedClients || [];

          setAvailableClients(serverAvailable);
          setInvoicedClients(serverInvoiced);
        }
      }
    } catch (err) {
      // Error handled silently
    }
  };
  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const [servicesRes, rulesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/services`),
        fetch(`${import.meta.env.VITE_API_URL}/api/wash-rules`)
      ]);

      let allServices = [];
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        allServices = (Array.isArray(servicesData) ? servicesData : []).map(s => ({ ...s, Category: 'service' }));
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        if (rulesData && rulesData.success && Array.isArray(rulesData.rules)) {
          const rulesAsServices = rulesData.rules.map((rule, idx) => ({
            ServiceID: `RULE-${idx}`,
            ServiceName: rule.name,
            Price: 0,
            Category: 'rule'
          }));
          allServices = [...allServices, ...rulesAsServices];
        }
      }

      setServices(allServices);
    } catch (err) {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const calculateClientsSummary = (invoiceData, selectedMonth) => {
    if (!invoiceData || !Array.isArray(invoiceData)) {
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Helper (redundant but scoped for now)
    const getInvoiceDate = (inv) => {
      const dateStr = inv.Start || inv.InvoiceDate || inv.CreatedAt;
      if (!dateStr) return null;
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    let filteredInvoices = invoiceData;

    if (selectedMonth !== 'All') {
      const targetMonth = selectedMonth === 'Current' ? currentMonth : parseInt(selectedMonth);
      filteredInvoices = invoiceData.filter(invoice => {
        const invoiceDate = getInvoiceDate(invoice);
        if (!invoiceDate) return false;

        const invoiceMonth = invoiceDate.getMonth() + 1;
        const invoiceYear = invoiceDate.getFullYear();
        return invoiceMonth === targetMonth && invoiceYear === currentYear;
      });
    }

    const subscriptionInvoices = filteredInvoices.filter(inv => inv.CustomerID && inv.CustomerID !== 'ONE_TIME');
    const oneTimeInvoices = filteredInvoices.filter(inv => inv.CustomerID === 'ONE_TIME');

    setClientsSummary({
      success: true,
      subscriptionClients: subscriptionInvoices.length,
      oneTimeClients: oneTimeInvoices.length,
      totalClients: filteredInvoices.length
    });
  };
  const createBulkInvoices = async () => {
    if (!availableClients || availableClients.length === 0) {
      setAlertMessage('No clients available for invoicing this month');
      setShowAlert(true);
      return;
    }

    // Use server-provided available clients list directly
    const clientsWithoutInvoices = availableClients || [];

    if (clientsWithoutInvoices.length === 0) {
      setAlertMessage('No clients available for invoicing');
      setShowAlert(true);
      return;
    }

    setBulkInvoiceProgress({ current: 0, total: clientsWithoutInvoices.length, isProcessing: true });
    let successCount = 0;
    let skipCount = 0;
    try {
      for (let i = 0; i < clientsWithoutInvoices.length; i++) {
        const client = clientsWithoutInvoices[i];
        setBulkInvoiceProgress({ current: i + 1, total: clientsWithoutInvoices.length, isProcessing: true });
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
            }
          }
        } catch (clientError) {
          skipCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setBulkInvoiceProgress({ current: 0, total: 0, isProcessing: false });
      setShowBulkInvoiceModal(false);
      loadInvoices();
      loadAvailableClients();
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
    try {
      console.log(`[Frontend] Updating invoice ${invoiceId} to status: ${status}, method: ${paymentMethod}`);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/update/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentMethod })
      });

      const data = await response.json();
      console.log(`[Frontend] Update response:`, data);

      if (response.ok) {
        setAlertMessage(`Invoice marked as ${status}${paymentMethod ? ` (${paymentMethod})` : ''}`);
        setShowAlert(true);
        loadInvoices();
        loadMonthlyStats();
      } else {
        setAlertMessage(`Failed to update: ${data.error || 'Unknown error'}`);
        setShowAlert(true);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setAlertMessage(`Error: ${err.message}`);
      setShowAlert(true);
    }
  };

  const handleUpdateInvoice = async (invoiceId, updatedData) => {
    try {
      const servicesStr = (updatedData.selectedServices || []).map((s, i) => `${i + 1}. ${s.name} (AED ${s.price})`).join('\n');

      const payload = {
        status: updatedData.Status,
        paymentMethod: updatedData.PaymentMethod,
        customerName: updatedData.CustomerName,
        villa: updatedData.Villa,
        totalAmount: updatedData.TotalAmount,
        packageId: updatedData.PackageID,
        vehicle: updatedData.Phone ? `Phone: ${updatedData.Phone}` : updatedData.Vehicle, // Fallback or mapping
        services: servicesStr,
        notes: updatedData.Notes,
        // If we want to support editing dates directly, we need more fields in the modal
        // but for now, we'll keep the existing ones
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/update/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage('Invoice updated successfully');
        setShowAlert(true);
        loadInvoices();
        loadMonthlyStats();
        return true;
      } else {
        const errorData = await response.json();
        setAlertMessage(`Failed to update invoice: ${errorData.error}`);
        setShowAlert(true);
        return false;
      }
    } catch (err) {
      setAlertMessage(`Error updating invoice: ${err.message}`);
      setShowAlert(true);
      return false;
    }
  };
  const deleteInvoice = async (invoiceId) => {
    setConfirmMessage('Are you sure you want to delete this invoice?');
    setConfirmCallback(() => async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/delete/${invoiceId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await loadInvoices();
          await loadAvailableClients();
          loadMonthlyStats();
        }
      } catch (err) {
        // Error handled silently
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
    }
  };
  const getFilteredInvoices = () => {
    if (!invoices || !Array.isArray(invoices)) {
      return [];
    }

    // Reuse helper logic
    const getInvoiceDate = (inv) => {
      const dateStr = inv.Start || inv.InvoiceDate || inv.CreatedAt;
      if (!dateStr) return null;
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm ||
        invoice.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.Villa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.InvoiceID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.CustomerID?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || invoice.Status === statusFilter;

      let matchesMonth = true;
      if (monthFilter !== 'All') {
        const invoiceDate = getInvoiceDate(invoice);
        if (invoiceDate) {
          const invoiceMonth = invoiceDate.getMonth() + 1;
          const invoiceYear = invoiceDate.getFullYear();
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();

          if (monthFilter === 'Current') {
            matchesMonth = invoiceMonth === currentMonth && invoiceYear === currentYear;
          } else {
            matchesMonth = invoiceMonth === parseInt(monthFilter) && invoiceYear === currentYear;
          }
        } else {
          matchesMonth = false;
        }
      }

      // Apply due today filter
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
            } else {
              const startDate = new Date(invoice.Start);
              if (!isNaN(startDate.getTime())) {
                serviceStartDay = startDate.getDate();
              }
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
          <button
            onClick={async () => {
              setLoadingDuplicates(true);
              try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/check-duplicates`);
                if (response.ok) {
                  const data = await response.json();
                  setDuplicatesData(data);
                  setShowDuplicatesModal(true);
                } else {
                  setAlertMessage('Failed to check for duplicates');
                  setShowAlert(true);
                }
              } catch (error) {
                setAlertMessage('Error checking duplicates: ' + error.message);
                setShowAlert(true);
              } finally {
                setLoadingDuplicates(false);
              }
            }}
            disabled={loadingDuplicates}
            style={{
              backgroundColor: loadingDuplicates ? '#6c757d' : '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              cursor: loadingDuplicates ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            {loadingDuplicates ? '⏳ Checking...' : '🔍 Check Duplicates'}
          </button>
        </div>
        {/* Search and Filter Bar */}
        <InvoiceFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          monthFilter={monthFilter}
          setMonthFilter={setMonthFilter}
          filteredCount={getFilteredInvoices().length}
        />

        {/* Clients Summary Card */}
        <ClientSummaryCard
          clientsSummary={clientsSummary}
          setSearchTerm={setSearchTerm}
          setStatusFilter={setStatusFilter}
          invoices={invoices}
        />

        {/* Monthly Stats Cards */}
        <InvoiceStats
          monthlyStats={monthlyStats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setStatusFilter={setStatusFilter}
        />

        {/* Invoices Table */}
        <InvoiceTable
          filteredInvoices={getFilteredInvoices()}
          isLoading={isLoading}
          onMarkAsPaid={(id) => {
            setPendingInvoiceId(id);
            setShowPaymentMethodModal(true);
          }}
          onMarkAsOverdue={(id) => updateInvoiceStatus(id, 'Overdue')}
          onEdit={(invoice) => {
            const customerData = customers.find(c => c.CustomerID === invoice.CustomerID);
            let selectedServices = [];
            if (invoice.Services) {
              const serviceLines = invoice.Services.split('\n');
              selectedServices = serviceLines.map(line => {
                const match = line.match(/^\d+\. (.+) \(AED (\d+)\)$/);
                if (match) return { name: match[1], price: match[2] };
                return { name: line, price: '' };
              }).filter(s => s.name.trim());
            }
            setEditingInvoice({
              ...invoice,
              Phone: customerData?.Phone || invoice.Phone || '',
              selectedServices
            });
          }}
          onPrint={handleReprintInvoice}
          onDelete={deleteInvoice}
          onViewClient={(invoice) => {
            setSelectedClientDetails(invoice);
            setShowClientDetails(true);
          }}
        />
        {/* Modals */}
        <BulkInvoiceModal
          show={showBulkInvoiceModal}
          onClose={() => setShowBulkInvoiceModal(false)}
          availableClients={availableClients}
          bulkInvoiceProgress={bulkInvoiceProgress}
          onCreateBulk={createBulkInvoices}
        />
        <InvoiceFormModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => {
            setSelectedClientForInvoice(data);
            setShowInvoiceGenerator(true);
            setShowCreateModal(false);
          }}
          customers={customers}
          services={services}
          loadingServices={loadingServices}
          serviceCategory={serviceCategory}
          setServiceCategory={setServiceCategory}
          invoiceData={newInvoice}
          setInvoiceData={setNewInvoice}
          invoices={invoices}
        />

        <OneTimeInvoiceModal
          show={showOneTimeInvoiceForm}
          onClose={() => setShowOneTimeInvoiceForm(false)}
          data={oneTimeInvoiceData}
          setData={setOneTimeInvoiceData}
          customers={customers}
          services={services}
          loadingServices={loadingServices}
          serviceCategory={serviceCategory}
          setServiceCategory={setServiceCategory}
          onSubmit={() => {
            const total = (oneTimeInvoiceData.selectedServices || []).reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
            const servicesStr = (oneTimeInvoiceData.selectedServices || []).map((s, i) => `${i + 1}. ${s.name} (AED ${s.price})`).join('\n');

            const clientData = {
              name: oneTimeInvoiceData.clientName || 'Walk-in Customer',
              villa: oneTimeInvoiceData.villa || 'N/A',
              phone: oneTimeInvoiceData.phone || 'N/A',
              fee: total,
              serves: servicesStr,
              payment: oneTimeInvoiceData.paymentStatus,
              vehicle: oneTimeInvoiceData.vehicleTypes || 'N/A',
              notes: oneTimeInvoiceData.notes,
              customerID: 'ONE_TIME',
              startDate: oneTimeInvoiceData.serviceDate || new Date().toLocaleDateString('en-GB'),
              invoiceDate: new Date().toISOString().split('T')[0],
              isOneTime: true
            };
            setSelectedClientForInvoice(clientData);
            setShowInvoiceGenerator(true);
            setShowOneTimeInvoiceForm(false);
          }}
        />

        {editingInvoice && (
          <InvoiceFormModal
            show={true}
            onClose={() => setEditingInvoice(null)}
            onSubmit={async (data) => {
              const targetId = editingInvoice.InvoiceID || editingInvoice.Ref;
              const success = await handleUpdateInvoice(targetId, editingInvoice);
              if (success) {
                setEditingInvoice(null);
                loadInvoices();
              }
            }}
            customers={customers}
            services={services}
            loadingServices={loadingServices}
            serviceCategory={serviceCategory}
            setServiceCategory={setServiceCategory}
            invoiceData={editingInvoice}
            setInvoiceData={setEditingInvoice}
            mode="edit"
          />
        )}
        <ClientsPanelModal
          show={showClientsPanel}
          onClose={() => setShowClientsPanel(false)}
          availableClients={availableClients}
          invoicedClients={invoicedClients}
          invoices={invoices}
          availableSearch={availableSearch}
          setAvailableSearch={setAvailableSearch}
          invoicedSearch={invoicedSearch}
          setInvoicedSearch={setInvoicedSearch}
          showDueOnly={showDueOnly}
          setShowDueOnly={setShowDueOnly}
          onCreateInvoice={(client) => {
            setShowPaymentConfirm(true);
            setPaymentClient(client);
          }}
          onReprintInvoice={(clientInvoice) => {
            handleReprintInvoice(clientInvoice);
            setShowClientsPanel(false);
          }}
          onEditInvoice={(enrichedInvoice) => {
            setEditingInvoice(enrichedInvoice);
            setShowClientsPanel(false);
          }}
        />
        <BankSettingsModal
          show={showBankSettings}
          onClose={() => setShowBankSettings(false)}
          bankConfig={bankConfig}
          setBankConfig={setBankConfig}
          onSave={saveBankConfig}
        />
        {/* Invoice Generator */}
        {
          showInvoiceGenerator && selectedClientForInvoice && (
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
              }}
            />
          )
        }
        {/* Custom Alert Modal */}
        {
          showAlert && (
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
          )
        }
        {/* Custom Confirm Modal */}
        {
          showConfirm && (
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
          )
        }
        <PaymentMethodModal
          show={showPaymentMethodModal}
          onClose={() => {
            setShowPaymentMethodModal(false);
            setPendingInvoiceId(null);
          }}
          onConfirm={(method) => {
            updateInvoiceStatus(pendingInvoiceId, 'Paid', method);
            setShowPaymentMethodModal(false);
            setPendingInvoiceId(null);
          }}
        />
        <VatSettingsModal
          show={showVatSettings}
          onClose={() => setShowVatSettings(false)}
          vatRate={vatRate}
          setVatRate={setVatRate}
          onSave={(rate) => {
            saveVatRate(rate);
            setShowVatSettings(false);
            setAlertMessage(`VAT rate set to ${rate}%`);
            setShowAlert(true);
          }}
        />
        <ClientDetailsModal
          show={showClientDetails}
          onClose={() => setShowClientDetails(false)}
          clientDetails={selectedClientDetails}
          customers={customers}
        />
        <CheckDuplicatesModal
          show={showDuplicatesModal}
          onClose={() => {
            setShowDuplicatesModal(false);
            setSelectedDuplicates([]);
          }}
          duplicatesData={duplicatesData}
          selectedDuplicates={selectedDuplicates}
          setSelectedDuplicates={setSelectedDuplicates}
          onDeleteSelected={async () => {
            if (window.confirm(`Are you sure you want to delete ${selectedDuplicates.length} selected invoices?`)) {
              setDeletingDuplicates(true);
              try {
                let successCount = 0;
                for (const invoiceId of selectedDuplicates) {
                  try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/delete/${invoiceId}`, {
                      method: 'DELETE'
                    });
                    if (response.ok) {
                      successCount++;
                    }
                  } catch (error) {
                    console.error(`Failed to delete ${invoiceId}:`, error);
                  }
                }

                setAlertMessage(`Successfully deleted ${successCount} out of ${selectedDuplicates.length} selected invoices`);
                setShowAlert(true);
                setSelectedDuplicates([]);

                // Refresh duplicates data
                const dupResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/check-duplicates`);
                if (dupResponse.ok) {
                  const newData = await dupResponse.json();
                  setDuplicatesData(newData);
                }

                // Refresh main invoice list
                loadInvoices();
                loadAvailableClients();
              } catch (error) {
                setAlertMessage('Error deleting selected invoices: ' + error.message);
                setShowAlert(true);
              } finally {
                setDeletingDuplicates(false);
              }
            }
          }}
          deletingDuplicates={deletingDuplicates}
        />

        <PaymentStatusConfirmModal
          show={showPaymentConfirm}
          onClose={() => {
            setShowPaymentConfirm(false);
            setPaymentClient(null);
          }}
          client={paymentClient}
          invoices={invoices}
          onConfirm={(clientData) => {
            setSelectedClientForInvoice(clientData);
            setShowInvoiceGenerator(true);
            setShowClientsPanel(false);
            setShowPaymentConfirm(false);
            setPaymentClient(null);
          }}
        />

      </div>
    </div>
  );
};

export default InvoicesPage;
