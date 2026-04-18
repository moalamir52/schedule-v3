import React from 'react';

const StatusBadge = ({ status }) => {
    const getStatusColor = (s) => {
        switch (s?.toLowerCase()) {
            case 'paid': return { bg: '#e8f5e9', text: '#2e7d32' };
            case 'pending': return { bg: '#fff3e0', text: '#ef6c00' };
            case 'overdue': return { bg: '#ffebee', text: '#c62828' };
            case 'cancelled': return { bg: '#f5f5f5', text: '#616161' };
            default: return { bg: '#e3f2fd', text: '#1976d2' };
        }
    };

    const colors = getStatusColor(status);

    return (
        <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: colors.bg,
            color: colors.text,
            textTransform: 'uppercase',
            display: 'inline-block'
        }}>
            {status}
        </span>
    );
};

export default StatusBadge;
