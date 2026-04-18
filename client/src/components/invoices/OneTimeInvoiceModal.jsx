import React from 'react';

const OneTimeInvoiceModal = ({
    show,
    onClose,
    data,
    setData,
    customers,
    services,
    loadingServices,
    serviceCategory,
    setServiceCategory,
    onSubmit
}) => {
    if (!show) return null;

    const calculateTotal = () => {
        return (data.selectedServices || []).reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '2px solid #fd7e14',
                    paddingBottom: '10px'
                }}>
                    <div>
                        <h3 style={{ color: '#fd7e14', margin: 0 }}>⚡ One-Time Invoice</h3>
                        <p style={{ color: '#666', fontSize: '14px', margin: '5px 0 0 0' }}>Quick invoice for walk-in customers</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Service Category</label>
                        <select
                            value={serviceCategory}
                            onChange={(e) => setServiceCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                marginBottom: '15px'
                            }}
                        >
                            <option value="all">All Services</option>
                            <option value="car">Car Services</option>
                            <option value="home">Home Services</option>
                            <option value="rules">🧼 Wash Rules</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Client Name</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select
                                value={data.clientName}
                                onChange={(e) => setData({ ...data, clientName: e.target.value })}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            >
                                <option value="">Select or type name</option>
                                <option value="Walk-in Customer">🚶 Walk-in Customer</option>
                                <option value="Guest">🎆 Guest</option>
                                <option value="Visitor">👥 Visitor</option>
                                {[...new Set(customers.map(c => c.Name || c.CustomerName).filter(name => name))]
                                    .sort()
                                    .slice(0, 10)
                                    .map(name => (
                                        <option key={name} value={name}>
                                            👤 {name}
                                        </option>
                                    ))
                                }
                            </select>
                            <input
                                type="text"
                                value={data.clientName}
                                onChange={(e) => setData({ ...data, clientName: e.target.value })}
                                placeholder="Custom name"
                                style={{
                                    width: '150px',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Villa</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <select
                                    value={data.villa}
                                    onChange={(e) => setData({ ...data, villa: e.target.value })}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <option value="">Select Villa</option>
                                    <option value="Parking">🅿️ Parking Area</option>
                                    <option value="Guest">🏨 Guest Area</option>
                                    {[...new Set(customers.map(c => c.Villa).filter(villa => villa))]
                                        .sort((a, b) => {
                                            const aNum = parseInt(a.match(/\d+/)?.[0]) || 0;
                                            const bNum = parseInt(b.match(/\d+/)?.[0]) || 0;
                                            if (aNum !== bNum) return aNum - bNum;
                                            return a.localeCompare(b);
                                        })
                                        .slice(0, 20)
                                        .map(villa => (
                                            <option key={villa} value={villa}>
                                                🏠 {villa}
                                            </option>
                                        ))
                                    }
                                </select>
                                <input
                                    type="text"
                                    value={data.villa}
                                    onChange={(e) => setData({ ...data, villa: e.target.value })}
                                    placeholder="Custom"
                                    style={{
                                        width: '80px',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
                            <input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData({ ...data, phone: e.target.value })}
                                placeholder="Phone number"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Service Date</label>
                            <input
                                type="date"
                                value={data.serviceDate || ''}
                                onChange={(e) => setData({ ...data, serviceDate: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Services & Pricing</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <select
                                onChange={(e) => {
                                    const selectedService = e.target.value;
                                    if (selectedService) {
                                        setData(prev => {
                                            const currentServices = prev.selectedServices || [];
                                            if (currentServices.find(s => s.name === selectedService)) return prev;

                                            const serviceInfo = services.find(s => s.ServiceName === selectedService);
                                            const newService = {
                                                name: selectedService,
                                                price: serviceInfo?.Price !== undefined ? serviceInfo.Price : ''
                                            };

                                            return {
                                                ...prev,
                                                selectedServices: [...currentServices, newService]
                                            };
                                        });
                                    }
                                    e.target.value = '';
                                }}
                                disabled={loadingServices}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    backgroundColor: loadingServices ? '#f8f9fa' : 'white'
                                }}
                            >
                                <option value="">{loadingServices ? 'Loading...' : 'Add Service'}</option>
                                {services.filter(service => {
                                    if (serviceCategory === 'all') return true;
                                    const serviceName = service.ServiceName.toLowerCase();
                                    if (serviceCategory === 'car') {
                                        return serviceName.includes('clean car') ||
                                            serviceName.includes('wash') ||
                                            serviceName.includes('package') ||
                                            serviceName.includes('subscription') ||
                                            serviceName.includes('garage');
                                    }
                                    if (serviceCategory === 'home') {
                                        return serviceName.includes('exterior glass') || serviceName.includes('facade') || serviceName.includes('garden cleaning') || serviceName.includes('house painting');
                                    }
                                    if (serviceCategory === 'rules') {
                                        return service.Category === 'rule' || serviceName.includes('ext') || serviceName.includes('int');
                                    }
                                    return false;
                                }).map(service => (
                                    <option key={`serves-${service.ServiceID || service.serviceId}`} value={service.ServiceName}>
                                        {service.ServiceName}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => {
                                    setData(prev => ({
                                        ...prev,
                                        selectedServices: [...(prev.selectedServices || []), { name: '', price: '' }]
                                    }));
                                }}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add
                            </button>
                        </div>
                        {(data.selectedServices || []).map((service, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={service.name}
                                    onChange={(e) => {
                                        const updatedServices = [...(data.selectedServices || [])];
                                        updatedServices[index].name = e.target.value;
                                        setData({ ...data, selectedServices: updatedServices });
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                                <input
                                    type="number"
                                    value={service.price}
                                    onChange={(e) => {
                                        const updatedServices = [...(data.selectedServices || [])];
                                        updatedServices[index].price = e.target.value;
                                        setData({ ...data, selectedServices: updatedServices });
                                    }}
                                    placeholder="Price"
                                    min="0"
                                    style={{
                                        width: '80px',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        MozAppearance: 'textfield'
                                    }}
                                    onWheel={(e) => e.target.blur()}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updatedServices = (data.selectedServices || []).filter((_, i) => i !== index);
                                        setData({ ...data, selectedServices: updatedServices });
                                    }}
                                    style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <strong>Total: AED {calculateTotal()}</strong>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Payment Status</label>
                        <select
                            value={data.paymentStatus}
                            onChange={(e) => setData({ ...data, paymentStatus: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }}
                        >
                            <option value="pending">⏳ Pending</option>
                            <option value="yes/cash">✅ Paid (Cash)</option>
                            <option value="yes/bank">✅ Paid (Bank)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Notes (Optional)</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                            <button
                                type="button"
                                onClick={() => setData({ ...data, notes: 'Emergency service - same day' })}
                                style={{
                                    backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px',
                                    padding: '4px 8px', cursor: 'pointer', fontSize: '12px'
                                }}
                            >
                                🚨 Emergency
                            </button>
                            <button
                                type="button"
                                onClick={() => setData({ ...data, notes: 'VIP customer - premium service' })}
                                style={{
                                    backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px',
                                    padding: '4px 8px', cursor: 'pointer', fontSize: '12px'
                                }}
                            >
                                👑 VIP
                            </button>
                        </div>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData({ ...data, notes: e.target.value })}
                            placeholder="Additional notes..."
                            style={{
                                width: '100%', padding: '8px 12px', borderRadius: '4px',
                                border: '1px solid #ddd', height: '60px', resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                backgroundColor: '#6c757d', color: 'white', padding: '10px 20px',
                                border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            style={{
                                backgroundColor: '#fd7e14', color: 'white', padding: '10px 20px',
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            ⚡ Create & Print Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OneTimeInvoiceModal;
