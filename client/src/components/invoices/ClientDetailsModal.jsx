import React from 'react';

const ClientDetailsModal = ({
    show,
    onClose,
    clientDetails
}) => {
    if (!show || !clientDetails) return null;

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
            zIndex: 1100
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '35px',
                        height: '35px',
                        cursor: 'pointer',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(220,53,69,0.3)'
                    }}
                >
                    ×
                </button>

                <div style={{ borderBottom: '3px solid #007bff', paddingBottom: '15px', marginBottom: '25px' }}>
                    <h2 style={{ color: '#007bff', margin: 0, fontSize: '1.8rem' }}>👤 Client Details</h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0', fontWeight: '500' }}>
                        ID: <span style={{ color: '#000' }}>{clientDetails.CustomerID || 'N/A'}</span>
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #007bff' }}>
                        <label style={{ display: 'block', color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Full Name</label>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>{clientDetails.CustomerName || clientDetails.Name}</div>
                    </div>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                        <label style={{ display: 'block', color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Villa / Location</label>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>🏠 {clientDetails.Villa || 'N/A'}</div>
                    </div>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                        <label style={{ display: 'block', color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Phone Number</label>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>📞 {clientDetails.Phone || 'N/A'}</div>
                    </div>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                        <label style={{ display: 'block', color: '#666', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Car Plate</label>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>🚗 {clientDetails.Vehicle || 'N/A'}</div>
                    </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#444' }}>🛠️ Active Services</h3>
                    <div style={{
                        marginTop: '15px',
                        padding: '20px',
                        backgroundColor: '#eef2f7',
                        borderRadius: '8px',
                        whiteSpace: 'pre-line',
                        lineHeight: '1.6',
                        fontSize: '15px',
                        color: '#2c3e50',
                        fontFamily: 'monospace',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {clientDetails.Services || 'No specific services listed.'}
                    </div>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 30px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsModal;
