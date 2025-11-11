import React, { useState, useEffect } from 'react';
const PerformanceMetrics = ({ onBack }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadPerformanceData();
  }, []);
  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [clientsRes, workersRes, scheduleRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/clients`),
        fetch(`${import.meta.env.VITE_API_URL}/api/workers`),
        fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`)
      ]);
      const clients = await clientsRes.json();
      const workers = await workersRes.json();
      const scheduleData = await scheduleRes.json();
      const activeClients = clients.filter(c => c.Status === 'Active');
      const activeWorkers = workers.filter(w => w.Status === 'Active');
      const assignments = scheduleData.assignments || [];
      // Calculate total company revenue
      const totalCompanyRevenue = activeClients.reduce((sum, client) => sum + (parseFloat(client.Fee) || 0), 0);
      const totalTasks = assignments.length;
      // Worker performance analysis
      const workerPerformance = activeWorkers.map(worker => {
        const workerAssignments = assignments.filter(a => 
          a.workerName === worker.Name || a.workerId === worker.WorkerID
        );
        const clientsAssigned = new Set(workerAssignments.map(a => a.customerId)).size;
        const workerTasks = workerAssignments.length;
        // Calculate revenue based on worker's share of total tasks
        const revenueShare = totalTasks > 0 ? (workerTasks / totalTasks) : 0;
        const revenue = Math.floor(totalCompanyRevenue * revenueShare);
        // Calculate efficiency based on workload distribution
        const avgTasksPerWorker = totalTasks / activeWorkers.length;
        const efficiency = avgTasksPerWorker > 0 ? Math.min(100, Math.floor((workerTasks / avgTasksPerWorker) * 100)) : 100;
        return {
          name: worker.Name,
          workerId: worker.WorkerID,
          clientsAssigned,
          totalTasks: workerTasks,
          monthlyRevenue: revenue,
          efficiency,
          area: worker.Area || 'Unassigned'
        };
      });
      // Schedule efficiency metrics
      const totalPossibleSlots = activeWorkers.length * 6 * 13; // 6 days * 13 time slots
      const utilizedSlots = assignments.length;
      const scheduleEfficiency = (utilizedSlots / totalPossibleSlots * 100).toFixed(1);
      // Service type distribution
      const serviceTypes = assignments.reduce((acc, assignment) => {
        const type = assignment.washType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      // Daily distribution
      const dailyDistribution = assignments.reduce((acc, assignment) => {
        const day = assignment.day || 'Unknown';
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
      // Time slot distribution
      const timeDistribution = assignments.reduce((acc, assignment) => {
        const time = assignment.time || 'Unknown';
        acc[time] = (acc[time] || 0) + 1;
        return acc;
      }, {});
      // Package performance
      const packagePerformance = activeClients.reduce((acc, client) => {
        const pkg = client.Washman_Package || 'Unknown';
        const clientAssignments = assignments.filter(a => a.customerId === client.CustomerID);
        if (!acc[pkg]) {
          acc[pkg] = { clients: 0, assignments: 0, revenue: 0 };
        }
        acc[pkg].clients += 1;
        acc[pkg].assignments += clientAssignments.length;
        acc[pkg].revenue += parseFloat(client.Fee) || 0;
        return acc;
      }, {});
      setPerformanceData({
        workerPerformance: workerPerformance.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue),
        scheduleEfficiency: parseFloat(scheduleEfficiency),
        totalAssignments: assignments.length,
        utilizedSlots,
        totalPossibleSlots,
        serviceTypes: Object.entries(serviceTypes).map(([type, count]) => ({
          type,
          count,
          percentage: (count / assignments.length * 100).toFixed(1)
        })),
        dailyDistribution: Object.entries(dailyDistribution).map(([day, count]) => ({
          day,
          count,
          percentage: (count / assignments.length * 100).toFixed(1)
        })),
        timeDistribution: Object.entries(timeDistribution)
          .sort(([a], [b]) => {
            const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
            return timeSlots.indexOf(a) - timeSlots.indexOf(b);
          })
          .map(([time, count]) => ({
            time,
            count,
            percentage: (count / assignments.length * 100).toFixed(1)
          })),
        packagePerformance: Object.entries(packagePerformance).map(([pkg, data]) => ({
          package: pkg,
          ...data,
          avgAssignments: (data.assignments / data.clients).toFixed(1),
          avgRevenue: (data.revenue / data.clients).toFixed(0)
        }))
      });
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
        <p>Loading performance metrics...</p>
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
          <h1>📈 Performance Metrics</h1>
        </div>
      </div>
      {/* Performance Overview */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#28a745' }}>📊</div>
          <div className="stat-content">
            <h3 style={{ color: '#28a745' }}>{performanceData.scheduleEfficiency}%</h3>
            <p>Schedule Efficiency</p>
            <small>{performanceData.utilizedSlots} of {performanceData.totalPossibleSlots} slots</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#17a2b8' }}>📋</div>
          <div className="stat-content">
            <h3 style={{ color: '#17a2b8' }}>{performanceData.totalAssignments}</h3>
            <p>Total Assignments</p>
            <small>current schedule</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fd7e14' }}>👷</div>
          <div className="stat-content">
            <h3 style={{ color: '#fd7e14' }}>{performanceData.workerPerformance.length}</h3>
            <p>Active Workers</p>
            <small>operational staff</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6f42c1' }}>⚡</div>
          <div className="stat-content">
            <h3 style={{ color: '#6f42c1' }}>
              {(performanceData.totalAssignments / performanceData.workerPerformance.length).toFixed(1)}
            </h3>
            <p>Avg Tasks per Worker</p>
            <small>workload distribution</small>
          </div>
        </div>
      </div>
      {/* Worker Performance */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
          👷 Worker Performance
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Worker</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Area</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Clients</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tasks</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Revenue</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.workerPerformance.map((worker, index) => (
                <tr key={worker.workerId} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold' }}>{worker.name}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{worker.workerId}</div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{worker.area}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 'bold', color: '#17a2b8' }}>{worker.clientsAssigned}</span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 'bold' }}>{worker.totalTasks}</span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                      {worker.monthlyRevenue.toLocaleString()} AED
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: worker.efficiency >= 80 ? '#28a745' : worker.efficiency >= 60 ? '#ffc107' : '#dc3545'
                    }}>
                      {worker.efficiency.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Service Type Distribution */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            🧽 Service Type Distribution
          </h3>
          {performanceData.serviceTypes.map(service => (
            <div key={service.type} style={{
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
                  {service.type === 'EXT' ? '🚗 Exterior Only' : '🧽 Exterior + Interior'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: service.type === 'INT' ? '#fd7e14' : '#17a2b8' }}>
                  {service.count} services
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {service.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Daily Distribution */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            📅 Daily Distribution
          </h3>
          {performanceData.dailyDistribution
            .sort((a, b) => {
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return days.indexOf(a.day) - days.indexOf(b.day);
            })
            .map(day => (
              <div key={day.day} style={{
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
                  <div style={{ fontWeight: 'bold' }}>{day.day}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                    {day.count} tasks
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {day.percentage}%
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Time Distribution */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
          ⏰ Peak Hours Analysis
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {performanceData.timeDistribution.slice(0, 8).map(time => (
            <div key={time.time} style={{
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center',
              border: time.count > 10 ? '2px solid #28a745' : '1px solid #ddd'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{time.time}</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: time.count > 10 ? '#28a745' : '#6c757d' 
              }}>
                {time.count}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>{time.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
      {/* Package Performance */}
      <div className="card">
        <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
          📦 Package Performance
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Package</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Clients</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Assignments</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Avg/Client</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Revenue</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Avg Revenue</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.packagePerformance
                .sort((a, b) => b.revenue - a.revenue)
                .map((pkg, index) => (
                  <tr key={pkg.package} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 'bold' }}>{pkg.package}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{pkg.clients}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{pkg.assignments}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{pkg.avgAssignments}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                        {pkg.revenue.toLocaleString()} AED
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{ fontWeight: 'bold', color: '#17a2b8' }}>
                        {pkg.avgRevenue} AED
                      </span>
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
export default PerformanceMetrics;