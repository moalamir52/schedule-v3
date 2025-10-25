import '../index.css';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaCar } from 'react-icons/fa';
import { FiUsers, FiCalendar, FiClipboard, FiFileText, FiBarChart2, FiSettings } from 'react-icons/fi';

function DashboardPage() {
  const [weekStatus, setWeekStatus] = useState(null);
  
  useEffect(() => {
    // Check week status on load
    const checkWeekStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-schedule/check-new-week`);
        const data = await response.json();
        setWeekStatus(data);
      } catch (err) {
        console.warn('Failed to check week status:', err.message);
      }
    };
    
    checkWeekStatus();
  }, []);
  const menuItems = [
    {
      id: 'clients',
      title: 'Clients Management',
      description: 'Manage client information, add new clients, view client details',
      icon: <FiUsers />,
      color: '#28a745',
      bgColor: '#d4edda',
      link: '/clients'
    },
    {
      id: 'schedule',
      title: 'Workers Schedule',
      description: 'Manage worker schedules, appointments, and daily tasks',
      icon: <FiCalendar />,
      color: '#17a2b8',
      bgColor: '#d1ecf1',
      link: '/schedule'
    },
    {
      id: 'daily-tasks',
      title: 'Daily Tasks',
      description: 'Approve work and manage daily task assignments',
      icon: <FiClipboard />,
      color: '#dc3545',
      bgColor: '#f8d7da',
      link: '/tasks'
    },
    {
      id: 'invoices',
      title: 'Invoice System',
      description: 'Create invoices, track payments, reprint old invoices',
      icon: <FiFileText />,
      color: '#548235',
      bgColor: '#DAF2D0',
      link: '/invoices'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'View financial reports, client analytics, performance metrics',
      icon: <FiBarChart2 />,
      color: '#6f42c1',
      bgColor: '#e2d9f3',
      link: '/reports'
    },
    {
      id: 'operations',
      title: 'Operations',
      description: 'Manage workers, schedules, and operational settings',
      icon: <FiSettings />,
      color: '#fd7e14',
      bgColor: '#ffeaa7',
      link: '/operations'
    }
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <h1>🚗 GLOGO Car Wash</h1>
        <p>Management System Dashboard</p>
        
        {/* Week Status Notification */}
        {weekStatus && weekStatus.weekGenerated && (
          <div style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '15px',
            color: '#155724',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            ✅ <strong>New Week Generated!</strong> {weekStatus.message}
          </div>
        )}
        
        {weekStatus && !weekStatus.weekGenerated && weekStatus.day && (weekStatus.day === 'Sunday' || weekStatus.day === 'Monday') && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '15px',
            color: '#856404',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            🗓️ <strong>Week Transition:</strong> It's {weekStatus.day} - Consider generating next week's schedule
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={async () => {
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-schedule/check-new-week`);
              const data = await response.json();
              
              if (data.success) {
                alert(`✅ ${data.message}\n\nDay: ${data.day}\nStatus: ${data.weekGenerated || data.currentWeekStatus}`);
              } else {
                alert('❌ Failed to check/generate new week: ' + data.error);
              }
            } catch (err) {
              alert('❌ Error: ' + err.message);
            }
          }}
          style={{
            background: '#28a745',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(40, 167, 69, 0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#218838';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#28a745';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🗓️ Check/Generate New Week
        </button>
        
        <button
          onClick={async () => {
            // Show week options with actual dates
            const getWeekDates = (offset) => {
              const today = new Date();
              const currentDay = today.getDay();
              
              let mondayOfWeek = new Date(today);
              if (currentDay === 0) {
                mondayOfWeek.setDate(today.getDate() + 1);
              } else if (currentDay === 1) {
                // Already Monday
              } else {
                mondayOfWeek.setDate(today.getDate() - currentDay + 1);
              }
              
              mondayOfWeek.setDate(mondayOfWeek.getDate() + (offset * 7));
              const saturdayOfWeek = new Date(mondayOfWeek);
              saturdayOfWeek.setDate(mondayOfWeek.getDate() + 5);
              
              const startDate = mondayOfWeek.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
              });
              const endDate = saturdayOfWeek.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
              });
              
              return `${startDate} - ${endDate}`;
            };
            
            const weekOptions = [
              { offset: 0, label: `This Week (${getWeekDates(0)})` },
              { offset: 1, label: `Next Week (${getWeekDates(1)})` },
              { offset: 2, label: `Week After Next (${getWeekDates(2)})` },
              { offset: 3, label: `3 Weeks Ahead (${getWeekDates(3)})` }
            ];
            
            const optionsText = weekOptions.map((opt, index) => 
              `${index + 1}. ${opt.label}`
            ).join('\n');
            
            const choice = prompt(
              `Select which week to generate:\n\n${optionsText}\n\nEnter number (1-4):`
            );
            
            if (!choice) return;
            
            const choiceNum = parseInt(choice);
            if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > 4) {
              alert('❌ Please enter a valid number (1-4)');
              return;
            }
            
            const selectedWeek = weekOptions[choiceNum - 1];
            
            try {
              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-schedule/force-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekOffset: selectedWeek.offset })
              });
              
              const data = await response.json();
              
              if (data.success) {
                alert(`✅ Schedule Generated!\n\n📅 Week: ${selectedWeek.label}\n📋 Tasks Generated: ${data.generatedData?.totalAppointments || 'N/A'}`);
              } else {
                alert('❌ Failed to generate week: ' + data.error);
              }
            } catch (err) {
              alert('❌ Error: ' + err.message);
            }
          }}
          style={{
            background: '#17a2b8',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(23, 162, 184, 0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#138496';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#17a2b8';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ⚡ Force Generate Week
        </button>
      </div>

      {/* Menu Cards Grid */}
      <div className="modules-grid">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.link}
            onClick={() => {

              if (item.id === 'daily-tasks') {

              }
            }}
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div className="module-card">
              {/* Card Content */}
              <div>
                {/* Icon */}
                <div className="module-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>

                {/* Title */}
                <h3>{item.title}</h3>

                {/* Description */}
                <p>{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '3rem',
        color: '#6c757d',
        fontSize: '0.9rem'
      }}>
        <p>Developed by Mihamed Alami • GLOGO Car Wash Management System v3.0</p>
      </div>
    </div>
  );
}

export default DashboardPage;