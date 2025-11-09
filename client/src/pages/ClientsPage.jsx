import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import '../index.css';
import ClientTable from '../components/clients/ClientTable.jsx';
import AddClientModal from '../components/clients/AddClientModal.jsx';
import EditClientModal from '../components/clients/EditClientModal.jsx';
import SearchAndFilter from '../components/clients/SearchAndFilter.jsx';
import UndoNotification from '../components/clients/UndoNotification.jsx';

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Undo functionality
  const [undoData, setUndoData] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(10);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    setFilteredClients(clients);
    
    // Update sidebar debug info
    if (clients.length > 0) {
      const debugElement = document.getElementById('sidebar-debug-content');
      if (debugElement) {
        const packages = [...new Set(clients.map(c => c.Washman_Package).filter(p => p))];
        debugElement.textContent = JSON.stringify(packages, null, 2);
      }
    }
  }, [clients]);

  // Undo countdown timer
  useEffect(() => {
    if (showUndo && undoCountdown > 0) {
      const timer = setTimeout(() => {
        setUndoCountdown(undoCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (undoCountdown === 0) {
      setShowUndo(false);
      setUndoData(null);
    }
  }, [showUndo, undoCountdown]);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      const result = await response.json();
      const data = result.success ? result.data : result;
      setClients(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      
      if (!response.ok) throw new Error('Failed to add client');
      
      await fetchClients();
      showUndoNotification('Client added successfully', 'add', clientData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateClient = async (clientId, updatedData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) throw new Error('Failed to update client');
      
      const result = await response.json();
      await fetchClients();
      showUndoNotification('Client updated successfully', 'update', result.original, clientId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async (client) => {
    if (!confirm(`Are you sure you want to delete ${client.Name}?`)) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${client.CustomerID}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete client');
      
      const result = await response.json();
      await fetchClients();
      showUndoNotification('Client deleted successfully', 'delete', result.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUndo = async () => {
    if (!undoData) return;
    
    try {
      if (undoData.action === 'delete') {
        // Restore deleted client
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(undoData.data)
        });
        
        if (!response.ok) throw new Error('Failed to restore client');
      } else if (undoData.action === 'update') {
        // Restore original data
        const encodedId = encodeURIComponent(undoData.clientId);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${encodedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(undoData.data)
        });
        
        if (!response.ok) throw new Error('Failed to undo update');
      }
      
      await fetchClients();
      setShowUndo(false);
      setUndoData(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const showUndoNotification = (message, action, data, clientId = null) => {
    setUndoData({ action, data, clientId });
    setShowUndo(true);
    setUndoCountdown(10);
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }
    
    const filtered = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      return (
        client.Name?.toLowerCase().includes(searchLower) ||
        client.CustomerID?.toLowerCase().includes(searchLower) ||
        client.Villa?.toLowerCase().includes(searchLower) ||
        client.Phone?.toLowerCase().includes(searchLower) ||
        client.CarPlates?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredClients(filtered);

  };

  const handleFilter = (filters) => {
    let filtered = clients;
    
    if (filters.status) {
      filtered = filtered.filter(client => client.Status === filters.status);
    }
    
    if (filters.package) {
      filtered = filtered.filter(client => {
        const clientPackage = client.Washman_Package?.trim().toLowerCase() || '';
        const filterPackage = filters.package.trim().toLowerCase();
        return clientPackage === filterPackage;
      });
    }
    
    setFilteredClients(filtered);

  };

  const handleExport = () => {
    const csvContent = convertToCSV(filteredClients);
    downloadCSV(csvContent, 'clients.csv');
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const clients = parseCSV(csv);
      // Process imported clients

    };
    reader.readAsText(file);
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csv) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.replace(/"/g, '').trim();
      });
      data.push(obj);
    }
    
    return data;
  };

  return (
    <div className="p-4">
      {/* Page Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px 30px',
        marginBottom: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '2px solid #e8f5e8'
      }}>
        <div style={{ position: 'relative' }}>
          <Link 
            to="/" 
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#1e7e34',
              color: 'white',
              padding: '10px',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1e7e34'}
          >
            <FiArrowLeft size={20} />
          </Link>
          
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              color: '#1e7e34', 
              fontSize: '2.2rem', 
              fontWeight: 'bold',
              margin: 0
            }}>
              👥 Clients Management
            </h1>
            <p style={{
              color: '#6c757d',
              fontSize: '1rem',
              margin: '5px 0 0 0'
            }}>
              Manage your customer database and information
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s',
              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            ➕ Add New Client
          </button>
        </div>
      </div>

      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExport={handleExport}
        onImport={handleImport}
      />

      {isLoading && <p>Loading clients...</p>}
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!isLoading && !error && (
        <>
          <p style={{ marginBottom: '10px', color: '#718096' }}>
            Showing {filteredClients.length} of {clients.length} clients
          </p>

          <ClientTable
            clients={filteredClients}
            onEdit={(client) => {
              setSelectedClient(client);
              setShowEditModal(true);
            }}
            onDelete={handleDeleteClient}
          />
        </>
      )}

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddClient}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
        }}
        onUpdate={handleUpdateClient}
        client={selectedClient}
      />

      <UndoNotification
        isVisible={showUndo}
        message={undoData?.action === 'delete' ? 'Client deleted' : 
                undoData?.action === 'update' ? 'Client updated' : 'Action completed'}
        onUndo={handleUndo}
        onDismiss={() => {
          setShowUndo(false);
          setUndoData(null);
        }}
        countdown={undoCountdown}
      />
      

    </div>
  );
}

export default ClientsPage;