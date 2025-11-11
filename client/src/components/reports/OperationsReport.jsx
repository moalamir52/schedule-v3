import React, { useState, useEffect } from 'react';
import operationsService from '../../services/operationsService';
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
const OperationsReport = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [operationsData, setOperationsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, selectedDate]);
  const loadTabData = async (tab) => {
    if (operationsData[tab] && tab !== 'daily') return;
    setLoading(true);
    try {
      let data;
      switch (tab) {
        case 'daily':
          data = await operationsService.getDailyOperations(new Date(selectedDate));
          break;
        case 'workers':
          data = await operationsService.getWorkerPerformance();
          break;
        case 'efficiency':
          data = await operationsService.getServiceEfficiency();
          break;
        case 'routes':
          data = await operationsService.getRouteOptimization();
          break;
        case 'schedule':
          data = await operationsService.getScheduleManagement();
          break;
        case 'equipment':
          data = await operationsService.getEquipmentSupplies();
          break;
        case 'productivity':
          data = await operationsService.getProductivityReports();
          break;
        default:
          return;
      }
      setOperationsData(prev => ({
        ...prev,
        [tab]: data
      }));
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };
  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.9rem'
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <p>Loading operations data...</p>
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
          <h1>⚙️ Operations Reports</h1>
        </div>
        <div className="header-actions">
          {activeTab === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid var(--brand-primary)',
                fontSize: '1rem',
                color: 'var(--brand-primary)'
              }}
            />
          )}
        </div>
      </div>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <TabButton 
          id="daily" 
          label="Daily Ops" 
          icon="📅" 
          isActive={activeTab === 'daily'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
        <TabButton 
          id="workers" 
          label="Workers" 
          icon="👷" 
          isActive={activeTab === 'workers'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
        <TabButton 
          id="efficiency" 
          label="Efficiency" 
          icon="🚗" 
          isActive={activeTab === 'efficiency'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
        <TabButton 
          id="routes" 
          label="Routes" 
          icon="📍" 
          isActive={activeTab === 'routes'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
        <TabButton 
          id="schedule" 
          label="Schedule" 
          icon="⏰" 
          isActive={activeTab === 'schedule'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
        <TabButton 
          id="equipment" 
          label="Equipment" 
          icon="🔧" 
          isActive={activeTab === 'equipment'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
        <TabButton 
          id="productivity" 
          label="Productivity" 
          icon="📊" 
          isActive={activeTab === 'productivity'} 
          onClick={(tab) => {
            setActiveTab(tab);
            if (tab !== activeTab) loadTabData(tab);
          }} 
        />
      </div>
      {/* Daily Operations */}
      {activeTab === 'daily' && operationsData.daily && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            📅 Daily Operations - {operationsData.daily.dayName}
          </h3>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Scheduled Today"
              value={operationsData.daily.totalClients}
              subtitle="clients"
              color="#28a745"
              icon="📅"
            />
            <StatCard
              title="Time Slots"
              value={Object.keys(operationsData.daily.timeSlots).length}
              subtitle="different times"
              color="#17a2b8"
              icon="⏰"
            />
            <StatCard
              title="Areas"
              value={Object.keys(operationsData.daily.areas).length}
              subtitle="coverage areas"
              color="#6f42c1"
              icon="📍"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Time Slots */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>⏰ Time Slots</h4>
              {Object.entries(operationsData.daily.timeSlots).map(([time, clients]) => (
                <div key={time} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{time}</span>
                  <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                    {clients.length} clients
                  </span>
                </div>
              ))}
            </div>
            {/* Areas */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>📍 Areas</h4>
              {Object.entries(operationsData.daily.areas).map(([area, clients]) => (
                <div key={area} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>Phase {area}</span>
                  <span style={{ fontWeight: 'bold', color: '#17a2b8' }}>
                    {clients.length} clients
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Worker Performance */}
      {activeTab === 'workers' && operationsData.workers && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>👷 Worker Performance</h3>
          <div className="stats-grid">
            {operationsData.workers.map(worker => (
              <div key={worker.id || worker.name} className="card">
                <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>
                  👷 {worker.name || 'Unknown'} - {worker.area || 'Unassigned'}
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Assigned Clients:</span>
                    <strong>{worker.assignedClients}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Completed Services:</span>
                    <strong>{worker.completedServices}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monthly Revenue:</span>
                    <strong>{worker.monthlyRevenue} AED</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Efficiency:</span>
                    <strong style={{ color: worker.efficiency >= 80 ? '#28a745' : '#ffc107' }}>
                      {worker.efficiency}%
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Service Efficiency */}
      {activeTab === 'efficiency' && operationsData.efficiency && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>🚗 Service Efficiency</h3>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Completion Rate"
              value={`${operationsData.efficiency.completionRate}%`}
              subtitle="services completed"
              color="#28a745"
              icon="✅"
            />
            <StatCard
              title="Total Services"
              value={operationsData.efficiency.totalServices}
              subtitle="completed"
              color="#17a2b8"
              icon="🔧"
            />
            <StatCard
              title="Avg per Client"
              value={operationsData.efficiency.averageServicesPerClient}
              subtitle="services"
              color="#6f42c1"
              icon="📊"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Car Types */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>🚗 Car Types</h4>
              {operationsData.efficiency.carTypes.map(({ type, count }, index) => (
                <div key={`${type}-${index}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{type}</span>
                  <span style={{ fontWeight: 'bold', color: '#28a745' }}>{count}</span>
                </div>
              ))}
            </div>
            {/* Packages */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>📦 Packages</h4>
              {operationsData.efficiency.packages.map(({ package: pkg, count }) => (
                <div key={pkg} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{pkg}</span>
                  <span style={{ fontWeight: 'bold', color: '#17a2b8' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Routes */}
      {activeTab === 'routes' && operationsData.routes && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>📍 Route Optimization</h3>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Total Areas"
              value={operationsData.routes.totalAreas}
              subtitle="coverage areas"
              color="#6f42c1"
              icon="📍"
            />
            <StatCard
              title="Most Profitable"
              value={operationsData.routes.mostProfitableArea?.area || 'N/A'}
              subtitle={`${operationsData.routes.mostProfitableArea?.totalRevenue || 0} AED`}
              color="#28a745"
              icon="💰"
            />
            <StatCard
              title="Highest Density"
              value={operationsData.routes.mostDenseArea?.area || 'N/A'}
              subtitle={`${operationsData.routes.mostDenseArea?.clientCount || 0} clients`}
              color="#17a2b8"
              icon="🏘️"
            />
          </div>
          <div className="stats-grid">
            {operationsData.routes.areas.map(area => (
              <div key={area.area} className="card">
                <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>📍 Area {area.area}</h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Clients:</span>
                    <strong>{area.clientCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Revenue:</span>
                    <strong>{area.totalRevenue} AED</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Avg Revenue:</span>
                    <strong>{area.averageRevenue} AED</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Schedule */}
      {activeTab === 'schedule' && operationsData.schedule && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>⏰ Schedule Management</h3>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Weekly Services"
              value={operationsData.schedule.totalWeeklyServices}
              subtitle="total per week"
              color="#28a745"
              icon="📅"
            />
            <StatCard
              title="Daily Average"
              value={operationsData.schedule.averageDailyServices}
              subtitle="services per day"
              color="#17a2b8"
              icon="📊"
            />
            <StatCard
              title="Peak Day"
              value={operationsData.schedule.peakDay?.day || 'N/A'}
              subtitle={`${operationsData.schedule.peakDay?.clientCount || 0} clients`}
              color="#fd7e14"
              icon="🔥"
            />
          </div>
          <div className="stats-grid">
            {operationsData.schedule.weeklySchedule.map(day => (
              <div key={day.day} className="card" style={{ textAlign: 'center' }}>
                <h4 style={{ color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>{day.day}</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  {day.clientCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>clients</div>
                {day.peakTime && (
                  <div style={{ fontSize: '0.8rem', color: '#fd7e14', marginTop: '0.5rem' }}>
                    Peak: {day.peakTime.time}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Equipment */}
      {activeTab === 'equipment' && operationsData.equipment && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>🔧 Equipment & Supplies</h3>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Monthly Cost"
              value={`${operationsData.equipment.estimatedMonthlyCost} AED`}
              subtitle="estimated supplies"
              color="#dc3545"
              icon="💸"
            />
            <StatCard
              title="Total Services"
              value={operationsData.equipment.totalServices}
              subtitle="this month"
              color="#28a745"
              icon="🔧"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Supplies */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>🧴 Supplies Needed</h4>
              {Object.entries(operationsData.equipment.supplies).map(([item, qty]) => (
                <div key={item} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{item}:</span>
                  <span style={{ fontWeight: 'bold', color: '#17a2b8' }}>{qty} units</span>
                </div>
              ))}
            </div>
            {/* Equipment */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>🔧 Equipment Status</h4>
              {operationsData.equipment.equipment.map((item, index) => (
                <div key={index} style={{
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.name}</span>
                    <span style={{ 
                      color: item.status === 'Good' ? '#28a745' : '#ffc107',
                      fontWeight: 'bold'
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Count: {item.count} | Last: {item.lastMaintenance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Productivity */}
      {activeTab === 'productivity' && operationsData.productivity && (
        <div>
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>📊 Productivity Reports</h3>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <StatCard
              title="Active Clients"
              value={operationsData.productivity.totalActiveClients}
              subtitle="current clients"
              color="#28a745"
              icon="👥"
            />
            <StatCard
              title="Monthly Avg"
              value={operationsData.productivity.averageMonthlyServices}
              subtitle="services per month"
              color="#17a2b8"
              icon="📈"
            />
            <StatCard
              title="Growth Rate"
              value={`${operationsData.productivity.growth > 0 ? '+' : ''}${operationsData.productivity.growth}%`}
              subtitle="vs last month"
              color={operationsData.productivity.growth > 0 ? '#28a745' : '#dc3545'}
              icon="📊"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Monthly Trend */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>📈 Monthly Trend</h4>
              {operationsData.productivity.monthlyData.map((month, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span>{month.month}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{month.services} services</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{month.revenue} AED</div>
                  </div>
                </div>
              ))}
            </div>
            {/* KPIs */}
            <div className="card">
              <h4 style={{ color: 'var(--brand-primary)', marginBottom: '1rem' }}>🎯 KPIs</h4>
              {Object.entries(operationsData.productivity.kpis).map(([kpi, value]) => (
                <div key={kpi} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  borderBottom: '1px solid #eee'
                }}>
                  <span style={{ textTransform: 'capitalize' }}>
                    {kpi.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: value >= 90 ? '#28a745' : value >= 80 ? '#ffc107' : '#dc3545'
                  }}>
                    {value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OperationsReport;