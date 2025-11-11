import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiSettings, FiPlus, FiDownload, FiAlertTriangle } from 'react-icons/fi';
import Modal from '../Modal'; // Import the Modal component

function ScheduleControls({ onAutoAssign, onSyncNewCustomers, onGenerateNew, onForceReset, onToggleShowAllSlots, showAllSlots, onClear, onViewChange, onAdd, onExport, onCronSettings, currentView, currentWeekOffset, onWeekChange, viewMode, onViewModeChange }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info', onConfirm: null });

  const openModal = ({ title, message, type = 'info', onConfirm }) => {
    setModalContent({ title, message, type, onConfirm });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.actions-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleViewSkippedCustomers = async () => {
    setShowDropdown(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/skipped-customers`);
      const data = await response.json();
      
      if (data.success && data.skippedCustomers.length > 0) {
        const skippedList = (
          <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '15px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', color: '#333' }}>
              {data.skippedCustomers.map((customer, index) => (
                <li 
                  key={`${customer.customerId}-${index}`} 
                  style={{ 
                    marginBottom: '12px', 
                    padding: '12px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    borderLeft: '5px solid #28a745',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <strong style={{ color: '#1e7e34' }}>{customer.customerName}</strong>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>
                    {customer.day} {customer.time} ({customer.carPlate})
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
        
        openModal({
          title: `⚠️ Skipped Customers (${data.skippedCustomers.length})`,
          message: skippedList,
          type: 'warning',
        });
      } else {
        openModal({
          title: '✅ No Skipped Customers',
          message: 'There are currently no skipped customers.',
          type: 'success',
        });
      }
    } catch (error) {
      openModal({
        title: '❌ Error',
        message: `Failed to fetch skipped customers: ${error.message}`,
        type: 'error',
      });
    }
  };

  const handleClearAllData = async () => {
    setShowDropdown(false);
    openModal({
      title: '🗑️ Clear Schedule Table?',
      message: 'This will delete ALL scheduled tasks. This action cannot be undone. Customers and Workers will NOT be affected. Are you sure?',
      type: 'confirm',
      onConfirm: async () => {
        closeModal();
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/clear-all`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          if (data.success) {
            if (onAutoAssign) {
              onAutoAssign();
            }
            openModal({
              title: '✅ Success',
              message: 'All scheduled tasks have been successfully deleted.',
              type: 'success',
            });
          } else {
            openModal({
              title: '❌ Failed',
              message: `Failed to clear schedule: ${data.error || 'Unknown error'}`,
              type: 'error',
            });
          }
        } catch (err) {
          openModal({
            title: '❌ Error',
            message: `An error occurred while clearing the schedule: ${err.message}`,
            type: 'error',
          });
        }
      },
    });
  };

  const controlBarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  };
  const controlGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };
  const buttonStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };
  const navButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#1e7e34',
    color: 'white',
    padding: '10px'
  };
  const weekButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: 'white',
    fontWeight: '600'
  };
  const todayButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#17a2b8',
    color: 'white'
  };
  const actionsButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white'
  };
  const actionsContainerStyle = {
    position: 'relative'
  };
  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '180px',
    marginTop: '8px',
    overflow: 'hidden'
  };
  const dropdownItemStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f8f9fa',
    fontSize: '14px',
    color: '#495057',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '500'
  };
  const getCurrentDateString = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        onConfirm={modalContent.onConfirm}
      />
      <div style={controlBarStyle}>
        <h2 style={{ color: '#1e7e34', margin: 0 }}>
          {viewMode === 'today' ? `Today - ${getCurrentDateString()}` : `Week ${currentWeekOffset === 0 ? '(Current)' : currentWeekOffset > 0 ? `+${currentWeekOffset}` : currentWeekOffset}`}
        </h2>
        <div style={controlGroupStyle}>
          <button 
            style={{
              ...buttonStyle,
              backgroundColor: '#007bff',
              color: 'white',
              fontWeight: '600'
            }}
            onClick={onAutoAssign}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            🔄 Update
          </button>
          <button 
            style={navButtonStyle}
            onClick={() => onWeekChange(currentWeekOffset - 1)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1e7e34'}
          >
            <FiChevronLeft />
          </button>
          <button 
            style={{
              ...weekButtonStyle,
              backgroundColor: currentWeekOffset === 0 ? '#28a745' : '#6c757d'
            }}
            onClick={() => {
              onViewModeChange('week');
              onWeekChange(0); // العودة للأسبوع الحالي
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = currentWeekOffset === 0 ? '#218838' : '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = currentWeekOffset === 0 ? '#28a745' : '#6c757d'}
          >
            {currentWeekOffset === 0 ? 'This Week' : 'Current Week'}
          </button>
          <button 
            style={navButtonStyle}
            onClick={() => onWeekChange(currentWeekOffset + 1)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#28a745'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1e7e34'}
          >
            <FiChevronRight />
          </button>
          <button 
            style={{
              ...todayButtonStyle,
              backgroundColor: viewMode === 'today' ? '#17a2b8' : '#6c757d'
            }}
            onClick={() => onViewModeChange('today')}
            onMouseEnter={(e) => e.target.style.backgroundColor = viewMode === 'today' ? '#138496' : '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = viewMode === 'today' ? '#17a2b8' : '#6c757d'}
          >
            Today
          </button>
          <button 
            style={{
              ...buttonStyle,
              backgroundColor: showAllSlots ? '#28a745' : '#6c757d',
              color: 'white',
              fontWeight: '600'
            }}
            onClick={onToggleShowAllSlots}
            onMouseEnter={(e) => e.target.style.backgroundColor = showAllSlots ? '#218838' : '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = showAllSlots ? '#28a745' : '#6c757d'}
          >
            📊 {showAllSlots ? 'Hide All Slots' : 'Show All Slots'}
          </button>
        </div>
        <div style={actionsContainerStyle} className="actions-container">
          <button 
            style={actionsButtonStyle}
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            <FiSettings />
            Actions
          </button>
          {showDropdown && (
            <div style={dropdownStyle}>
              <div 
                style={dropdownItemStyle}
                onClick={() => {
                  onSyncNewCustomers();
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8f5e8';
                  e.currentTarget.style.color = '#2e7d32';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                🔄 Add New Customers
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={() => {
                  onGenerateNew();
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                  e.currentTarget.style.color = '#1565c0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                🔄 Smart Auto-Schedule
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={handleViewSkippedCustomers}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff3e0';
                  e.currentTarget.style.color = '#f57c00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                ⚠️ View Skipped Customers
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={handleClearAllData}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffebee';
                  e.currentTarget.style.color = '#c62828';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                🗑️ Clear All Data
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={onClear}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffebee';
                  e.currentTarget.style.color = '#c62828';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                <FiAlertTriangle style={{ color: '#f44336' }} />
                Clear Schedule
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={() => {
                  onAdd();
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8f5e8';
                  e.currentTarget.style.color = '#2e7d32';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                <FiPlus style={{ color: '#4caf50' }} />
                Add Manual Appointment
              </div>
              <div 
                style={dropdownItemStyle}
                onClick={() => {
                  onExport();
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0f2f1';
                  e.currentTarget.style.color = '#00695c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                <FiDownload style={{ color: '#009688' }} />
                Export
              </div>
              <div 
                style={{ ...dropdownItemStyle, borderBottom: 'none' }}
                onClick={() => {
                  onCronSettings();
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff3e0';
                  e.currentTarget.style.color = '#e65100';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                ⏰ Schedule Settings
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default ScheduleControls;