import React, { useState } from 'react';
import CustomerProfilePage from './CustomerProfilePage';

// Example of how to integrate CustomerProfilePage into your existing components
const CustomerProfileExample = ({ clients }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const handleViewProfile = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedCustomerId(null);
  };

  return (
    <div>
      {/* Your existing client table with added "View Profile" button */}
      <div className="clients-table">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Villa</th>
              <th>Package</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients?.map((client) => (
              <tr key={client.CustomerID}>
                <td>{client.CustomerID}</td>
                <td>{client.CustomerName || client.Name}</td>
                <td>{client.Villa}</td>
                <td>{client.Washman_Package}</td>
                <td>
                  <span className={`status-badge ${client.Status?.toLowerCase()}`}>
                    {client.Status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {/* Your existing edit/delete buttons */}
                    <button className="btn btn-secondary btn-sm">Edit</button>
                    <button className="btn btn-danger btn-sm">Delete</button>
                    
                    {/* New View Profile button */}
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleViewProfile(client.CustomerID)}
                      title="View Customer Profile"
                    >
                      👤 Profile
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Profile Modal */}
      {showProfile && selectedCustomerId && (
        <CustomerProfilePage 
          customerId={selectedCustomerId}
          onClose={handleCloseProfile}
        />
      )}
    </div>
  );
};

export default CustomerProfileExample;