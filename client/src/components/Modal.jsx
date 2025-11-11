import React from 'react';
const Modal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, showInput = false, inputValue = '', onInputChange, inputPlaceholder = '' }) => {
  if (!isOpen) return null;
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'confirm': return '❓';
      case 'input': return '📝';
      default: return 'ℹ️';
    }
  };
  const getButtonColor = () => {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'confirm': return '#007bff';
      default: return '#6c757d';
    }
  };
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={handleOverlayClick}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '2rem',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {getIcon()}
        </div>
        {title && (
          <h3 style={{
            margin: '0 0 1rem 0',
            color: '#333',
            fontSize: '1.3rem'
          }}>
            {title}
          </h3>
        )}
        <p style={{
          margin: '0 0 1.5rem 0',
          color: '#666',
          fontSize: '1rem',
          lineHeight: '1.4'
        }}>
          {message}
        </p>
        {showInput && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={inputPlaceholder}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '1.5rem',
              border: '2px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '1rem',
              outline: 'none'
            }}
            autoFocus
          />
        )}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {type === 'confirm' || showInput ? (
            <>
              <button
                onClick={onConfirm}
                style={{
                  backgroundColor: getButtonColor(),
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {showInput ? 'OK' : 'Yes'}
              </button>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              style={{
                backgroundColor: getButtonColor(),
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default Modal;