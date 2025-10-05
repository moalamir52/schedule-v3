import React, { useState } from 'react';
// import letterheadImage from '../assets/Letterhead.jpg';

const Letterhead = ({ children }) => {
  return (
    <div style={letterheadStyles.page} className="letterhead-page">
      <div style={letterheadStyles.content}>
        {children}
      </div>
    </div>
  );
};

const BankDetails = ({ bankConfig }) => {
  const defaultConfig = {
    accountHolderName: 'GLOGO PARKING CAR WASHING LLC,
    bankName: 'ENBD,
    accountNumber: '1015942086801',
    iban: 'AE390260001015942086801
  };
  
  const config = bankConfig || defaultConfig;
  
  return (
    <div style={styles.bankInfo}>
      <h3>Bank Details:</h3>
      <p><strong>Account Holder Name:</strong> {config.accountHolderName}</p>
      <p><strong>Bank Name:</strong> {config.bankName}</p>
      <p><strong>Account Number:</strong> {config.accountNumber}</p>
      <p><strong>IBAN:</strong> {config.iban}</p>
    </div>
  );
};

const Invoice = ({ invoiceData }) => {
  const {
    ref,
    date,
    customer,
    service,
    basePrice,
    isPaid
  } = invoiceData;

  const totalPrice = basePrice;
  const displayAmount = `AED ${basePrice}`;
  const displayTotal = isPaid ? 'PAID' : `AED ${totalPrice}`;

  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Letterhead>
      <h1 style={styles.header}>Tax Invoice</h1>
      
      <br />
      <br />
      <br />

      <div style={styles.dateRefRow}>
        <div style={styles.dateInfo}>
          <p>Date: {formattedDate}</p>
        </div>
        <div style={styles.refInfo}>
          <p>Ref: {ref}</p>
        </div>
      </div>
      
      <div style={styles.spacer}></div>

      {customer.addressLine1 && customer.addressLine1.trim() && (
        <div style={styles.customerInfo}>
          <p>{customer.addressLine1}</p>
        </div>
      )}

      <p style={styles.subject}>SUB: {service.subject}</p>

      <p>{service.packageId === 'One-Time Service' ? 'Thank you for using our car wash service.' : 'Thank you for subscribing to the monthly car wash service.'}</p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>No.</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Duration</th>
            <th style={styles.th}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{...styles.td, textAlign: 'center', verticalAlign: 'middle'}}>1</td>
            <td style={styles.td}>
              {customer.name && customer.name.trim() && (
                <>
                  <strong>Name:</strong> {customer.name}<br />
                </>
              )}
              <strong>Package ID:</strong> {service.packageId}<br />
              {service.serves && service.serves.trim() && service.serves !== service.packageId && (
                <>
                  <strong>Services:</strong> {service.serves}<br />
                </>
              )}
              {service.vehicleType && service.vehicleType.trim() && (
                <>
                  <strong>Vehicle:</strong> {service.vehicleType}<br />
                </>
              )}
              {service.packageId !== 'One-Time Service' && (
                <>
                  <strong>Start:</strong> {service.startDate}<br />
                  <strong>End:</strong> {service.endDate}
                </>
              )}
              {service.packageId === 'One-Time Service' && (
                <>
                  <strong>Date:</strong> {service.startDate}
                </>
              )}
            </td>
            <td style={{...styles.td, textAlign: 'center', verticalAlign: 'middle'}}>{service.packageId === 'One-Time Service' ? '1 Time' : service.duration}</td>
            <td style={{...styles.td, textAlign: 'center', verticalAlign: 'middle'}}>{displayAmount}</td>
          </tr>
          <tr>
            <td style={styles.emptyCell}></td>
            <td style={styles.emptyCell}></td>
            <td style={styles.totalLabelCell}>TOTAL:</td>
            <td style={{...styles.totalValueCell, color: isPaid ? '#28a745' : 'inherit'}}>{displayTotal}</td>
          </tr>
        </tbody>
      </table>

      <BankDetails bankConfig={invoiceData.bankConfig} />

      <div style={styles.footer}>
        <h3>General Conditions:</h3>
        <p>Terms: Payments are to be made in advance at the beginning of each month</p>
        <p>GLOGO car wash</p>
      </div>
    </Letterhead>
  );
};

