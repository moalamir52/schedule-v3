import React, { useState, useEffect } from 'react';
const ClientAnalytics = ({ onBack }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadAnalyticsData();
  }, []);
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const clientsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`);
      const clients = await clientsRes.json();
      const activeClients = clients.filter(c => c.Status === 'Active');
      // Package distribution
      const packageDistribution = activeClients.reduce((acc, client) => {
        const pkg = client.Washman_Package || 'Unknown';
        acc[pkg] = (acc[pkg] || 0) + 1;
        return acc;
      }, {});
      // Area distribution
      const areaDistribution = activeClients.reduce((acc, client) => {
        const villa = client.Villa || 'Unknown';
        const phase = villa.match(/Phase\s*(\d+)/i)?.[1] || 'Other';
        acc[`Phase ${phase}`] = (acc[`Phase ${phase}`] || 0) + 1;
        return acc;
      }, {});
      // Car count analysis
      const carCountAnalysis = activeClients.reduce((acc, client) => {
        const carPlates = (client.CarPlates || '').split(',').filter(p => p.trim());
        const carCount = carPlates.length || 1;
        acc[carCount] = (acc[carCount] || 0) + 1;
        return acc;
      }, {});
      // Service frequency analysis
      const frequencyAnalysis = activeClients.reduce((acc, client) => {
        const days = (client.Days || '').split('-').length;
        const frequency = days > 0 ? `${days} days/week` : 'Unknown';
        acc[frequency] = (acc[frequency] || 0) + 1;
        return acc;
      }, {});
      // Revenue tier analysis
      const revenueTiers = activeClients.reduce((acc, client) => {
        const fee = parseFloat(client.Fee) || 0;
        let tier;
        if (fee >= 500) tier = 'Premium (500+ AED)';
        else if (fee >= 300) tier = 'Standard (300-499 AED)';
        else if (fee >= 150) tier = 'Basic (150-299 AED)';
        else tier = 'Budget (<150 AED)';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});
      // Recent clients (based on start date)
      const recentClients = activeClients
        .filter(c => c['start date'])
        .map(c => ({
          ...c,
          startDate: new Date(c['start date'])
        }))
        .sort((a, b) => b.startDate - a.startDate)
        .slice(0, 10);
      setAnalyticsData({
        totalClients: clients.length,
        activeClients: activeClients.length,
        inactiveClients: clients.length - activeClients.length,
        packageDistribution: Object.entries(packageDistribution).map(([pkg, count]) => ({
          package: pkg,
          count,
          percentage: (count / activeClients.length * 100).toFixed(1)
        })),
        areaDistribution: Object.entries(areaDistribution).map(([area, count]) => ({
          area,
          count,
          percentage: (count / activeClients.length * 100).toFixed(1)
        })),
        carCountAnalysis: Object.entries(carCountAnalysis).map(([cars, count]) => ({
          carCount: cars,
          clientCount: count,
          percentage: (count / activeClients.length * 100).toFixed(1)
        })),
        frequencyAnalysis: Object.entries(frequencyAnalysis).map(([freq, count]) => ({
          frequency: freq,
          count,
          percentage: (count / activeClients.length * 100).toFixed(1)
        })),
        revenueTiers: Object.entries(revenueTiers).map(([tier, count]) => ({
          tier,
          count,
          percentage: (count / activeClients.length * 100).toFixed(1)
        })),
        recentClients
      });
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };
  if (loading || !analyticsData) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
        <p>Loading client analytics...</p>
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
          <h1>👥 Client Analytics</h1>
        </div>
      </div>
      {/* Client Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#28a745' }}>👥</div>
          <div className="stat-content">
            <h3 style={{ color: '#28a745' }}>{analyticsData.activeClients}</h3>
            <p>Active Clients</p>
            <small>{((analyticsData.activeClients / analyticsData.totalClients) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#dc3545' }}>😴</div>
          <div className="stat-content">
            <h3 style={{ color: '#dc3545' }}>{analyticsData.inactiveClients}</h3>
            <p>Inactive Clients</p>
            <small>{((analyticsData.inactiveClients / analyticsData.totalClients) * 100).toFixed(1)}% of total</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#17a2b8' }}>📊</div>
          <div className="stat-content">
            <h3 style={{ color: '#17a2b8' }}>{analyticsData.totalClients}</h3>
            <p>Total Clients</p>
            <small>in database</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fd7e14' }}>📈</div>
          <div className="stat-content">
            <h3 style={{ color: '#fd7e14' }}>
              {((analyticsData.activeClients / analyticsData.totalClients) * 100).toFixed(1)}%
            </h3>
            <p>Retention Rate</p>
            <small>active vs total</small>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Package Distribution */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            📦 Package Distribution
          </h3>
          {analyticsData.packageDistribution
            .sort((a, b) => b.count - a.count)
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
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                    {pkg.count} clients
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {pkg.percentage}%
                  </div>
                </div>
              </div>
            ))}
        </div>
        {/* Area Distribution */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            📍 Area Distribution
          </h3>
          {analyticsData.areaDistribution
            .sort((a, b) => b.count - a.count)
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
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#17a2b8' }}>
                    {area.count} clients
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {area.percentage}%
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Car Count Analysis */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            🚗 Cars per Client
          </h3>
          {analyticsData.carCountAnalysis
            .sort((a, b) => parseInt(a.carCount) - parseInt(b.carCount))
            .map(car => (
              <div key={car.carCount} style={{
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
                  <div style={{ fontWeight: 'bold' }}>
                    {car.carCount} {car.carCount === '1' ? 'Car' : 'Cars'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#fd7e14' }}>
                    {car.clientCount} clients
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {car.percentage}%
                  </div>
                </div>
              </div>
            ))}
        </div>
        {/* Revenue Tiers */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            💰 Revenue Tiers
          </h3>
          {analyticsData.revenueTiers
            .sort((a, b) => b.count - a.count)
            .map(tier => (
              <div key={tier.tier} style={{
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
                  <div style={{ fontWeight: 'bold' }}>{tier.tier}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#6f42c1' }}>
                    {tier.count} clients
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {tier.percentage}%
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Recent Clients */}
      <div className="card">
        <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
          🆕 Recent Clients
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Villa</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Package</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fee</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Start Date</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.recentClients.map((client, index) => (
                <tr key={client.CustomerID} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold' }}>{client.Name}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{client.CustomerID}</div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{client.Villa}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{client.Washman_Package}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 'bold', color: '#28a745' }}>{client.Fee} AED</span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {client.startDate.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ClientAnalytics;