import React from 'react';

const PaymentStatusConfirmModal = ({
    show,
    onClose,
    client,
    onConfirm,
    invoices
}) => {
    if (!show || !client) return null;




    // Convert start date from YYYY-MM-DD to DD/MM/YYYY
    const convertStartDate = (dateStr) => {
        if (!dateStr) return new Date().toLocaleDateString('en-GB');

        // If already in DD/MM/YYYY format, return as is
        if (dateStr.includes('/')) return dateStr;

        // Convert from YYYY-MM-DD to DD/MM/YYYY
        const [year, month, day] = dateStr.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    };

    const baseClientData = {
        name: client.Name,
        villa: client.Villa,
        phone: client.Phone || 'N/A',
        fee: client.Fee || 0,
        washmanPackage: client.Washman_Package || client.Package || 'Standard Package',
        typeOfCar: client.CarPlates || client.TypeOfCar || 'N/A',
        serves: client.Serves || '',
        // Determine start date: use last invoice's End + 1 day if exists, else client's start date
        startDate: (() => {
            // Find last invoice for this client
            if (Array.isArray(invoices) && invoices.length) {
                const clientInvoices = invoices.filter(inv => inv.CustomerID === client.CustomerID);
                if (clientInvoices.length) {
                    // Sort by End date descending
                    const sorted = clientInvoices.sort((a, b) => {
                        const aEnd = a.End || a.EndDate || a.DueDate || '';
                        const bEnd = b.End || b.EndDate || b.DueDate || '';
                        // Parse DD/MM/YYYY or fallback to ISO
                        const parse = (str) => {
                            if (!str) return new Date(0);
                            if (str.includes('/')) {
                                const [d, m, y] = str.split('/').map(Number);
                                return new Date(y, m - 1, d);
                            }
                            return new Date(str);
                        };
                        return parse(bEnd) - parse(aEnd);
                    });
                    const latest = sorted[0];
                    const endStr = latest.End || latest.EndDate || latest.DueDate;
                    if (endStr) {
                        // Parse end date
                        let day, month, year;
                        if (endStr.includes('/')) {
                            [day, month, year] = endStr.split('/').map(Number);
                        } else {
                            const d = new Date(endStr);
                            day = d.getDate(); month = d.getMonth() + 1; year = d.getFullYear();
                        }
                        const endDate = new Date(year, month - 1, day);
                        const nextDay = new Date(endDate);
                        nextDay.setDate(endDate.getDate() + 1);
                        return `${nextDay.getDate().toString().padStart(2, '0')}/${(nextDay.getMonth() + 1).toString().padStart(2, '0')}/${nextDay.getFullYear()}`;
                    }
                }
            }
            // Fallback to client['start date'] conversion
            const raw = client['start date'];
            if (!raw) return new Date().toLocaleDateString('en-GB');
            if (raw.includes('/')) return raw;
            const [y, m, d] = raw.split('-');
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        })(),
        customerID: client.CustomerID
    };

    const handleAction = (status, method) => {
        const finalData = {
            ...baseClientData,
            payment: status,
            paymentMethod: method
        };





        onConfirm(finalData);
    };

    return (
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
                    {client.Name} - {client.Villa}<br />
                    Amount: AED {client.Fee}
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => handleAction('PAID', 'Cash')}
                        style={{
                            backgroundColor: '#28a745', color: 'white', padding: '12px 20px',
                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '14px', fontWeight: 'bold'
                        }}
                    >
                        💵 Paid Cash
                    </button>
                    <button
                        onClick={() => handleAction('PAID', 'Bank')}
                        style={{
                            backgroundColor: '#007bff', color: 'white', padding: '12px 20px',
                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '14px', fontWeight: 'bold'
                        }}
                    >
                        🏦 Paid Bank
                    </button>
                    <button
                        onClick={() => handleAction('pending', '')}
                        style={{
                            backgroundColor: '#ffc107', color: 'black', padding: '12px 20px',
                            border: 'none', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '14px', fontWeight: 'bold'
                        }}
                    >
                        ⏳ Pending
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6c757d', color: 'white', padding: '12px 20px',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatusConfirmModal;
