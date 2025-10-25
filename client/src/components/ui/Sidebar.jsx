import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiUsers, FiCalendar, FiMenu, FiX, FiCode, FiCheckSquare, FiLogOut, FiSettings, FiBarChart2 } from 'react-icons/fi';
import authService from '../../services/authService.js';

function Sidebar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });


  const sidebarStyle = {
    position: 'fixed',
    left: isOpen ? 0 : '-250px',
    top: 0,
    height: '100vh',
    width: '250px',
    backgroundColor: '#1e7e34',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
  };

  const toggleButtonStyle = {
    position: 'fixed',
    top: '20px',
    left: isOpen ? '260px' : '20px',
    backgroundColor: '#1e7e34',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'left 0.3s ease',
    zIndex: 1001,
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    color: 'white',
    textDecoration: 'none',
    transition: 'background-color 0.3s',
    borderBottom: '1px solid #28a745'
  };

  const iconStyle = {
    marginRight: '15px',
    fontSize: '18px'
  };

  const headerStyle = {
    padding: '30px 20px 20px',
    borderBottom: '2px solid #28a745',
    marginBottom: '10px'
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
          onClick={() => {
            setIsOpen(false);
            localStorage.setItem('sidebarOpen', JSON.stringify(false));
          }}
        />
      )}

      {/* Toggle Button */}
      <button
        style={toggleButtonStyle}
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          localStorage.setItem('sidebarOpen', JSON.stringify(newState));
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#1e7e34'}
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={headerStyle}>
          <h2 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: '18px',
            textAlign: 'center'
          }}>
            🚗 GLOGO
          </h2>
          <p style={{ 
            color: '#a8e6a3', 
            margin: '5px 0 0 0', 
            fontSize: '12px',
            textAlign: 'center'
          }}>
            Car Wash System
          </p>
          {user && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                {user.role === 'admin' ? '👑' : user.role === 'manager' ? '👔' : '👤'} {user.role.toUpperCase()}
              </div>
              <button
                onClick={async () => {
                  const currentPassword = prompt('Enter current password:');
                  if (!currentPassword) return;
                  const newPassword = prompt('Enter new password:');
                  if (!newPassword || newPassword.length < 4) {
                    alert('Password must be at least 4 characters');
                    return;
                  }
                  
                  try {
                    // Get username from JWT token
                    const currentUser = authService.getCurrentUser();
                    if (!currentUser) {
                      alert('Please login again');
                      return;
                    }
                    
                    // Use user ID as username for now
                    const username = currentUser.id || 'user';
                    
                    await authService.changeMyPassword(username, currentPassword, newPassword);
                    alert('Password changed successfully!');
                  } catch (error) {
                    alert('Error: ' + error.message);
                  }
                }}
                style={{
                  marginTop: '5px',
                  padding: '4px 8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                🔑 Change Password
              </button>
            </div>
          )}
        </div>

        <nav style={{ paddingTop: '20px' }}>
          <Link 
            to="/" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FiHome style={iconStyle} />
            Dashboard
          </Link>
          
          <Link 
            to="/clients" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FiUsers style={iconStyle} />
            Clients
          </Link>
          
          <Link 
            to="/schedule" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FiCalendar style={iconStyle} />
            Schedule
          </Link>
          
          <Link 
            to="/tasks" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FiCheckSquare style={iconStyle} />
            Daily Tasks
          </Link>
          
          <Link 
            to="/operations" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FiSettings style={iconStyle} />
            Operations
          </Link>
          
          <Link 
            to="/reports" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FiBarChart2 style={iconStyle} />
            Reports & Analytics
          </Link>
          
          <Link 
            to="/cleanup" 
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc3545'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span style={{...iconStyle, fontSize: '16px'}}>🧹</span>
            System Cleanup
          </Link>
          

          
          {/* Logout Button */}
          <div
            style={{
              ...linkStyle,
              cursor: 'pointer',
              borderTop: '2px solid #dc3545',
              marginTop: '20px',
              backgroundColor: '#dc3545'
            }}
            onClick={onLogout}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            <FiLogOut style={iconStyle} />
            Logout
          </div>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;