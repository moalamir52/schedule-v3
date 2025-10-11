import React, { useState, useEffect } from 'react';

const AIInsights = ({ onBack }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      const [clientsRes, scheduleRes, workersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/clients`),
        fetch(`${import.meta.env.VITE_API_URL}/api/schedule/assign/current`),
        fetch(`${import.meta.env.VITE_API_URL}/api/workers`)
      ]);
      
      const clients = await clientsRes.json();
      const scheduleData = await scheduleRes.json();
      const workers = await workersRes.json();
      
      const activeClients = clients.filter(c => c.Status === 'Active');
      const assignments = scheduleData.assignments || [];
      
      // Generate AI insights based on real data
      const totalRevenue = activeClients.reduce((sum, client) => sum + (parseFloat(client.Fee) || 0), 0);
      const avgRevenuePerClient = totalRevenue / activeClients.length;
      
      // Package analysis
      const packageStats = activeClients.reduce((acc, client) => {
        const pkg = client.Washman_Package || 'Unknown';
        acc[pkg] = (acc[pkg] || 0) + 1;
        return acc;
      }, {});
      
      const mostPopularPackage = Object.entries(packageStats).reduce((max, [pkg, count]) => 
        count > (max?.count || 0) ? { package: pkg, count } : max, null
      );
      
      // Worker efficiency
      const workerStats = workers.map(worker => {
        const workerAssignments = assignments.filter(a => 
          a.workerName === worker.Name || a.workerId === worker.WorkerID
        );
        return {
          name: worker.Name,
          tasks: workerAssignments.length,
          clients: new Set(workerAssignments.map(a => a.customerId)).size
        };
      });
      
      const topWorker = workerStats.reduce((max, worker) => 
        worker.tasks > (max?.tasks || 0) ? worker : max, null
      );
      
      // Time analysis
      const timeStats = assignments.reduce((acc, assignment) => {
        acc[assignment.time] = (acc[assignment.time] || 0) + 1;
        return acc;
      }, {});
      
      const peakTime = Object.entries(timeStats).reduce((max, [time, count]) => 
        count > (max?.count || 0) ? { time, count } : max, null
      );

      setInsights({
        totalRevenue,
        activeClients: activeClients.length,
        avgRevenuePerClient,
        mostPopularPackage,
        topWorker,
        peakTime,
        totalAssignments: assignments.length,
        recommendations: generateRecommendations({
          totalRevenue,
          clientCount: activeClients.length,
          avgRevenue: avgRevenuePerClient,
          assignments: assignments.length,
          workers: workers.length,
          mostPopularPackage
        })
      });
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (data) => {
    const recommendations = [];
    
    // Revenue optimization
    if (data.avgRevenue < 300) {
      recommendations.push({
        type: 'revenue',
        priority: 'high',
        title: 'Increase Average Revenue per Client',
        description: `Current average revenue is ${data.avgRevenue.toFixed(0)} AED. Increase it by:`,
        actions: [
          'Offer premium packages with additional services',
          'Add interior cleaning services to existing clients',
          'Provide upgrade discounts for package improvements'
        ]
      });
    }
    
    // Worker optimization
    if (data.assignments / data.workers > 25) {
      recommendations.push({
        type: 'operations',
        priority: 'medium',
        title: 'Better Worker Distribution',
        description: `Workers are overloaded (${(data.assignments / data.workers).toFixed(1)} tasks/worker).`,
        actions: [
          'Hire additional worker to reduce pressure',
          'Redistribute tasks among workers',
          'Improve appointment scheduling'
        ]
      });
    }
    
    // Growth opportunities
    recommendations.push({
      type: 'growth',
      priority: 'high',
      title: 'Available Growth Opportunities',
      description: 'Based on current data, achieve 25-30% growth by:',
      actions: [
        `Target ${Math.floor(data.clientCount * 0.3)} new clients`,
        'Expand to new areas within the compound',
        'Offer seasonal services (rain cleaning, summer specials)'
      ]
    });
    
    return recommendations;
  };

  const quickQuestions = [
    'How to increase revenue by 20%?',
    'When to hire a new worker?',
    'How to improve worker efficiency?',
    'Which package is most profitable?',
    'How to reduce operational costs?'
  ];

  const handleQuestionClick = async (question) => {
    setSelectedQuestion(question);
    
    // Add question to chat immediately
    setChatHistory(prev => [...prev, { type: 'question', content: question }]);
    
    try {
      // Call real AI API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          businessData: {
            totalRevenue: insights.totalRevenue,
            activeClients: insights.activeClients,
            avgRevenue: insights.avgRevenuePerClient,
            totalAssignments: insights.totalAssignments,
            workers: 3, // Assuming 3 workers
            mostPopularPackage: insights.mostPopularPackage?.package
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChatHistory(prev => [...prev, { type: 'answer', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { type: 'answer', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setChatHistory(prev => [...prev, { type: 'answer', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    
    return; // Skip the old hardcoded responses
    
    // Old hardcoded logic (kept as fallback)
    let response = '';
    
    switch(question) {
      case 'How to increase revenue by 20%?':
        response = `To increase revenue by 20% (+${Math.floor(insights.totalRevenue * 0.2)} AED additional):

📈 **Direct Strategies:**
• Add ${Math.ceil(insights.activeClients * 0.15)} new clients
• Upgrade 30% of existing clients to higher packages
• Introduce additional services (rain cleaning, monthly polishing)

💡 **Action Plan:**
1. Target empty villas in the same compound
2. Offer upgrade promotions to current clients
3. Add garage cleaning service (50 AED/month)`;
        break;
        
      case 'When to hire a new worker?':
        const tasksPerWorker = insights.totalAssignments / (insights.topWorker ? 3 : 1);
        response = `Based on current analysis:

📊 **Current Status:**
• Average tasks per worker: ${tasksPerWorker.toFixed(1)} tasks
• Optimal range: 20-25 tasks per worker

⏰ **Recommended Timing:**
${tasksPerWorker > 25 ? 
  '🔴 **NOW!** Workers are overloaded' : 
  tasksPerWorker > 20 ? 
    '🟡 **Within a month** when reaching 25 tasks/worker' :
    '🟢 **Not needed currently** - optimal workload'
}

💰 **Cost vs Return:**
• New worker cost: ~2000 AED/month
• Expected return: ~3000 AED/month from additional clients`;
        break;
        
      case 'How to improve worker efficiency?':
        response = `To improve worker efficiency:

⚡ **Immediate Improvements:**
• Group clients by area (save 30% travel time)
• Optimize peak hours: ${insights.peakTime?.time || '9:00 AM'}
• Use navigation app for villa routing

📈 **Long-term Improvements:**
• Train workers on faster techniques
• Performance incentive system
• Provide better and faster equipment

📊 **Performance Metrics:**
• Target: 8-10 clients/day per worker
• Current: ${insights.topWorker ? Math.floor(insights.topWorker.tasks / 6) : 'N/A'} clients/day`;
        break;
        
      case 'Which package is most profitable?':
        response = `Package profitability analysis:

🏆 **Most Popular:** ${insights.mostPopularPackage?.package || 'N/A'}

💰 **Profitability Analysis:**
• 3x/week packages: Highest profit (300+ AED)
• 2x/week packages: Medium profit (200-250 AED)
• 1x/week packages: Lower profit (100-150 AED)

📈 **Optimization Strategy:**
• Focus on upgrading clients to higher packages
• Offer 10% discount for upgrading from 2x to 3x weekly
• Add premium services to high-tier packages`;
        break;
        
      case 'How to reduce operational costs?':
        response = `To reduce operational costs:

💧 **Water & Materials Savings:**
• Use water recycling system (save 40%)
• Buy materials in bulk (save 25%)
• Reduce unnecessary chemical usage

⛽ **Fuel Savings:**
• Smart route planning (save 30% fuel)
• Group clients in same area
• Use fuel-efficient vehicles

👷 **Efficiency Improvements:**
• Train workers to reduce service time
• Regular equipment maintenance
• Minimize material waste

💰 **Expected Savings:** 15-25% of monthly costs`;
        break;
        
      default:
        response = 'Sorry, I couldn\'t understand the question. Please try one of the suggested questions.';
    }
    
    setChatHistory(prev => [...prev, 
      { type: 'question', content: question },
      { type: 'answer', content: response }
    ]);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
        <p>Analyzing data with AI...</p>
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
          <h1>🤖 AI Business Insights</h1>
        </div>
      </div>

      {/* Key Insights */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#28a745' }}>💰</div>
          <div className="stat-content">
            <h3 style={{ color: '#28a745' }}>{insights.totalRevenue.toLocaleString()} AED</h3>
            <p>Total Revenue</p>
            <small>{insights.activeClients} active clients</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#17a2b8' }}>📊</div>
          <div className="stat-content">
            <h3 style={{ color: '#17a2b8' }}>{insights.avgRevenuePerClient.toFixed(0)} AED</h3>
            <p>Average Revenue per Client</p>
            <small>monthly</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#fd7e14' }}>🏆</div>
          <div className="stat-content">
            <h3 style={{ color: '#fd7e14' }}>{insights.topWorker?.name || 'N/A'}</h3>
            <p>Top Performer</p>
            <small>{insights.topWorker?.tasks || 0} tasks</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#6f42c1' }}>⏰</div>
          <div className="stat-content">
            <h3 style={{ color: '#6f42c1' }}>{insights.peakTime?.time || 'N/A'}</h3>
            <p>Peak Time</p>
            <small>{insights.peakTime?.count || 0} tasks</small>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* AI Recommendations */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            💡 AI Recommendations
          </h3>
          
          {insights.recommendations.map((rec, index) => (
            <div key={index} style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: `4px solid ${rec.priority === 'high' ? '#dc3545' : rec.priority === 'medium' ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  backgroundColor: rec.priority === 'high' ? '#dc3545' : rec.priority === 'medium' ? '#ffc107' : '#28a745',
                  color: 'white',
                  marginRight: '0.5rem'
                }}>
                  {rec.priority === 'high' ? 'HIGH' : rec.priority === 'medium' ? 'MEDIUM' : 'LOW'}
                </span>
                <h4 style={{ margin: 0, color: 'var(--brand-primary)' }}>{rec.title}</h4>
              </div>
              
              <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>{rec.description}</p>
              
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {rec.actions.map((action, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Interactive AI Chat */}
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
            💬 Ask AI Assistant
          </h3>
          
          {/* Quick Questions */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#666' }}>Quick Questions:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#e9ecef',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'right'
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            {chatHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                Select a question above to start conversation
              </p>
            ) : (
              chatHistory.map((message, index) => (
                <div key={index} style={{
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: message.type === 'question' ? '#e3f2fd' : '#f1f8e9'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '0.25rem',
                    color: message.type === 'question' ? '#1976d2' : '#388e3c'
                  }}>
                    {message.type === 'question' ? '❓ Your Question:' : '🤖 AI Response:'}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.4'
                  }}>
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;