const InvoiceGenerator = ({ clientData, onClose, onInvoiceCreated, existingRef, existingPaidStatus }) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState(null);
  const [isPaid, setIsPaid] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showRefConfirmDialog, setShowRefConfirmDialog] = useState(false);
  const [nextRefNumber, setNextRefNumber] = useState('');
  const [showBankSettings, setShowBankSettings] = useState(false);
  const [bankConfig, setBankConfig] = useState({
    accountHolderName: 'اسم صاحب الحساب',
    bankName: 'اسم البنك',
    accountNumber: 'رقم الحساب',
    iban: 'رقم الآيبان'
  });

  const previewRefNumber = () => {
    if (existingRef) return existingRef;
    
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const monthKey = `${year}${month}`;
    
    return `GLOGO-${monthKey}001`;
  };

  const generateRefNumber = async () => {
    if (existingRef || clientData.existingRef) return existingRef || clientData.existingRef;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/get-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerID: clientData.customerID || 'ONE_TIME',
          customerName: clientData.name || 'Walk-in Customer',
          villa: clientData.villa || 'N/A'
        })
      });
      const data = await response.json();
      return data.success ? data.invoiceNumber : nextRefNumber;
    } catch (error) {
      console.error('Error getting invoice number:', error);
      return nextRefNumber || previewRefNumber();
    }
  };

  const generateInvoiceData = () => {
    const today = new Date();
    const isOneTime = clientData.washmanPackage === 'One-Time Service';
    
    const invoiceDate = clientData.invoiceDate ? new Date(clientData.invoiceDate) : today;
    
    let startDateObj;
    if (clientData.startDate) {
      if (clientData.startDate.includes('/')) {
        const parts = clientData.startDate.split('/');
        if (parts.length === 3) {
          startDateObj = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          startDateObj = new Date(clientData.startDate);
        }
      } else {
        startDateObj = new Date(clientData.startDate);
      }
      
      if (isNaN(startDateObj.getTime())) {
        startDateObj = today;
      }
    } else {
      startDateObj = today;
    }
    
    // Calculate current month billing cycle
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), startDateObj.getDate());
    
    // If we passed this month's billing date, use current month, otherwise previous month
    if (today.getDate() < startDateObj.getDate()) {
      currentMonthStart.setMonth(currentMonthStart.getMonth() - 1);
    }
    
    const endDateObj = new Date(currentMonthStart);
    endDateObj.setDate(endDateObj.getDate() + 29);
    
    // Use current month cycle dates for invoice
    startDateObj = currentMonthStart;
    
    return {
      ref: isTestMode ? 'TEST-INVOICE' : confirmedRef,
      date: invoiceDate.toISOString().split('T')[0],
      customer: {
        name: clientData.name || '',
        addressLine1: clientData.villa || ''
      },
      service: {
        subject: 'Car Wash',
        packageId: clientData.washmanPackage,
        serves: clientData.serves || clientData.washmanPackage,
        vehicleType: clientData.typeOfCar || '',
        startDate: startDateObj.toLocaleDateString('en-GB'),
        endDate: isOneTime ? null : endDateObj.toLocaleDateString('en-GB'),
        duration: isOneTime ? '1 Time' : '30 days'
      },
      basePrice: parseInt(clientData.fee) || '',
      isPaid: isPaid,
      bankConfig: bankConfig
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const fileName = `Invoice_${confirmedRef}_${clientData.villa.replace(/\s+/g, '_')}`;
    const originalTitle = document.title;
    document.title = fileName;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  React.useEffect(() => {
    if ((existingRef || clientData.existingRef) && existingPaidStatus !== null) {
      setConfirmedRef(existingRef || clientData.existingRef);
      setIsPaid(existingPaidStatus);
      setShowInvoice(true);
    }
  }, [existingRef, existingPaidStatus, clientData.existingRef]);
  
  React.useEffect(() => {
    const savedBankConfig = localStorage.getItem('bankConfig');
    if (savedBankConfig) {
      setBankConfig(JSON.parse(savedBankConfig));
    }
  }, []);

  const handleRefConfirm = async () => {
    try {
      const actualRef = await generateRefNumber();
      
      // Save invoice to Google Sheets
      const isRegularCustomer = clientData.customerID && !clientData.customerID.startsWith('ONE_TIME');
      
      const invoiceData = isRegularCustomer ? {
        customerID: clientData.customerID,
        totalAmount: clientData.fee || 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
        notes: `Package: ${clientData.washmanPackage}, Vehicle: ${clientData.typeOfCar}`
      } : {
        ref: actualRef,
        clientName: clientData.name || 'Walk-in Customer',
        villa: clientData.villa || 'N/A',
        phone: clientData.phone || 'N/A',
        packageId: clientData.washmanPackage || 'One-Time Service',
        vehicleType: clientData.typeOfCar || 'N/A',
        serves: clientData.serves || 'One-time car wash service',
        amount: clientData.fee || 0,
        paymentStatus: clientData.payment || 'pending',
        startDate: clientData.startDate || new Date().toLocaleDateString('en-GB')
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save invoice');
      }
      
      setConfirmedRef(actualRef);
      setShowRefConfirmDialog(false);
      setIsTestMode(false);
      
      const paymentStatus = clientData.payment || 'pending';
      setIsPaid(paymentStatus.toLowerCase().includes('yes/'));
      
      if (onInvoiceCreated) {
        onInvoiceCreated({ ref: actualRef, clientName: clientData.name });
      }
      
      setShowInvoice(true);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    }
  };

  if (showRefConfirmDialog) {
    return (
      <div style={styles.modalBackdrop}>
        <div style={styles.modalContent}>
          <h3 style={{ color: '#548235', marginBottom: '1rem' }}>Confirm Invoice Number Reservation</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Invoice number will be reserved: <strong>{nextRefNumber}</strong><br/>
            This number cannot be used again.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={handleRefConfirm} style={styles.generateButton}>Confirm</button>
            <button onClick={() => setShowRefConfirmDialog(false)} style={styles.cancelButton}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (!showInvoice) {
    return (
      <div style={styles.modalBackdrop} onClick={onClose}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: '#548235', marginBottom: '1.5rem' }}>
            {existingRef ? 'Reprint Invoice' : 'Generate Invoice'}
          </h2>
          <div style={styles.clientPreview}>
            <p><strong>Client:</strong> {clientData.name}</p>
            <p><strong>Villa:</strong> {clientData.villa}</p>
            <p><strong>Package:</strong> {clientData.washmanPackage}</p>
            {clientData.serves && (
              <p><strong>Services:</strong> {clientData.serves}</p>
            )}
            <p><strong>Fee:</strong> AED {clientData.fee}</p>
            <p><strong>Payment Status:</strong> <span style={{color: (clientData.payment?.toLowerCase().includes('yes/') || isPaid) ? '#28a745' : '#ffc107'}}>{clientData.payment || (isPaid ? 'PAID' : 'Pending')}</span></p>
            {existingRef && (
              <p><strong>Invoice Date:</strong> {clientData.invoiceDate ? new Date(clientData.invoiceDate).toLocaleDateString('en-GB') : 'N/A'}</p>
            )}
          </div>
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => {
                setIsTestMode(true);
                setConfirmedRef('TEST-INVOICE');
                setIsPaid(clientData.payment?.toLowerCase().includes('yes/') || false);
                setShowInvoice(true);
              }}
              style={{...styles.generateButton, backgroundColor: '#ffc107', color: '#000'}}
            >
              🧪 Test Invoice (No Number)
            </button>
            <button 
              onClick={() => {
                setNextRefNumber(previewRefNumber());
                setShowRefConfirmDialog(true);
              }}
              style={styles.generateButton}
            >
              📄 Generate & Print Invoice
            </button>
            <button onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const invoiceData = generateInvoiceData();

  const handleSaveBankConfig = () => {
    localStorage.setItem('bankConfig', JSON.stringify(bankConfig));
    setShowBankSettings(false);
    alert('تم حفظ بيانات البنك بنجاح');
  };

  if (showBankSettings) {
    return (
      <div style={styles.bankModalBackdrop}>
        <div style={styles.bankModalContent}>
          <h3 style={{ color: '#00695C', marginBottom: '20px' }}>إعدادات بيانات البنك</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>اسم صاحب الحساب:</label>
            <input 
              type="text" 
              value={bankConfig.accountHolderName}
              onChange={(e) => setBankConfig({...bankConfig, accountHolderName: e.target.value})}
              style={styles.bankInput}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>اسم البنك:</label>
            <input 
              type="text" 
              value={bankConfig.bankName}
              onChange={(e) => setBankConfig({...bankConfig, bankName: e.target.value})}
              style={styles.bankInput}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رقم الحساب:</label>
            <input 
              type="text" 
              value={bankConfig.accountNumber}
              onChange={(e) => setBankConfig({...bankConfig, accountNumber: e.target.value})}
              style={styles.bankInput}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>رقم الآيبان:</label>
            <input 
              type="text" 
              value={bankConfig.iban}
              onChange={(e) => setBankConfig({...bankConfig, iban: e.target.value})}
              style={styles.bankInput}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleSaveBankConfig} style={styles.saveButton}>
              حفظ
            </button>
            <button onClick={() => setShowBankSettings(false)} style={styles.cancelButton}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modalBackdrop}>
      <style>
        {`
          @media print {
            .invoice-actions { display: none !important; }
            .modal-backdrop { background: none !important; position: static !important; }
            .invoice-modal { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; max-width: none !important; max-height: none !important; }
            body { margin: 0 !important; padding: 0 !important; }
            @page { size: A4; margin: 0; }
            html, body { height: 297mm !important; overflow: hidden !important; }
            .letterhead-page { height: 297mm !important; overflow: hidden !important; page-break-after: avoid !important; page-break-inside: avoid !important; }
          }
        `}
      </style>
      <div style={styles.invoiceModal} className="invoice-modal">
        <div style={styles.invoiceActions} className="invoice-actions">
          {isTestMode && (
            <div style={{...styles.testWarning, marginBottom: '10px'}}>
              🧪 TEST MODE - No invoice number reserved
            </div>
          )}
          <button onClick={handlePrint} style={styles.printButton}>
            🖨️ Print
          </button>
          <button onClick={handleExportPDF} style={styles.exportButton}>
            📄 Export PDF
          </button>
          <button onClick={onClose} style={styles.closeButton}>
            ✕ Close
          </button>
        </div>
        <Invoice invoiceData={invoiceData} />
      </div>
    </div>
  );
};

