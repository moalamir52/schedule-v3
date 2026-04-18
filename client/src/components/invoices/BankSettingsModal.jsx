import React from 'react';

const BankSettingsModal = ({
    show,
    onClose,
    bankConfig,
    setBankConfig,
    onSave
}) => {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                width: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginBottom: '20px', color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
                    🏦 Bank Account Settings
                </h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Account Holder</label>
                        <input
                            type="text"
                            value={bankConfig.accountHolderName}
                            onChange={(e) => setBankConfig({ ...bankConfig, accountHolderName: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Bank Name</label>
                        <input
                            type="text"
                            value={bankConfig.bankName}
                            onChange={(e) => setBankConfig({ ...bankConfig, bankName: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Account Number</label>
                        <input
                            type="text"
                            value={bankConfig.accountNumber}
                            onChange={(e) => setBankConfig({ ...bankConfig, accountNumber: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>IBAN</label>
                        <input
                            type="text"
                            value={bankConfig.iban}
                            onChange={(e) => setBankConfig({ ...bankConfig, iban: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            onClick={onSave}
                            style={{
                                flex: 1, backgroundColor: '#28a745', color: 'white', padding: '12px',
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            Save Settings
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, backgroundColor: '#6c757d', color: 'white', padding: '12px',
                                border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankSettingsModal;
