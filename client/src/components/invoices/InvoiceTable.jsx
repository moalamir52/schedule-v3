import React from 'react';
import StatusBadge from './StatusBadge';

const tableHeaderStyle = {
    padding: '16px 12px',
    textAlign: 'center',
    fontWeight: '600',
    color: 'white',
    borderBottom: '2px solid #dee2e6',
    fontSize: '16px',
    whiteSpace: 'nowrap'
};

const tableCellStyle = {
    padding: '16px 12px',
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: '14px',
    whiteSpace: 'nowrap'
};

const actionButtonStyle = (bgColor, textColor = 'white') => ({
    background: bgColor,
    color: textColor,
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '11px',
    minWidth: 'auto',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap'
});

const InvoiceTable = ({
    filteredInvoices,
    isLoading,
    onMarkAsPaid,
    onMarkAsOverdue,
    onEdit,
    onPrint,
    onDelete,
    onViewClient
}) => {
    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading invoices...</div>;
    }

    return (
        <div className="table-container">
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{
                    width: '100%',
                    minWidth: '1400px',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#28a745' }}>
                            <th style={tableHeaderStyle}>#</th>
                            <th style={tableHeaderStyle}>Created</th>
                            <th style={tableHeaderStyle}>REF</th>
                            <th style={tableHeaderStyle}>Invoice ID</th>
                            <th style={tableHeaderStyle}>Customer</th>
                            <th style={tableHeaderStyle}>Villa</th>
                            <th style={tableHeaderStyle}>Amount</th>
                            <th style={tableHeaderStyle}>Service Period / Date</th>
                            <th style={tableHeaderStyle}>Due Date</th>
                            <th style={tableHeaderStyle}>Status</th>
                            <th style={tableHeaderStyle}>Payment</th>
                            <th style={tableHeaderStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map((invoice, index) => (
                            <tr key={`${invoice.InvoiceID}-${index}`} style={{
                                backgroundColor: index % 2 === 0 ? '#f0f8f0' : '#e8f5e8',
                                borderBottom: '1px solid #c3e6c3'
                            }}>
                                <td style={tableCellStyle}>
                                    <strong style={{ color: '#28a745', fontSize: '16px' }}>{index + 1}</strong>
                                </td>
                                <td style={tableCellStyle}>
                                    {invoice.CreatedAt ? new Date(invoice.CreatedAt).toLocaleDateString('en-GB') : '-'}
                                </td>
                                <td style={tableCellStyle}>
                                    <strong style={{ color: '#28a745' }}>{invoice.Ref || '-'}</strong>
                                </td>
                                <td style={tableCellStyle}>
                                    <strong style={{ color: '#007bff' }}>{invoice.InvoiceID}</strong>
                                </td>
                                <td style={tableCellStyle}>
                                    <span
                                        onClick={() => onViewClient(invoice)}
                                        style={{
                                            cursor: 'pointer',
                                            color: '#007bff',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        {invoice.CustomerName}
                                    </span>
                                </td>
                                <td style={tableCellStyle}>{invoice.Villa}</td>
                                <td style={tableCellStyle}>
                                    <strong style={{ color: '#28a745' }}>AED {invoice.TotalAmount}</strong>
                                </td>
                                <td style={tableCellStyle}>
                                    {invoice.Start || (invoice.InvoiceDate ? new Date(invoice.InvoiceDate).toLocaleDateString('en-GB') : '-')}
                                </td>
                                <td style={tableCellStyle}>
                                    {(invoice.CustomerID === 'ONE_TIME' || invoice.PackageID === 'One-Time Service')
                                        ? '-'
                                        : (invoice.End || (invoice.DueDate
                                            ? (invoice.DueDate.includes('/')
                                                ? invoice.DueDate
                                                : new Date(invoice.DueDate).toLocaleDateString('en-GB'))
                                            : '-'))}
                                </td>
                                <td style={tableCellStyle}>
                                    <StatusBadge status={invoice.Status} />
                                </td>
                                <td style={tableCellStyle}>{invoice.PaymentMethod || '-'}</td>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {invoice.Status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => onMarkAsPaid(invoice.InvoiceID)}
                                                    style={actionButtonStyle('#28a745')}
                                                    title="Mark as Paid"
                                                >
                                                    Paid
                                                </button>
                                                <button
                                                    onClick={() => onMarkAsOverdue(invoice.InvoiceID)}
                                                    style={actionButtonStyle('#dc3545')}
                                                    title="Mark as Overdue"
                                                >
                                                    Overdue
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => onEdit(invoice)}
                                            style={actionButtonStyle('#17a2b8')}
                                            title="Edit Invoice"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onPrint(invoice)}
                                            style={actionButtonStyle('#ffc107', 'black')}
                                            title="Print Invoice"
                                        >
                                            Print
                                        </button>
                                        <button
                                            onClick={() => onDelete(invoice.InvoiceID)}
                                            style={actionButtonStyle('#dc3545')}
                                            title="Delete Invoice"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#666',
                        fontSize: '16px'
                    }}>
                        No invoices found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceTable;