const letterheadStyles = {
  page: {
    width: '210mm',
    height: '297mm',
    backgroundColor: '#ffffff',
    border: '2px solid #00695C',
    backgroundSize: 'contain',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    padding: '80px 30px 20px 30px',
  },
};

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  invoiceModal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  invoiceActions: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  printButton: {
    backgroundColor: '#00695C',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  exportButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  clientPreview: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  generateButton: {
    backgroundColor: '#548235',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  header: {
    textAlign: 'center',
    textDecoration: 'underline',
    color: '#00695C',
    marginBottom: '20px',
  },
  dateRefRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  dateInfo: {
    textAlign: 'left',
  },
  refInfo: {
    textAlign: 'right',
  },
  spacer: {
    height: '5px',
    marginBottom: '5px',
  },
  customerInfo: {
    textAlign: 'left',
    marginBottom: '30px',
  },
  subject: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'center',
    backgroundColor: '#f2f2f2',
  },
  td: {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  emptyCell: {
    border: 'none',
  },
  totalLabelCell: {
    border: '1px solid #000',
    textAlign: 'center',
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
    padding: '8px',
  },
  totalValueCell: {
    border: '1px solid #000',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.1em',
    padding: '8px',
  },
  bankInfo: {
    marginTop: '20px',
    marginBottom: '10px',
    lineHeight: '1.1',
  },
  footer: {
    marginTop: '10px',
  },
  testWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px 16px',
    borderRadius: '5px',
    border: '1px solid #ffc107',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  bankButton: {
    backgroundColor: '#00695C',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  bankModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  bankModalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '400px',
    maxWidth: '90vw'
  },
  bankInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  saveButton: {
    backgroundColor: '#00695C',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
};

export default InvoiceGenerator;