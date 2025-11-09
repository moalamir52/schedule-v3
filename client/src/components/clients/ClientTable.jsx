function ClientTable({ clients, onEdit, onDelete }) {
  // Helper function to format date from ISO to DD-MMM-YY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    // If already in DD-MMM-YY format, return as is
    if (dateStr.match(/^\d{1,2}-[A-Za-z]{3}-\d{2}$/)) {
      return dateStr;
    }
    
    // Convert from ISO format (YYYY-MM-DD) to DD-MMM-YY
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateStr;
    }
  };
  
  return (
    <div style={{ 
      overflowX: 'auto',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      margin: '20px 0'
    }}>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Villa</th>
            <th>Phone</th>
            <th>Cars</th>
            <th>Car Plates</th>
            <th>Days</th>
            <th>Time</th>
            <th>Notes</th>
            <th>Package</th>
            <th>Fees</th>
            <th>Start Date</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Serves</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(clients) ? clients.map((client, index) => (
            <tr key={index}>
              <td>{client.CustomerID}</td>
              <td>{client.Name}</td>
              <td>{client.Villa}</td>
              <td>{client.Phone}</td>
              <td>{client['Number of car']}</td>
              <td>{client.CarPlates}</td>
              <td>{client.Days}</td>
              <td>{client.Time}</td>
              <td style={{ 
                maxWidth: '100px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {client.Notes}
              </td>
              <td>{client.Washman_Package}</td>
              <td>{client.Fee}</td>
              <td>{formatDate(client['start date'])}</td>
              <td>{client.payment}</td>
              <td>
                <span style={{
                  backgroundColor: client.Status === 'Active' ? '#28a745' : '#dc3545',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {client.Status}
                </span>
              </td>
              <td>{client.Serves}</td>
              <td>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => onEdit(client)}
                    style={{
                      backgroundColor: '#ffc107',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(client)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="16" style={{ textAlign: 'center', padding: '20px' }}>
                No clients data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ClientTable;