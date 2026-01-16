import React, { useState, useEffect } from 'react';
import letterheadImage from '../assets/Letterhead.jpg';

// Simple date parser for frontend
const parseFrontendDate = (str) => {
    if (!str) return new Date();
    if (str instanceof Date) return str;
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
        // Assume DD/MM/YYYY or YYYY/MM/DD
        if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(str);
};

const formatFrontendDate = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const getDaysDifference = (startStr, endStr) => {
    if (!startStr || !endStr) return null;
    try {
        const start = parseFrontendDate(startStr);
        const end = parseFrontendDate(endStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        const diffTime = end.getTime() - start.getTime();
        return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
    } catch (e) {
        return null;
    }
};

const Letterhead = ({ children }) => {
    return (
        <div
            style={{
                ...letterheadStyles.page,
                backgroundImage: `url(${letterheadImage})`
            }}
            className="letterhead-page"
        >
            <div style={letterheadStyles.content}>
                {children}
            </div>
        </div>
    );
};

const BankDetails = ({ bankConfig }) => {
    const defaultConfig = {
        accountHolderName: 'GLOGO PARKING CAR WASHING LLC',
        bankName: 'ENBD',
        accountNumber: '1015942086801',
        iban: 'AE390260001015942086801'
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
        isPaid,
        vat = 0
    } = invoiceData;
    const subtotal = basePrice;
    const vatAmount = (subtotal * (vat || 0)) / 100;
    const totalPrice = subtotal + vatAmount;
    const displaySubtotal = `AED ${subtotal}`;
    const displayVat = `AED ${vatAmount.toFixed(2)}`;
    const displayTotal = isPaid ? 'PAID' : `AED ${totalPrice.toFixed(2)}`;
    const formattedDate = parseFrontendDate(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const generateSmartSubject = (packageId, serves, vehicleType) => {
        const text = `${packageId || ''} ${serves || ''} ${vehicleType || ''}`.toLowerCase();
        if (text.includes('car') || text.includes('wash') || text.includes('vehicle') ||
            text.includes('ext') || text.includes('int') || text.includes('exterior') ||
            text.includes('interior') || text.includes('sedan') || text.includes('suv') ||
            text.includes('mercedes') || text.includes('bmw') || text.includes('audi') ||
            text.includes('garage') || text.includes('parking') ||
            packageId?.includes('Ext') || packageId?.includes('INT')) {
            return `🚗 Car Wash Service`;
        }
        if (text.includes('house') || text.includes('home') || text.includes('cleaning') ||
            text.includes('منزل') || text.includes('تنظيف')) {
            return `🏠 House Cleaning Service`;
        }
        if (text.includes('garden') || text.includes('landscape') ||
            text.includes('حديقة') || text.includes('زراعة')) {
            return `🌿 Garden Service`;
        }
        if (text.includes('pool') || text.includes('swimming') || text.includes('مسبح')) {
            return `🏊 Pool Service`;
        }
        if (packageId?.toLowerCase().includes('ext') || packageId?.toLowerCase().includes('int')) {
            return `🚗 Car Wash Service`;
        }
        return '🔧 Service';
    };

    return (
        <Letterhead>
            <h1 style={styles.header}>Tax Invoice</h1>
            <br /><br /><br />
            <div style={styles.dateRefRow}>
                {date && (
                    <div style={styles.dateInfo}>
                        <p>Date: {formattedDate}</p>
                    </div>
                )}
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
            <p style={styles.subject}>SUB: {generateSmartSubject(service.packageId, service.serves, service.vehicleType)}</p>
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
                        <td style={{ ...styles.td, textAlign: 'center', verticalAlign: 'middle' }}>1</td>
                        <td style={styles.td}>
                            {customer.name && customer.name.trim() && (
                                <><strong>Name:</strong> {customer.name}<br /></>
                            )}
                            <strong>Package ID:</strong> {service.packageId}<br />
                            {service.serves && service.serves.trim() && service.serves !== service.packageId && (
                                <>
                                    <strong>Services:</strong><br />
                                    {service.serves.split('\n').map((line, index) => (
                                        <span key={index}>{line}<br /></span>
                                    ))}
                                </>
                            )}
                            {service.vehicleType && service.vehicleType.trim() && service.vehicleType !== 'N/A' && (
                                <><strong>Vehicle:</strong> {service.vehicleType}<br /></>
                            )}
                            {service.packageId !== 'One-Time Service' && (
                                <>
                                    <strong>Start:</strong> {service.startDate}<br />
                                    {service.endDate && <><strong>End:</strong> {service.endDate}</>}
                                </>
                            )}
                            {service.packageId === 'One-Time Service' && (
                                <><strong>Date:</strong> {service.startDate}</>
                            )}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center', verticalAlign: 'middle' }}>
                            {invoiceData.duration}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center', verticalAlign: 'middle' }}>{displaySubtotal}</td>
                    </tr>
                    <tr>
                        <td style={styles.emptyCell}></td>
                        <td style={styles.emptyCell}></td>
                        <td style={styles.totalLabelCell}>Subtotal</td>
                        <td style={styles.totalValueCell}>{displaySubtotal}</td>
                    </tr>
                    <tr>
                        <td style={styles.emptyCell}></td>
                        <td style={styles.emptyCell}></td>
                        <td style={styles.totalLabelCell}>VAT</td>
                        <td style={styles.totalValueCell}>{displayVat}</td>
                    </tr>
                    <tr>
                        <td style={styles.emptyCell}></td>
                        <td style={styles.emptyCell}></td>
                        <td style={{ ...styles.totalLabelCell, backgroundColor: isPaid ? '#28a745' : '#6c757d', color: 'white', fontWeight: 'bold' }}>TOTAL</td>
                        <td style={{ ...styles.totalValueCell, backgroundColor: isPaid ? '#28a745' : '#6c757d', color: 'white', fontWeight: 'bold', fontSize: '1.2em' }}>{displayTotal}</td>
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

const InvoiceGenerator = ({ clientData, onClose, onInvoiceCreated, existingRef, existingPaidStatus, bankConfig: propBankConfig, vatRate: propVatRate }) => {
    const [showInvoice, setShowInvoice] = useState(false);
    const [confirmedRef, setConfirmedRef] = useState(null);
    const [isPaid, setIsPaid] = useState(null);
    const [isTestMode, setIsTestMode] = useState(false);
    const [showRefConfirmDialog, setShowRefConfirmDialog] = useState(false);
    const [nextRefNumber, setNextRefNumber] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const isOneTime = clientData.washmanPackage === 'One-Time Service' || clientData.isOneTime;

    // Duration and Price States
    const calculatedDuration = getDaysDifference(clientData.startDate, clientData.endDate);
    const initialDays = parseInt(clientData.duration) ||
        calculatedDuration ||
        (clientData.washmanPackage === 'One-Time Service' ? 1 : 30);
    const [durationDays, setDurationDays] = useState(initialDays);
    const [customFee, setCustomFee] = useState(parseInt(clientData.fee) || 0);
    const [lastFee, setLastFee] = useState(parseInt(clientData.fee) || 0);

    const [bankConfig, setBankConfig] = useState({
        accountHolderName: 'GLOGO PARKING CAR WASHING LLC',
        bankName: 'ENBD',
        accountNumber: '1015942086801',
        iban: 'AE390260001015942086801'
    });
    const [vatRate, setVatRate] = useState(0);

    // Dynamic fee re-calculation (pro-rated)
    useEffect(() => {
        if (durationDays !== initialDays) {
            // Pro-rate based on initial month fee
            const baseMonthlyFee = parseInt(clientData.fee) || 0;
            const proRated = Math.round((baseMonthlyFee / 30) * durationDays);
            setCustomFee(proRated);
        } else {
            setCustomFee(parseInt(clientData.fee) || 0);
        }
    }, [durationDays, clientData.fee, initialDays]);

    const previewRefNumber = async () => {
        if (existingRef) return existingRef;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices/get-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerID: clientData.customerID || 'ONE_TIME',
                    customerName: clientData.name || 'Walk-in Customer',
                    villa: clientData.villa || 'N/A',
                    preview: true
                })
            });
            const data = await response.json();
            return data.success ? data.invoiceNumber : 'GLOGO-PREVIEW';
        } catch (error) {
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            return `GLOGO-${year}${month}XXX`;
        }
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
                    villa: clientData.villa || 'N/A',
                    forceNew: true
                })
            });
            const data = await response.json();
            return data.success ? data.invoiceNumber : nextRefNumber;
        } catch (error) {
            return nextRefNumber || (await previewRefNumber());
        }
    };

    const generateInvoiceData = () => {
        const today = new Date();
        const invoiceDate = parseFrontendDate(clientData.invoiceDate || today);

        // Calculate dynamic dates for preview
        let startDateObj = parseFrontendDate(clientData.startDate || clientData.displayStart || today);
        let endDateObj = new Date(startDateObj);
        endDateObj.setDate(endDateObj.getDate() + (durationDays - 1));

        return {
            ref: isTestMode ? 'TEST-INVOICE' : confirmedRef,
            date: invoiceDate.toISOString().split('T')[0],
            customer: {
                name: clientData.name || '',
                addressLine1: clientData.villa || ''
            },
            service: {
                subject: clientData.subject,
                packageId: clientData.washmanPackage,
                serves: clientData.serves || clientData.washmanPackage,
                vehicleType: clientData.typeOfCar || '',
                startDate: formatFrontendDate(startDateObj),
                endDate: isOneTime ? null : formatFrontendDate(endDateObj),
                duration: `${durationDays} days`
            },
            basePrice: customFee,
            isPaid: isPaid,
            vat: vatRate || 0,
            bankConfig: bankConfig,
            duration: `${durationDays} days`
        };
    };

    const handlePrint = () => window.print();

    const handleExportPDF = () => {
        const fileName = `Invoice_${confirmedRef}_${(clientData.villa || 'N_A').replace(/\s+/g, '_')}`;
        const originalTitle = document.title;
        document.title = fileName;
        const printStyles = document.createElement('style');
        printStyles.innerHTML = `
            @media print {
                @page { size: A4; margin: 0.5in; }
                body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .letterhead-page { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
        `;
        document.head.appendChild(printStyles);
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
            document.head.removeChild(printStyles);
        }, 1000);
    };

    React.useEffect(() => {
        if ((existingRef || clientData.existingRef)) {
            setConfirmedRef(existingRef || clientData.existingRef);
            const isPaidStatus = existingPaidStatus !== null ? existingPaidStatus :
                (clientData.payment && (clientData.payment.toLowerCase().includes('yes/') || clientData.payment.toLowerCase() === 'paid'));
            setIsPaid(isPaidStatus);
            setShowInvoice(true);
        } else if (!clientData.isReprint && !clientData.existingRef) {
            const preparePreview = async () => {
                try {
                    const refNumber = await previewRefNumber();
                    setNextRefNumber(refNumber);
                } catch (error) {
                    console.error('Preview number failed:', error);
                }
            };
            preparePreview();
        }
    }, [existingRef, existingPaidStatus, clientData.existingRef, clientData.payment, clientData.isReprint]);

    React.useEffect(() => {
        if (propBankConfig) {
            setBankConfig(propBankConfig);
        } else {
            const savedBankConfig = localStorage.getItem('bankConfig');
            if (savedBankConfig) setBankConfig(JSON.parse(savedBankConfig));
        }
        if (propVatRate !== undefined) {
            setVatRate(propVatRate);
        } else {
            const savedVatRate = localStorage.getItem('vatRate');
            if (savedVatRate) setVatRate(parseFloat(savedVatRate));
        }
    }, [propBankConfig, propVatRate]);

    const handleRefConfirm = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const finalRefNumber = nextRefNumber || await generateRefNumber();
            const isRegularCustomer = clientData.customerID && !clientData.customerID.startsWith('ONE_TIME');

            const payload = isRegularCustomer ? {
                customerID: clientData.customerID,
                totalAmount: customFee,
                paymentStatus: clientData.payment || 'pending',
                paymentMethod: clientData.paymentMethod || 'Cash',
                dueDate: (() => {
                    // Parse the client's Start_Date (DD/MM/YYYY format)
                    const startDateStr = clientData.startDate || new Date().toLocaleDateString('en-GB');
                    const [day, month, year] = startDateStr.split('/').map(Number);
                    const startDate = new Date(year, month - 1, day);

                    // Calculate due date by adding duration days
                    const dueDate = new Date(startDate);
                    dueDate.setDate(dueDate.getDate() + durationDays);
                    return dueDate.toLocaleDateString('en-GB');
                })(),
                notes: `Package: ${clientData.washmanPackage}, Vehicle: ${clientData.typeOfCar}`,
                duration: `${durationDays} days`,
                skipReservation: true
            } : {
                clientName: clientData.name || 'Walk-in Customer',
                villa: clientData.villa || 'N/A',
                phone: clientData.phone || 'N/A',
                packageId: clientData.washmanPackage || 'One-Time Service',
                vehicleType: clientData.typeOfCar || 'N/A',
                serves: clientData.serves || 'One-time car wash service',
                amount: customFee,
                paymentStatus: clientData.payment || 'pending',
                startDate: clientData.startDate || new Date().toLocaleDateString('en-GB'),
                duration: `${durationDays} days`,
                skipReservation: true
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    ref: finalRefNumber,
                    subject: clientData.subject || clientData.serves || clientData.washmanPackage
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (errorText.includes('already has an invoice for this month')) {
                    const existingInvoiceMatch = errorText.match(/GLOGO-\d+/);
                    const existingRef = existingInvoiceMatch ? existingInvoiceMatch[0] : 'existing invoice';
                    throw new Error(`Customer already has an invoice for this month: ${existingRef}\n\nWould you like to reprint the existing invoice instead?`);
                }
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }

            const responseData = await response.json();
            if (responseData.success) {
                const invoiceRef = responseData.invoice?.invoiceId || finalRefNumber;
                setConfirmedRef(invoiceRef);
                if (onInvoiceCreated) onInvoiceCreated({ ref: invoiceRef, clientName: clientData.name });
            } else {
                throw new Error(responseData.error || 'Failed to create invoice');
            }

            setShowRefConfirmDialog(false);
            const paymentStatus = clientData.payment || 'pending';
            setIsPaid(paymentStatus.toLowerCase().includes('yes/') || paymentStatus.toLowerCase() === 'paid');
            setShowInvoice(true);
        } catch (error) {
            if (error.message.includes('already has an invoice for this month')) {
                const shouldReprint = confirm(error.message + '\n\nClick OK to use Test Invoice instead, or Cancel to close.');
                if (shouldReprint) {
                    setIsTestMode(true);
                    setConfirmedRef('TEST-INVOICE');
                    setIsPaid(clientData.payment?.toLowerCase().includes('yes/') || false);
                    setShowInvoice(true);
                    setShowRefConfirmDialog(false);
                }
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    if (showRefConfirmDialog) {
        return (
            <div style={styles.modalBackdrop}>
                <div style={styles.modalContent}>
                    <h3 style={{ color: '#548235', marginBottom: '1rem' }}>Confirm Invoice Number Reservation</h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Invoice number will be reserved: <strong>{nextRefNumber}</strong><br />
                        This number cannot be used again.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={handleRefConfirm} disabled={isGenerating} style={{ ...styles.generateButton, backgroundColor: isGenerating ? '#6c757d' : '#548235' }}>
                            {isGenerating ? '⏳ Creating...' : 'Confirm'}
                        </button>
                        <button onClick={() => setShowRefConfirmDialog(false)} disabled={isGenerating} style={styles.cancelButton}>
                            Cancel
                        </button>
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

                        {/* Subscription Duration Selection - Hide for One-Time */}
                        {!isOneTime && (
                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#548235' }}>
                                    Subscription Duration (Days):
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                                        style={{
                                            width: '80px',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '1px solid #548235',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}
                                    />
                                    <span style={{ color: '#666', fontWeight: 'bold' }}>Days</span>

                                    <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                                        {[15, 30, 60].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setDurationDays(val)}
                                                style={{
                                                    padding: '5px 8px',
                                                    fontSize: '11px',
                                                    border: '1px solid #548235',
                                                    borderRadius: '4px',
                                                    background: durationDays === val ? '#548235' : 'white',
                                                    color: durationDays === val ? 'white' : '#548235',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {val}d
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Price / Pro-rated Fee */}
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#548235' }}>
                                Total Amount (AED):
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="number"
                                    min="0"
                                    value={customFee}
                                    onChange={(e) => setCustomFee(parseInt(e.target.value) || 0)}
                                    style={{
                                        width: '120px',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #548235',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: customFee !== parseInt(clientData.fee) ? '#007bff' : '#000'
                                    }}
                                />
                                {durationDays !== 30 && (
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        (Pro-rated for {durationDays} days)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={styles.buttonGroup}>
                        <button
                            onClick={() => { setIsTestMode(true); setConfirmedRef('TEST-INVOICE'); setIsPaid(clientData.payment?.toLowerCase().includes('yes/') || false); setShowInvoice(true); }}
                            style={{ ...styles.generateButton, backgroundColor: '#ffc107', color: '#000' }}
                        >
                            🧪 Test Invoice
                        </button>
                        <button
                            onClick={async () => {
                                setIsGenerating(true);
                                try {
                                    if (!nextRefNumber) setNextRefNumber(await previewRefNumber());
                                    setShowRefConfirmDialog(true);
                                } catch (error) {
                                    setNextRefNumber('GLOGO-ERROR');
                                    setShowRefConfirmDialog(true);
                                } finally {
                                    setIsGenerating(false);
                                }
                            }}
                            disabled={isGenerating}
                            style={styles.generateButton}
                        >
                            {isGenerating ? '⏳ Getting Number...' : '📄 Generate & Print'}
                        </button>
                        <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    const invoiceData = generateInvoiceData();
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
                    {isTestMode && <div style={styles.testWarning}>🧪 TEST MODE - No invoice number reserved</div>}
                    <button onClick={handlePrint} style={styles.printButton}>🖨️ Print</button>
                    <button onClick={handleExportPDF} style={styles.exportButton}>📄 Save as PDF</button>
                    <button onClick={onClose} style={styles.closeButton}>✕ Close</button>
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
    dateInfo: { textAlign: 'left' },
    refInfo: { textAlign: 'right' },
    spacer: { height: '5px', marginBottom: '5px' },
    customerInfo: { textAlign: 'left', marginBottom: '30px' },
    subject: { fontWeight: 'bold', textDecoration: 'underline', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { border: '1px solid #000', padding: '8px', textAlign: 'center', backgroundColor: '#f2f2f2' },
    td: { border: '1px solid #000', padding: '8px', textAlign: 'left', verticalAlign: 'top' },
    emptyCell: { border: 'none' },
    totalLabelCell: { border: '1px solid #000', textAlign: 'center', backgroundColor: '#f2f2f2', fontWeight: 'bold', padding: '8px' },
    totalValueCell: { border: '1px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', padding: '8px' },
    bankInfo: { marginTop: '20px', marginBottom: '10px', lineHeight: '1.1' },
    footer: { marginTop: '10px' },
    testWarning: { backgroundColor: '#fff3cd', color: '#856404', padding: '8px 16px', borderRadius: '5px', border: '1px solid #ffc107', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' },
};

export default InvoiceGenerator;
