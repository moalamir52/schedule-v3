import { useEffect } from 'react';
function UndoNotification({ isVisible, message, onUndo, onDismiss, countdown }) {
  useEffect(() => {
    if (isVisible && countdown > 0) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          onDismiss();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, countdown, onDismiss]);
  if (!isVisible) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#343a40',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      minWidth: '300px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', marginBottom: '5px' }}>
          {message}
        </div>
        <div style={{ fontSize: '12px', color: '#adb5bd' }}>
          Auto-dismiss in {countdown}s
        </div>
      </div>
      <button
        onClick={onUndo}
        style={{
          backgroundColor: '#ffc107',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        UNDO
      </button>
      <button
        onClick={onDismiss}
        style={{
          backgroundColor: 'transparent',
          color: '#adb5bd',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0',
          width: '20px',
          height: '20px'
        }}
      >
        ✕
      </button>
    </div>
  );
}
export default UndoNotification;