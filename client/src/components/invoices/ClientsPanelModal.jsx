import React from 'react';

const ClientsPanelModal = ({
    show,
    onClose,
    availableClients,
    invoicedClients,
    invoices,
    availableSearch,
    setAvailableSearch,
    invoicedSearch,
    setInvoicedSearch,
    showDueOnly,
    setShowDueOnly,
    onCreateInvoice,
    onReprintInvoice,
    onEditInvoice
}) => {
    if (!show) return null;

    const today = new Date().getDate();

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '30px',
                width: '90%', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#17a2b8', margin: 0 }}>👥 Client Status - {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '50%',
                            width: '30px', height: '30px', cursor: 'pointer'
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
                            placeholder="Search available..."
                            value={availableSearch}
                            onChange={(e) => setAvailableSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '14px', marginBottom: '10px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <button
                                onClick={() => setShowDueOnly(!showDueOnly)}
                                style={{
                                    backgroundColor: showDueOnly ? '#28a745' : '#17a2b8',
                                    color: 'white', border: 'none', borderRadius: '4px',
                                    padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
                                }}
                            >
                                📅 {showDueOnly ? 'Show All' : 'Due Today'}
                            </button>
                        </div>
                        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                            {(availableClients || []).filter(client => {
                                const matchesSearch = client.Name?.toLowerCase().includes(availableSearch.toLowerCase()) ||
                                    client.Villa?.toLowerCase().includes(availableSearch.toLowerCase());
                                if (!showDueOnly) return matchesSearch;
                                if (!client.Start_Date) return false;
                                const startDay = parseInt(client.Start_Date.split('/')[0]);
                                return matchesSearch && startDay <= today;
                            }).map(client => (
                                <div key={client.CustomerID} style={{
                                    padding: '12px', borderBottom: '1px solid #eee',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <strong>{client.Name}</strong>
                                        {(() => {
                                            const startDay = client.Start_Date ? parseInt(client.Start_Date.split('/')[0]) : null;
                                            return startDay && startDay <= today ? <span style={{ color: '#dc3545', fontSize: '11px', marginLeft: '5px' }}>📅 DUE</span> : null;
                                        })()}
                                        <br />
                                        <small style={{ color: '#666' }}>Villa: {client.Villa} | AED {client.Fee}</small>
                                    </div>
                                    <button
                                        onClick={() => onCreateInvoice(client)}
                                        style={{
                                            backgroundColor: '#28a745', color: 'white', border: 'none',
                                            borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
                                        }}
                                    >
                                        Create
                                    </button>
                                </div>
                            ))}
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
                            placeholder="Search invoiced..."
                            value={invoicedSearch}
                            onChange={(e) => setInvoicedSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '14px', marginBottom: '10px'
                            }}
                        />
                        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
                            {(invoicedClients || []).filter(client =>
                                client.Name?.toLowerCase().includes(invoicedSearch.toLowerCase()) ||
                                client.Villa?.toLowerCase().includes(invoicedSearch.toLowerCase())
                            ).map(client => {
                                const clientInvoice = invoices.find(inv => inv.CustomerID === client.CustomerID);
                                return (
                                    <div key={client.CustomerID} style={{
                                        padding: '12px', borderBottom: '1px solid #eee',
                                        backgroundColor: '#f8f9fa', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <strong>{client.Name}</strong><br />
                                            <small style={{ color: '#666' }}>Villa: {client.Villa} | AED {client.Fee}</small>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => clientInvoice && onReprintInvoice(clientInvoice)}
                                                style={{
                                                    backgroundColor: '#ffc107', color: 'black', border: 'none',
                                                    borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px'
                                                }}
                                            >
                                                Print
                                            </button>
                                            <button
                                                onClick={() => clientInvoice && onEditInvoice(client, clientInvoice)}
                                                style={{
                                                    backgroundColor: '#17a2b8', color: 'white', border: 'none',
                                                    borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientsPanelModal;
