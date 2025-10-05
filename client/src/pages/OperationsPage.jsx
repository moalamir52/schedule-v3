import React, { useState, useEffect } from 'react';
import operationsService from '../services/operationsService';
import authService from '../services/authService';
import { hasPermission, PERMISSIONS, getRoleInfo } from '../utils/rolePermissions';
import Modal from '../components/Modal';

const OperationsPage = () => {
  const [workers, setWorkers] = useState([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, showInput: false, inputValue: '', inputPlaceholder: '' });

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    loadWorkers();
    loadAdditionalServices();
    if (user && hasPermission(user.role, PERMISSIONS.VIEW_USERS)) {
      loadUsers();
    }
  }, []);

  const loadWorkers = async () => {
    try {
      const workersData = await operationsService.getWorkers();
      setWorkers(workersData.map(w => typeof w === 'string' ? w : w.Name || w.WorkerName || 'Unknown'));
    } catch (error) {
      console.error('Failed to load workers:', error);
      setWorkers(['Raqib', 'Rahman']); // Default workers
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalServices = async () => {
    try {
      const services = await operationsService.getAdditionalServices();
      setAdditionalServices(services);
    } catch (error) {
      console.error('Failed to load services:', error);
      setAdditionalServices(['garage bi-weekly', 'garage weekly']);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Please fill all fields', onConfirm: null });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setNewUser({ username: '', password: '', role: 'user' });
        setShowAddUserForm(false);
        loadUsers();
        setModal({ isOpen: true, type: 'success', title: 'Success', message: 'User added successfully!', onConfirm: null });
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to add user', onConfirm: null });
      }
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to add user', onConfirm: null });
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        loadUsers();
        setEditingUser(null);
        setModal({ isOpen: true, type: 'success', title: 'Success', message: 'User role updated successfully!', onConfirm: null });
      }
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update user', onConfirm: null });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete user "${username}"?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            loadUsers();
            setModal({ isOpen: true, type: 'success', title: 'Success', message: 'User deleted successfully!', onConfirm: null });
          }
        } catch (error) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete user', onConfirm: null });
        }
      }
    });
  };

  const handleViewPassword = async (userId, username) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
      if (response.ok) {
        const users = await response.json();
        const user = users.find(u => u.UserID === userId);
        const plainPassword = user?.PlainPassword || 'Not available';
        const hashedPassword = user?.Password || 'Not available';
        
        setModal({
          isOpen: true,
          type: 'info',
          title: `Password for ${username}`,
          message: `🔑 Plain Password: ${plainPassword}\n\n🔒 Encrypted Hash: ${hashedPassword.substring(0, 30)}...\n\nWarning: Keep this information secure!`,
          onConfirm: null
        });
      }
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to view password', onConfirm: null });
    }
  };

  const handleChangePassword = (userId, username) => {
    setModal({
      isOpen: true,
      type: 'input',
      title: `Change Password for ${username}`,
      message: 'Enter new password:',
      showInput: true,
      inputValue: '',
      inputPlaceholder: 'New password',
      onConfirm: async (newPassword) => {
        if (!newPassword || newPassword.length < 4) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Password must be at least 4 characters', onConfirm: null });
          return;
        }
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
          });
          if (response.ok) {
            setModal({ isOpen: true, type: 'success', title: 'Success', message: 'Password changed successfully!', onConfirm: null });
          }
        } catch (error) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to change password', onConfirm: null });
        }
      }
    });
  };

  const handleResetPassword = (userId, username) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: `Reset Password for ${username}`,
      message: 'This will reset the password to default (123456). Continue?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/reset-password`, {
            method: 'PUT'
          });
          if (response.ok) {
            setModal({ isOpen: true, type: 'success', title: 'Success', message: 'Password reset to 123456', onConfirm: null });
          }
        } catch (error) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to reset password', onConfirm: null });
        }
      }
    });
  };

  const handleAddWorker = async () => {
    if (!newWorkerName.trim()) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Please enter worker name', onConfirm: null });
      return;
    }

    if (workers.includes(newWorkerName.trim())) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Worker already exists', onConfirm: null });
      return;
    }

    setModal({
      isOpen: true,
      type: 'input',
      title: 'Worker Job',
      message: 'What is the worker job?',
      showInput: true,
      inputValue: 'Car Washer',
      inputPlaceholder: 'Enter job title',
      onConfirm: (job) => {
        if (!job) return;
        setModal({
          isOpen: true,
          type: 'input',
          title: 'Worker Status',
          message: 'What is the worker status?',
          showInput: true,
          inputValue: 'Active',
          inputPlaceholder: 'Active/Inactive',
          onConfirm: async (status) => {
            if (!status) return;
            try {
              await operationsService.addWorker(newWorkerName.trim(), job, status);
              setWorkers([...workers, newWorkerName.trim()]);
              setNewWorkerName('');
              setShowAddForm(false);
              setModal({ isOpen: true, type: 'success', title: 'Success', message: `Worker "${newWorkerName.trim()}" added successfully!`, onConfirm: null });
            } catch (error) {
              setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to add worker', onConfirm: null });
            }
          }
        });
      }
    });
  };

  const handleDeleteWorker = async (workerName) => {
    if (workers.length <= 1) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Cannot delete the last worker', onConfirm: null });
      return;
    }

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete worker "${workerName}"?`,
      onConfirm: async () => {
        try {
          await operationsService.deleteWorker(workerName);
          const updatedWorkers = workers.filter(w => w !== workerName);
          setWorkers(updatedWorkers);
          setModal({ isOpen: true, type: 'success', title: 'Success', message: `Worker "${workerName}" deleted successfully!`, onConfirm: null });
        } catch (error) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete worker', onConfirm: null });
        }
      }
    });
  };

  const handleAddService = async () => {
    if (!newServiceName.trim()) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Please enter service name', onConfirm: null });
      return;
    }

    if (additionalServices.includes(newServiceName.trim())) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Service already exists', onConfirm: null });
      return;
    }

    try {
      await operationsService.addAdditionalService(newServiceName.trim());
      const updatedServices = [...additionalServices, newServiceName.trim()];
      setAdditionalServices(updatedServices);
      setNewServiceName('');
      setShowAddServiceForm(false);
      setModal({ isOpen: true, type: 'success', title: 'Success', message: `Service "${newServiceName.trim()}" added successfully!`, onConfirm: null });
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to add service', onConfirm: null });
    }
  };

  const handleEditService = (oldName, newName) => {
    if (!newName.trim()) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Please enter service name', onConfirm: null });
      return;
    }

    if (newName.trim() === oldName) {
      setEditingService(null);
      return;
    }

    if (additionalServices.includes(newName.trim())) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Service already exists', onConfirm: null });
      return;
    }

    const updatedServices = additionalServices.map(s => s === oldName ? newName.trim() : s);
    setAdditionalServices(updatedServices);
    setEditingService(null);
    setModal({ isOpen: true, type: 'success', title: 'Success', message: 'Service updated successfully!', onConfirm: null });
  };

  const handleDeleteService = async (serviceName) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete service "${serviceName}"?`,
      onConfirm: async () => {
        try {
          await operationsService.deleteAdditionalService(serviceName);
          const updatedServices = additionalServices.filter(s => s !== serviceName);
          setAdditionalServices(updatedServices);
          setModal({ isOpen: true, type: 'success', title: 'Success', message: `Service "${serviceName}" deleted successfully!`, onConfirm: null });
        } catch (error) {
          setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete service', onConfirm: null });
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <p>Loading operations data...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button
            onClick={() => window.location.href = '/'}
            className="btn-back"
          >
            ← Back
          </button>
        </div>
        
        <div className="header-center">
          <h1>⚡ Operations Management</h1>
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.9rem',
              color: '#6c757d'
            }}>
              <span>{getRoleInfo(currentUser.role).icon}</span>
              <span>Logged in as: <strong>{currentUser.role}</strong></span>
            </div>
          )}
        </div>
        
        <div style={{ width: '120px' }}></div>
      </div>

      {/* Workers Management Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: 'var(--brand-primary)',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0'
          }}>
            👷 Workers Management
          </h2>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            ➕ Add Worker
          </button>
        </div>

        {/* Add Worker Form */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{
              color: 'var(--brand-primary)',
              fontSize: '1.2rem',
              marginBottom: '1rem'
            }}>
              Add New Worker
            </h3>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Enter worker name..."
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWorker()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              
              <button
                onClick={handleAddWorker}
                className="btn btn-primary"
              >
                Add
              </button>
              
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewWorkerName('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Workers List */}
        <div className="stats-grid">
          {workers.map((worker, index) => (
            <div
              key={worker}
              className="stat-card"
            >
              <div>
                <h4 style={{
                  color: 'var(--brand-primary)',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  margin: '0 0 0.5rem 0'
                }}>
                  👤 {worker}
                </h4>
                <p style={{
                  color: '#6c757d',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Worker #{index + 1}
                </p>
              </div>
              
              <button
                onClick={() => handleDeleteWorker(worker)}
                disabled={workers.length <= 1}
                style={{
                  backgroundColor: workers.length <= 1 ? '#e9ecef' : '#dc3545',
                  color: workers.length <= 1 ? '#6c757d' : 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: workers.length <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>

        {/* Workers Count */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'var(--brand-primary)',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0'
          }}>
            Total Workers: {workers.length}
          </p>
        </div>
      </div>

      {/* User Management Section - Admin Only */}
      {currentUser && hasPermission(currentUser.role, PERMISSIONS.VIEW_USERS) && (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: 'var(--brand-primary)',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0'
          }}>
            👥 User Management
          </h2>
          
          {hasPermission(currentUser?.role, PERMISSIONS.ADD_USERS) && (
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="btn btn-primary"
            >
              ➕ Add User
            </button>
          )}
        </div>

        {/* Add User Form */}
        {showAddUserForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{
              color: 'var(--brand-primary)',
              fontSize: '1.2rem',
              marginBottom: '1rem'
            }}>
              Add New User
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  fontSize: '1rem'
                }}
              />
              
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  fontSize: '1rem'
                }}
              />
              
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  fontSize: '1rem'
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              
              <button onClick={handleAddUser} className="btn btn-primary">Add</button>
              
              <button
                onClick={() => {
                  setShowAddUserForm(false);
                  setNewUser({ username: '', password: '', role: 'user' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Username</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.UserID} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '12px' }}>{user.Username}</td>
                  <td style={{ padding: '12px' }}>
                    {editingUser === user.UserID ? (
                      <select
                        defaultValue={user.Role}
                        onBlur={(e) => handleUpdateUserRole(user.UserID, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateUserRole(user.UserID, e.target.value)}
                        autoFocus
                        style={{
                          padding: '6px',
                          borderRadius: '4px',
                          border: '2px solid var(--brand-primary)'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                      </select>
                    ) : (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: user.Role === 'admin' ? '#dc3545' : user.Role === 'manager' ? '#ffc107' : '#28a745',
                        color: user.Role === 'manager' ? '#212529' : 'white',
                        fontSize: '0.9rem'
                      }}>
                        {user.Role}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: user.Status === 'Active' ? '#28a745' : '#6c757d',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}>
                      {user.Status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {hasPermission(currentUser?.role, PERMISSIONS.EDIT_USERS) && (
                        <button
                          onClick={() => setEditingUser(editingUser === user.UserID ? null : user.UserID)}
                          style={{
                            backgroundColor: '#ffc107',
                            color: '#212529',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Role
                        </button>
                      )}
                      {hasPermission(currentUser?.role, PERMISSIONS.VIEW_PASSWORDS) && (
                        <button
                          onClick={() => handleViewPassword(user.UserID, user.Username)}
                          style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          👁️ Pass
                        </button>
                      )}
                      {hasPermission(currentUser?.role, PERMISSIONS.CHANGE_PASSWORDS) && (
                        <button
                          onClick={() => handleChangePassword(user.UserID, user.Username)}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔑 Change
                        </button>
                      )}
                      {hasPermission(currentUser?.role, PERMISSIONS.RESET_PASSWORDS) && (
                        <button
                          onClick={() => handleResetPassword(user.UserID, user.Username)}
                          style={{
                            backgroundColor: '#fd7e14',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Reset
                        </button>
                      )}
                      {hasPermission(currentUser?.role, PERMISSIONS.DELETE_USERS) && (
                        <button
                          onClick={() => handleDeleteUser(user.UserID, user.Username)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Users Count */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'var(--brand-primary)',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0'
          }}>
            Total Users: {users.length}
          </p>
        </div>
      </div>
      )}

      {/* Additional Services Management Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: 'var(--brand-primary)',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0'
          }}>
            🛠️ Additional Services Management
          </h2>
          
          <button
            onClick={() => setShowAddServiceForm(!showAddServiceForm)}
            className="btn btn-secondary"
          >
            ➕ Add Service
          </button>
        </div>

        {/* Add Service Form */}
        {showAddServiceForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{
              color: '#17a2b8',
              fontSize: '1.2rem',
              marginBottom: '1rem'
            }}>
              Add New Additional Service
            </h3>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Enter service name..."
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e9ecef',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              
              <button
                onClick={handleAddService}
                className="btn btn-primary"
              >
                Add
              </button>
              
              <button
                onClick={() => {
                  setShowAddServiceForm(false);
                  setNewServiceName('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="stats-grid">
          {additionalServices.map((service, index) => {
          const serviceName = typeof service === 'string' ? service : service.Name || service.ServiceName || 'Unknown';
          return (
            <div
              key={`service-${index}-${serviceName}`}
              className="stat-card"
            >
              <div style={{ flex: 1 }}>
                {editingService === serviceName ? (
                  <input
                    type="text"
                    defaultValue={serviceName}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleEditService(serviceName, e.target.value);
                      }
                    }}
                    onBlur={(e) => handleEditService(serviceName, e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '2px solid #17a2b8',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}
                  />
                ) : (
                  <>
                    <h4 style={{
                      color: '#17a2b8',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      margin: '0 0 0.5rem 0'
                    }}>
                      🛠️ {serviceName}
                    </h4>
                    <p style={{
                      color: '#6c757d',
                      fontSize: '0.9rem',
                      margin: '0'
                    }}>
                      Service #{index + 1}
                    </p>
                  </>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setEditingService(editingService === serviceName ? null : serviceName)}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit
                </button>
                
                <button
                  onClick={() => handleDeleteService(serviceName)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {/* Services Count */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#d1ecf1',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#0c5460',
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0'
          }}>
            Total Additional Services: {additionalServices.length}
          </p>
        </div>
      </div>
      
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm ? () => {
          if (modal.showInput) {
            modal.onConfirm(modal.inputValue);
          } else {
            modal.onConfirm();
          }
          setModal({ ...modal, isOpen: false });
        } : null}
        showInput={modal.showInput}
        inputValue={modal.inputValue}
        onInputChange={(value) => setModal({ ...modal, inputValue: value })}
        inputPlaceholder={modal.inputPlaceholder}
      />
    </div>
  );
};

export default OperationsPage;