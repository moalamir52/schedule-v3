import '../index.css';
import { Link } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import { FiUsers, FiCalendar, FiClipboard, FiFileText, FiBarChart2, FiSettings } from 'react-icons/fi';

function DashboardPage() {
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
      link: '#'
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
      </div>

      {/* Menu Cards Grid */}
      <div className="modules-grid">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.link}
            onClick={() => {
              console.log(`Navigating to: ${item.title} - ${item.link}`);
              if (item.id === 'daily-tasks') {
                console.log('Daily Tasks clicked - should navigate to /tasks');
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