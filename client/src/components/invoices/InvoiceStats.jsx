import React from 'react';

const InvoiceStats = ({ monthlyStats, searchTerm, setSearchTerm, setStatusFilter }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
        }}>
            {/* This Month */}
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
                    transition: 'all 0.3s ease',
                    border: '2px solid #e8f5e8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📅</div>
                <h3 style={{ color: '#28a745', margin: '0 0 5px 0', fontSize: '1.5rem' }}>
                    {(monthlyStats?.thisMonth?.total || 0).toLocaleString()} AED
                </h3>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>Target Month Revenue</p>
                <small style={{ color: '#666' }}>{monthlyStats?.thisMonth?.count || 0} invoices</small>
            </div>

            {/* Paid */}
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
                    transition: 'all 0.3s ease',
                    border: '2px solid #d4edda',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
                <h3 style={{ color: '#28a745', margin: '0 0 5px 0', fontSize: '1.5rem' }}>
                    {(monthlyStats?.paid?.total || 0).toLocaleString()} AED
                </h3>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>Paid This Month</p>
                <small style={{ color: '#666' }}>{monthlyStats?.paid?.count || 0} invoices</small>
            </div>

            {/* Pending */}
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
                    transition: 'all 0.3s ease',
                    border: '2px solid #fff3cd',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏳</div>
                <h3 style={{ color: '#856404', margin: '0 0 5px 0', fontSize: '1.5rem' }}>
                    {(monthlyStats?.pending?.total || 0).toLocaleString()} AED
                </h3>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>Pending Collection</p>
                <small style={{ color: '#666' }}>{monthlyStats?.pending?.count || 0} invoices</small>
            </div>

            {/* Total/All Time */}
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
                    transition: 'all 0.3s ease',
                    border: '2px solid #e3f2fd',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
                <h3 style={{ color: '#007bff', margin: '0 0 5px 0', fontSize: '1.5rem' }}>
                    {(monthlyStats?.allTime?.total || 0).toLocaleString()} AED
                </h3>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>All Time Revenue</p>
                <small style={{ color: '#666' }}>{monthlyStats?.allTime?.count || 0} total invoices</small>
            </div>
        </div>
    );
};

export default InvoiceStats;
