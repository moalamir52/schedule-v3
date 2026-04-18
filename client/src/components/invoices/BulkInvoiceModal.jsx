import React from 'react';

const BulkInvoiceModal = ({
    show,
    onClose,
    availableClients,
    bulkInvoiceProgress,
    onCreateBulk
}) => {
    if (!show || !bulkInvoiceProgress) return null;

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
                            <strong>Month:</strong> {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}<br />
                            <strong>Available Clients:</strong> {availableClients?.length || 0}<br />
                            <strong>Status:</strong> All invoices will be created as "Pending"
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={onCreateBulk}
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
                                onClick={onClose}
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
                                }} />
                            </div>
                            <div style={{ fontSize: '16px' }}>
                                Processing: <strong>{bulkInvoiceProgress.current}</strong> of <strong>{bulkInvoiceProgress.total}</strong>
                            </div>
                        </div>
                        <div style={{ color: '#666', fontSize: '14px' }}>
                            Please don't close this window until the process completes.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BulkInvoiceModal;
