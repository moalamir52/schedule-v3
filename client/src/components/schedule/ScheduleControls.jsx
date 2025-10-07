import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiSettings, FiEye, FiBarChart, FiZap, FiPlus, FiDownload, FiAlertTriangle } from 'react-icons/fi';

function ScheduleControls({ onAutoAssign, onClear, onViewChange, onAdd, onExport, onCronSettings, currentView, currentWeekOffset, onWeekChange, viewMode, onViewModeChange }) {
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.actions-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

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
    <div style={controlBarStyle}>
      <h2 style={{ color: '#1e7e34', margin: 0 }}>
        {viewMode === 'today' ? `Today - ${getCurrentDateString()}` : `Week ${currentWeekOffset === 0 ? '(Current)' : currentWeekOffset > 0 ? `+${currentWeekOffset}` : currentWeekOffset}`}
      </h2>
      
      <div style={controlGroupStyle}>
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
          This Week
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
              onClick={onAutoAssign}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff3e0';
                e.currentTarget.style.color = '#f57c00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#495057';
              }}
            >
              <FiZap style={{ color: '#ff9800' }} />
              Auto
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
              onClick={() => onViewChange('weekly')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.color = '#1976d2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#495057';
              }}
            >
              <FiEye style={{ color: '#2196f3' }} />
              Weekly View
            </div>
            <div 
              style={dropdownItemStyle}
              onClick={() => onViewChange('overview')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3e5f5';
                e.currentTarget.style.color = '#7b1fa2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#495057';
              }}
            >
              <FiBarChart style={{ color: '#9c27b0' }} />
              Overview
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
              Add
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
              style={dropdownItemStyle}
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
            <div 
              style={{ ...dropdownItemStyle, borderBottom: 'none' }}
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
              Conflicts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScheduleControls;