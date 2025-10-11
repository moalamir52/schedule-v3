import React, { useState, useEffect } from 'react';
import FinancialReports from '../components/reports/FinancialReports';
import ClientAnalytics from '../components/reports/ClientAnalytics';
import PerformanceMetrics from '../components/reports/PerformanceMetrics';
import OperationsReport from '../components/reports/OperationsReport';
import AIInsights from '../components/reports/AIInsights';
import AuditReportPage from './AuditReportPage';

const StatCard = ({ title, value, subtitle, color, icon }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ color }}>{icon}</div>
    <div className="stat-content">
      <h3 style={{ color }}>{value}</h3>
      <p>{title}</p>
      <small>{subtitle}</small>
    </div>
  </div>
);

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('overview');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Quick summary of key metrics',
      icon: '📊',
      color: '#28a745'
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      description: 'Revenue, payments, and financial analytics',
      icon: '💰',
      color: '#17a2b8'
    },
    {
      id: 'clients',
      title: 'Client Analytics',
      description: 'Customer insights and behavior analysis',
      icon: '👥',
      color: '#6f42c1'
    },
    {
      id: 'performance',
      title: 'Performance Metrics',
      description: 'Worker efficiency and service quality',
      icon: '📈',
      color: '#fd7e14'
    },
    {
      id: 'operations',
      title: 'Operations',
      description: 'Operational reports and efficiency metrics',
      icon: '⚙️',
      color: '#dc3545'
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'System changes and user activity tracking',
      icon: '🔍',
      color: '#6c757d'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'Smart recommendations and growth strategies',
      icon: '🤖',
      color: '#e91e63'
    }
  ];

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'financial':
        return <FinancialReports onBack={() => setActiveReport('overview')} />;
      case 'clients':
        return <ClientAnalytics onBack={() => setActiveReport('overview')} />;
      case 'performance':
        return <PerformanceMetrics onBack={() => setActiveReport('overview')} />;
      case 'operations':
        return <OperationsReport onBack={() => setActiveReport('overview')} />;
      case 'audit':
        return <AuditReportPage />;
      case 'ai-insights':
        return <AIInsights onBack={() => setActiveReport('overview')} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="home-page">
      <div className="page-header">
        <div className="header-left">
          <button 
            onClick={() => window.location.href = '/'} 
            className="btn-back"
          >
            ← Dashboard
          </button>
        </div>
        
        <div className="header-center">
          <h1>📊 Reports & Analytics</h1>
          <p>Comprehensive business insights and performance metrics</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            🖨️ Print Reports
          </button>
        </div>
      </div>

      <div className="modules-grid">
        {reportTypes.filter(report => report.id !== 'overview').map(report => (
          <div
            key={report.id}
            className="module-card"
            onClick={() => setActiveReport(report.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="module-icon" style={{ color: report.color }}>
              {report.icon}
            </div>
            <h3>{report.title}</h3>
            <p>{report.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Stats Overview */}
      <QuickStatsOverview />
    </div>
  );

  return renderActiveReport();
};

const QuickStatsOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      // Load basic stats from existing APIs
      const [clientsRes, workersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/clients`),
        fetch(`${import.meta.env.VITE_API_URL}/api/workers`)
      ]);

      const clients = await clientsRes.json();
      const workers = await workersRes.json();

      const activeClients = clients.filter(c => c.Status === 'Active').length;
      const activeWorkers = workers.filter(w => w.Status === 'Active').length;
      
      // Calculate estimated monthly revenue
      const monthlyRevenue = clients
        .filter(c => c.Status === 'Active')
        .reduce((sum, client) => {
          const fee = parseFloat(client.Fee) || 0;
          return sum + fee;
        }, 0);

      setStats({
        activeClients,
        activeWorkers,
        monthlyRevenue,
        totalClients: clients.length
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <p>Loading overview...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
        📈 Quick Overview
      </h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#28a745' }}>👥</div>
          <div className="stat-content">
            <h3 style={{ color: '#28a745' }}>{stats.activeClients}</h3>
            <p>Active Clients</p>
            <small>out of {stats.totalClients} total</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#17a2b8' }}>👷</div>
          <div className="stat-content">
            <h3 style={{ color: '#17a2b8' }}>{stats.activeWorkers}</h3>
            <p>Active Workers</p>
            <small>operational staff</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fd7e14' }}>💰</div>
          <div className="stat-content">
            <h3 style={{ color: '#fd7e14' }}>{stats.monthlyRevenue.toLocaleString()} AED</h3>
            <p>Monthly Revenue</p>
            <small>estimated from active clients</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6f42c1' }}>📊</div>
          <div className="stat-content">
            <h3 style={{ color: '#6f42c1' }}>{(stats.monthlyRevenue / stats.activeClients || 0).toFixed(0)} AED</h3>
            <p>Avg Revenue per Client</p>
            <small>monthly average</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;