import React from 'react';

const InvoiceFilterBar = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    filteredCount
}) => {
    return (
        <div style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            marginBottom: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
        }}>
            <input
                type="text"
                placeholder="Search by customer name, villa, or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: '400px',
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
            />
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                    width: '180px',
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                }}
            >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
            </select>
            <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                style={{
                    width: '180px',
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                }}
            >
                <option value="All">All Months (Current Year)</option>
                <option value="Current">Current Month Only</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
            </select>
            <div style={{
                fontSize: '14px',
                color: '#666',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                backgroundColor: '#f8f9fa',
                padding: '8px 12px',
                borderRadius: '6px'
            }}>
                Total: {filteredCount}
            </div>
        </div>
    );
};

export default InvoiceFilterBar;
