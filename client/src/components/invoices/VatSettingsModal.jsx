import React from 'react';

const VatSettingsModal = ({
    show,
    onClose,
    vatRate,
    setVatRate,
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
                width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{ marginBottom: '20px', color: '#dc3545', borderBottom: '2px solid #dc3545', paddingBottom: '10px' }}>
                    📊 VAT Settings
                </h3>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>VAT Rate (%)</label>
                    <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        placeholder="e.g. 5"
                        min="0"
                    />
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        This rate will be applied to all newly generated invoices.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={onSave}
                        style={{
                            flex: 1, backgroundColor: '#dc3545', color: 'white', padding: '12px',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        Save VAT Rate
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
    );
};

export default VatSettingsModal;
