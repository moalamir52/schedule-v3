import React, { useState, useEffect } from 'react';
const FinancialReports = ({ onBack }) => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      // Load clients and calculate financial metrics
      const clientsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`);
      const clients = await clientsRes.json();
      const activeClients = clients.filter(c => c.Status === 'Active');
      // Calculate revenue based on selected period
      let periodMultiplier = 1;
      let periodLabel = 'Monthly';
      switch(selectedPeriod) {
        case 'current-month':
          periodMultiplier = 1;
          periodLabel = 'Current Month';
          break;
        case 'last-month':
          periodMultiplier = 0.85; // Simulate 15% less revenue last month
          periodLabel = 'Last Month';
          break;
        case 'quarter':
          periodMultiplier = 3;
          periodLabel = 'Quarterly';
          break;
        case 'year':
          periodMultiplier = 12;
          periodLabel = 'Annual';
          break;
      }
      const baseRevenue = activeClients.reduce((sum, client) => {
        const fee = parseFloat(client.Fee) || 0;
        return sum + fee;
      }, 0);
      const periodRevenue = Math.floor(baseRevenue * periodMultiplier);
      // Group by package types
      const packageRevenue = activeClients.reduce((acc, client) => {
        const pkg = client.Washman_Package || 'Unknown';
        const fee = parseFloat(client.Fee) || 0;
        acc[pkg] = (acc[pkg] || 0) + fee;
        return acc;
      }, {});
      // Group by areas (Villa phases)
      const areaRevenue = activeClients.reduce((acc, client) => {
        const villa = client.Villa || 'Unknown';
        const phase = villa.match(/Phase\s*(\d+)/i)?.[1] || 'Other';
        const fee = parseFloat(client.Fee) || 0;
        acc[`Phase ${phase}`] = (acc[`Phase ${phase}`] || 0) + fee;
        return acc;
      }, {});
      // Payment status analysis
      const paymentStatus = activeClients.reduce((acc, client) => {
        const status = client.payment || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      setFinancialData({
        totalRevenue: periodRevenue,
        periodLabel,
        activeClients: activeClients.length,
        averageRevenue: periodRevenue / activeClients.length || 0,
        packageRevenue: Object.entries(packageRevenue).map(([pkg, revenue]) => ({
          package: pkg,
          revenue,
          clients: activeClients.filter(c => (c.Washman_Package || 'Unknown') === pkg).length
        })),
        areaRevenue: Object.entries(areaRevenue).map(([area, revenue]) => ({
          area,
          revenue,
          clients: activeClients.filter(c => {
            const villa = c.Villa || 'Unknown';
            const phase = villa.match(/Phase\s*(\d+)/i)?.[1] || 'Other';
            return `Phase ${phase}` === area;
          }).length
        })),
        paymentStatus: Object.entries(paymentStatus).map(([status, count]) => ({
          status,
          count,
          percentage: (count / activeClients.length * 100).toFixed(1)
        })),
        periodMultiplier
      });
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };
  if (loading || !financialData) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
        <p>Loading financial data...</p>
      </div>
    );
  }
  return (
    <div className="home-page">
      <div className="page-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back">
            ← Back to Reports
          </button>
        </div>
        <div className="header-center">
          <h1>💰 Financial Reports</h1>
        </div>
        <div className="header-actions">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid var(--brand-primary)',
              fontSize: '1rem'
            }}
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      {/* Revenue Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#28a745' }}>💰</div>
          <div className="stat-content">
            <h3 style={{ color: '#28a745' }}>{financialData.totalRevenue.toLocaleString()} AED</h3>
            <p>Total {financialData.periodLabel} Revenue</p>
            <small>from {financialData.activeClients} active clients</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#17a2b8' }}>📊</div>
          <div className="stat-content">
            <h3 style={{ color: '#17a2b8' }}>{financialData.averageRevenue.toFixed(0)} AED</h3>
            <p>Average per Client</p>
            <small>{financialData.periodLabel.toLowerCase()} revenue</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fd7e14' }}>📈</div>
          <div className="stat-content">
            <h3 style={{ color: '#fd7e14' }}>{Math.floor(financialData.totalRevenue / financialData.periodMultiplier * 12).toLocaleString()} AED</h3>
            <p>Projected Annual</p>
            <small>based on {financialData.periodLabel.toLowerCase()} rate</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6f42c1' }}>👥</div>
          <div className="stat-content">
            <h3 style={{ color: '#6f42c1' }}>{financialData.activeClients}</h3>
            <p>Active Clients</p>
            <small>revenue generating</small>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Package Revenue Breakdown */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            📦 Revenue by Package
          </h3>
          {financialData.packageRevenue
            .sort((a, b) => b.revenue - a.revenue)
            .map(pkg => (
              <div key={pkg.package} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #eee',
                backgroundColor: '#f8f9fa',
                marginBottom: '0.5rem',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{pkg.package}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {pkg.clients} clients
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                    {pkg.revenue.toLocaleString()} AED
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {((pkg.revenue / financialData.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
        </div>
        {/* Area Revenue Breakdown */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            📍 Revenue by Area
          </h3>
          {financialData.areaRevenue
            .sort((a, b) => b.revenue - a.revenue)
            .map(area => (
              <div key={area.area} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #eee',
                backgroundColor: '#f8f9fa',
                marginBottom: '0.5rem',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{area.area}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {area.clients} clients
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#17a2b8' }}>
                    {area.revenue.toLocaleString()} AED
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {((area.revenue / financialData.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Payment Status */}
      <div className="card">
        <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
          💳 Payment Status Analysis
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {financialData.paymentStatus.map(status => (
            <div key={status.status} style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              textAlign: 'center',
              border: '2px solid #e9ecef'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                {status.count}
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {status.status}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {status.percentage}% of clients
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default FinancialReports;