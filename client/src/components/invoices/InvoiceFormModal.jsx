import React from 'react';

const InvoiceFormModal = ({
    show,
    onClose,
    mode = 'create', // 'create' or 'edit'
    invoiceData,
    setInvoiceData,
    customers,
    services,
    loadingServices,
    serviceCategory,
    setServiceCategory,
    onSubmit
}) => {
    if (!show || !invoiceData) return null;

    const isEdit = mode === 'edit';
    const title = isEdit ? `✏️ Edit Invoice: ${invoiceData.Ref || invoiceData.InvoiceID}` : '➕ Create New Invoice';
    const subtitle = isEdit ? 'Modify invoice details and services' : 'Fill in the details to create a new invoice';
    const borderColor = isEdit ? '#17a2b8' : '#007bff';

    const calculateTotal = () => {
        return (invoiceData.selectedServices || []).reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
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
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: `2px solid ${borderColor}`,
                    paddingBottom: '10px'
                }}>
                    <div>
                        <h3 style={{ color: borderColor, margin: 0 }}>{title}</h3>
                        <p style={{ color: '#666', fontSize: '14px', margin: '5px 0 0 0' }}>{subtitle}</p>
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

                    {!isEdit ? (
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Select Customer</label>
                            <select
                                value={invoiceData.customerID || ''}
                                onChange={(e) => {
                                    const selectedCustomer = customers.find(c => c.CustomerID === e.target.value);
                                    setInvoiceData(prev => ({
                                        ...prev,
                                        customerID: e.target.value,
                                        TotalAmount: selectedCustomer ? selectedCustomer.Fee : prev.TotalAmount
                                    }));
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            >
                                <option value="">Select a customer</option>
                                {customers.map(customer => (
                                    <option key={customer.CustomerID} value={customer.CustomerID}>
                                        {customer.Name} ({customer.Villa})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Client Name</label>
                                <input
                                    type="text"
                                    value={invoiceData.CustomerName || ''}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, CustomerName: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Villa</label>
                                <input
                                    type="text"
                                    value={invoiceData.Villa || ''}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, Villa: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr 1fr' : '1fr', gap: '15px' }}>
                        {isEdit && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
                                <input
                                    type="tel"
                                    value={invoiceData.Phone || ''}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, Phone: e.target.value })}
                                    placeholder="Phone number"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>
                        )}
                        {isEdit && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Duration</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={parseInt(invoiceData.Duration) || 30}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, Duration: `${e.target.value} days` })}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                    <span style={{ fontWeight: '600', color: '#666' }}>Days</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>{isEdit ? 'Final Amount (AED)' : 'Amount (AED)'}</label>
                            <input
                                type="number"
                                value={invoiceData.TotalAmount || ''}
                                onChange={(e) => setInvoiceData({ ...invoiceData, TotalAmount: e.target.value })}
                                placeholder="Amount"
                                min="0"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    MozAppearance: 'textfield'
                                }}
                                onWheel={(e) => e.target.blur()}
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
                                        setInvoiceData(prev => {
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
                                        return serviceName.includes('exterior glass') ||
                                            serviceName.includes('facade') ||
                                            serviceName.includes('garden cleaning') ||
                                            serviceName.includes('house painting');
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
                                    setInvoiceData(prev => ({
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
                        {(invoiceData.selectedServices || []).map((service, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={service.name}
                                    onChange={(e) => {
                                        const updatedServices = [...(invoiceData.selectedServices || [])];
                                        updatedServices[index].name = e.target.value;
                                        setInvoiceData({ ...invoiceData, selectedServices: updatedServices });
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
                                        const updatedServices = [...(invoiceData.selectedServices || [])];
                                        updatedServices[index].price = e.target.value;
                                        setInvoiceData({ ...invoiceData, selectedServices: updatedServices });
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
                                        const updatedServices = (invoiceData.selectedServices || []).filter((_, i) => i !== index);
                                        setInvoiceData({ ...invoiceData, selectedServices: updatedServices });
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>Services Total: AED {calculateTotal()}</strong>
                                {isEdit && <strong style={{ color: '#28a745' }}>Final Amount: AED {invoiceData.TotalAmount || calculateTotal()}</strong>}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Status</label>
                            <select
                                value={invoiceData.Status || invoiceData.paymentStatus || 'pending'}
                                onChange={(e) => {
                                    const newStatus = e.target.value;
                                    if (isEdit) {
                                        setInvoiceData({
                                            ...invoiceData,
                                            Status: newStatus,
                                            PaymentMethod: newStatus === 'Pending' ? '' : invoiceData.PaymentMethod
                                        });
                                    } else {
                                        setInvoiceData({ ...invoiceData, paymentStatus: newStatus });
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            >
                                <option value="pending">⏳ Pending</option>
                                <option value="Paid">✅ Paid</option>
                                <option value="Overdue">❌ Overdue</option>
                                {/* Fallback for create mode statuses if needed */}
                                {!isEdit && (
                                    <>
                                        <option value="yes/cash">✅ Paid (Cash)</option>
                                        <option value="yes/bank">✅ Paid (Bank)</option>
                                    </>
                                )}
                            </select>
                        </div>
                        {isEdit && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Payment Method</label>
                                <select
                                    value={invoiceData.PaymentMethod || ''}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, PaymentMethod: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <option value="">None</option>
                                    <option value="Cash">💵 Cash</option>
                                    <option value="Bank">🏦 Bank Transfer</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Notes (Optional)</label>
                        <textarea
                            value={invoiceData.notes || invoiceData.Notes || ''}
                            onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value, Notes: e.target.value })}
                            placeholder="Additional notes..."
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                height: '60px',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSubmit(invoiceData)}
                            style={{
                                backgroundColor: borderColor,
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isEdit ? '💾 Save Changes' : '📋 Create & Print Invoice'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceFormModal;
