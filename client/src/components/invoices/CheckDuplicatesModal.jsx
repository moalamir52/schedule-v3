import React from 'react';

const CheckDuplicatesModal = ({
    show,
    onClose,
    duplicatesData,
    selectedDuplicates,
    onToggleSelect,
    onSelectAll,
    onDeleteSelected,
    deleting
}) => {
    if (!show) return null;

    return (
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
                width: '900px',
                maxWidth: '95vw',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#e74c3c' }}>🔍 Duplicate Invoices Found</h3>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '8px 16px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>

                {duplicatesData.duplicates && duplicatesData.duplicates.length > 0 ? (
                    <>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #ffeeba'
                        }}>
                            <strong>Summary:</strong> Total Groups: {duplicatesData.summary.totalGroups} | Total Invoices: {duplicatesData.summary.totalInvoices} | Duplicates: {duplicatesData.summary.duplicateCount}
                        </div>

                        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={onSelectAll}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Select All Duplicates
                            </button>
                            <button
                                onClick={onDeleteSelected}
                                disabled={selectedDuplicates.length === 0 || deleting}
                                style={{
                                    backgroundColor: (selectedDuplicates.length === 0 || deleting) ? '#6c757d' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    cursor: (selectedDuplicates.length === 0 || deleting) ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {deleting ? '🗑️ Deleting...' : `🗑️ Delete Selected (${selectedDuplicates.length})`}
                            </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Select</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Customer</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Month/Year</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>REF</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Invoice ID</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Amount</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicatesData.duplicates.map((group, groupIndex) => (
                                    <React.Fragment key={groupIndex}>
                                        {group.invoices.map((inv, invIndex) => (
                                            <tr key={inv.InvoiceID} style={{
                                                borderBottom: invIndex === group.invoices.length - 1 ? '3px solid #dee2e6' : '1px solid #eee',
                                                backgroundColor: invIndex > 0 ? '#fff5f5' : 'transparent'
                                            }}>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDuplicates.includes(inv.InvoiceID)}
                                                        onChange={() => onToggleSelect(inv.InvoiceID)}
                                                        style={{ width: '18px', height: '18px' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px' }}>{inv.CustomerName}</td>
                                                <td style={{ padding: '12px' }}>{group.month}/{group.year}</td>
                                                <td style={{ padding: '12px' }}>{inv.Ref}</td>
                                                <td style={{ padding: '12px' }}>{inv.InvoiceID}</td>
                                                <td style={{ padding: '12px' }}>AED {inv.TotalAmount}</td>
                                                <td style={{ padding: '12px' }}>{new Date(inv.CreatedAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
                        ✅ No duplicate invoices found for specific customers and months.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckDuplicatesModal;
