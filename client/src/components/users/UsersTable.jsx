function UsersTable({ users, onUserDeleted }) {
  const handleDelete = async (username) => {
    if (username === 'admin') {
      alert('Cannot delete admin user');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete user: ${username}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${username}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('User deleted successfully!');
        if (onUserDeleted) onUserDeleted();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Username</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Role</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length > 0 ? users.map((user) => (
            <tr key={user.UserID || user.Username} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '12px' }}>{user.Username}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: user.Role === 'Admin' ? '#dc3545' : user.Role === 'Manager' ? '#ffc107' : '#28a745',
                  color: 'white'
                }}>
                  {user.Role}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: user.Status === 'Active' ? '#28a745' : '#6c757d',
                  color: 'white'
                }}>
                  {user.Status}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button
                  onClick={() => handleDelete(user.Username)}
                  disabled={user.Username === 'admin'}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: user.Username === 'admin' ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: user.Username === 'admin' ? 'not-allowed' : 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UsersTable;