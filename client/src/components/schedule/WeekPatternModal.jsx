import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './WeekPatternModal.css';
import { FiCalendar, FiCheck, FiX, FiArrowRight, FiInfo, FiClock, FiLoader, FiChevronDown } from 'react-icons/fi';

const WeekPatternModal = ({
  isOpen,
  onClose,
  customerInfo,
  changedAppointment,
  weekAppointments,
  onApplyChanges,
}) => {
  const [selectedWashTypes, setSelectedWashTypes] = useState({});
  const [washHistory, setWashHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const fetchWashHistory = useCallback(async () => {
    const customerId = customerInfo?.customerId;
    if (!customerId || washHistory.length > 0) return; // Don't refetch if already loaded

    const isBiWeekly = customerInfo?.packageType?.toLowerCase().includes('bi week');
    const limit = isBiWeekly ? 12 : 6;

    setIsLoadingHistory(true);
    setErrorHistory(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/wash-history/${customerId}?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setWashHistory(data.history || []);
      } else {
        const errorData = await response.json();
        setErrorHistory(errorData.error || `Failed to fetch history`);
      }
    } catch (error) {
      setErrorHistory('Network error');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [customerInfo?.customerId, customerInfo?.packageType, washHistory.length]);

  useEffect(() => {
    if (isOpen) {
      const initialTypes = {};
      if (weekAppointments) {
        weekAppointments.forEach(apt => {
          const key = `${apt.day}-${apt.carPlate}-${apt.time}`;
          initialTypes[key] = apt.washType;
        });
      }
      setSelectedWashTypes(initialTypes);
      setIsHistoryVisible(false);
      setWashHistory([]); 
    }
  }, [isOpen, weekAppointments]);

  const handleToggleHistory = () => {
    const newVisibility = !isHistoryVisible;
    setIsHistoryVisible(newVisibility);
    if (newVisibility) {
      fetchWashHistory();
    }
  };

  const handleWashTypeChange = (day, carPlate, time, newWashType) => {
    const key = `${day}-${carPlate}-${time}`;
    setSelectedWashTypes(prev => ({ ...prev, [key]: newWashType }));
  };

  const handleApply = () => {
    const changes = [];
    remainingAppointments.forEach(apt => {
      const key = `${apt.day}-${apt.carPlate}-${apt.time}`;
      const newWashType = selectedWashTypes[key];
      const originalWashType = apt.washType;

      if (newWashType && newWashType !== originalWashType) {
        changes.push({
          taskId: `${apt.customerId}-${apt.day}-${apt.time}-${apt.carPlate}`,
          day: apt.day,
          carPlate: apt.carPlate,
          oldWashType: originalWashType,
          newWashType: newWashType,
        });
      }
    });
    onApplyChanges(changes);
    onClose();
  };

  const remainingAppointments = useMemo(() =>
    weekAppointments?.filter(apt =>
      !(apt.day === changedAppointment?.day && apt.carPlate === changedAppointment?.carPlate && apt.time === changedAppointment?.time)
    ) || [],
    [weekAppointments, changedAppointment]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-v2" onClick={onClose}>
      <div className="modal-container-v2" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header-v2">
          <FiCalendar className="header-icon-v2" />
          <h3>Update Weekly Schedule?</h3>
          <button className="close-btn-v2" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-content-v2">
          <div className="change-summary-v2">
            <div className="car-info-v2">
              {customerInfo.customerName} - <strong>{changedAppointment.carPlate}</strong>
            </div>
            <div className="change-details-v2">
              <span className="day-v2">{changedAppointment.day} at {changedAppointment.time}</span>
              <span className={`wash-badge-v2 ${changedAppointment.oldWashType?.toLowerCase()}`}>{changedAppointment.oldWashType}</span>
              <FiArrowRight className="arrow-icon-v2" />
              <span className={`wash-badge-v2 ${changedAppointment.newWashType?.toLowerCase()}`}>{changedAppointment.newWashType}</span>
            </div>
          </div>

          {remainingAppointments.length > 0 ? (
            <>
              <p className="instruction-v2">Apply this change to other cars/days this week?</p>
              <div className="appointments-list-v2">
                {remainingAppointments.map((apt) => {
                  const key = `${apt.day}-${apt.carPlate}-${apt.time}`;
                  const currentType = selectedWashTypes[key] || apt.washType;
                  return (
                    <div key={key} className="appointment-row-v2">
                      <span className="appointment-day-v2">{apt.day} at {apt.time} - <strong>{apt.carPlate}</strong></span>
                      <div className="wash-type-toggle-v2">
                        <button
                          className={`toggle-btn-v2 ${currentType === 'EXT' ? 'active' : ''}`}
                          onClick={() => handleWashTypeChange(apt.day, apt.carPlate, apt.time, 'EXT')}
                        >
                          EXT
                        </button>
                        <button
                          className={`toggle-btn-v2 ${currentType === 'INT' ? 'active' : ''}`}
                          onClick={() => handleWashTypeChange(apt.day, apt.carPlate, apt.time, 'INT')}
                        >
                          INT
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="no-remaining-v2">
                <FiInfo />
                <span>No other appointments this week to update.</span>
            </div>
          )}

          {/* Collapsible Wash History */}
          <div className="history-section-v2">
            <button className="history-toggle-btn-v2" onClick={handleToggleHistory}>
              <FiClock />
              <span>Recent Wash History</span>
              <FiChevronDown className={`chevron-icon-v2 ${isHistoryVisible ? 'open' : ''}`} />
            </button>
            {isHistoryVisible && (
              <div className="history-content-v2">
                {isLoadingHistory ? (
                  <div className="history-loader-v2"><FiLoader className="spinner" /> Loading...</div>
                ) : errorHistory ? (
                  <div className="history-error-v2"><FiInfo /> {errorHistory}</div>
                ) : washHistory.length > 0 ? (
                  <ul className="history-list-v2">
                    {washHistory.map((wash, index) => (
                      <li key={index} className="history-item-v2">
                        <span className="history-date-v2">{wash.washDate}</span>
                        <span className="history-car-v2">{wash.carPlate}</span>
                        <span className={`wash-badge-v2 small ${wash.washType?.toLowerCase()}`}>{wash.washType}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="history-empty-v2">No recent history found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions-v2">
          <button className="action-btn-v2 skip-btn-v2" onClick={onClose}>
            <FiX /> Just For Today
          </button>
          <button 
            className="action-btn-v2 apply-btn-v2" 
            onClick={handleApply}
            disabled={remainingAppointments.length === 0}
          >
            <FiCheck /> Apply to Week
          </button>
        </div>

      </div>
    </div>
  );
};

export default WeekPatternModal;
