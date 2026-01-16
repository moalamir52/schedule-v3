import React from 'react';

const ClientSummaryCard = ({ clientsSummary, setSearchTerm, setStatusFilter, invoices }) => {
    const normalize = (value) => (value || '').toString().trim().toLowerCase();

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #e3f2fd'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div
                    onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                        const subscriptionInvoices = invoices.filter(inv => inv.CustomerID && inv.CustomerID !== 'ONE_TIME');
                        if (subscriptionInvoices.length > 0) {
                            setSearchTerm(subscriptionInvoices[0].CustomerID.substring(0, 4));
                        }
                    }}
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    className="summary-stat-hover"
                >
                    <div style={{ fontSize: '2rem', marginBottom: '5px' }}>👥</div>
                    <h3 style={{ color: '#007bff', margin: '0 0 5px 0', fontSize: '1.5rem' }}>{clientsSummary.subscriptionClients}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Subscription Invoices</p>
                </div>

                <div style={{ fontSize: '2rem', color: '#dee2e6' }}>|</div>

                <div
                    onClick={() => {
                        setSearchTerm('ONE_TIME');
                        setStatusFilter('All');
                    }}
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    className="summary-stat-hover"
                >
                    <div style={{ fontSize: '2rem', marginBottom: '5px' }}>⚡</div>
                    <h3 style={{ color: '#fd7e14', margin: '0 0 5px 0', fontSize: '1.5rem' }}>{clientsSummary.oneTimeClients}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>One-Time Invoices</p>
                </div>

                <div style={{ fontSize: '2rem', color: '#dee2e6' }}>|</div>

                <div
                    onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                    }}
                    style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                    className="summary-stat-hover"
                >
                    <div style={{ fontSize: '2rem', marginBottom: '5px' }}>📊</div>
                    <h3 style={{ color: '#28a745', margin: '0 0 5px 0', fontSize: '1.5rem' }}>{clientsSummary.totalClients}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Total Invoices</p>
                </div>
            </div>
        </div>
    );
};

export default ClientSummaryCard;
