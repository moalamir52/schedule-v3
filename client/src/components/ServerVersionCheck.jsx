import React, { useState, useEffect } from 'react';
const ServerVersionCheck = () => {
  const [version, setVersion] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/version`);
        const data = await response.json();
        setVersion(data);
      } catch (err) {
        setError(err.message);
      }
    };
    checkVersion();
  }, []);
  if (error) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: '#f8d7da', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        Server Version: Unknown (Error: {error})
      </div>
    );
  }
  if (!version) return null;
  const isLatest = version.version === '2.1.0';
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: isLatest ? '#d4edda' : '#fff3cd', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      Server v{version.version} {isLatest ? '✅' : '⚠️ Update needed'}
    </div>
  );
};
export default ServerVersionCheck;