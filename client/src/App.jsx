import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/ui/Sidebar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import DailyTasksPage from './pages/DailyTasksPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import OperationsPage from './pages/OperationsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import authService from './services/authService.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogin = async (username, password) => {
    try {
      setLoading(true);
      setError('');
      const userData = await authService.login(username, password);
      setUser(userData);
    } catch (error) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '300px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleLogin(formData.get('username'), formData.get('password'));
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const layoutStyle = {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  };

  const mainContentStyle = {
    marginLeft: '0',
    padding: '80px 20px 20px 20px',
    minHeight: '100vh'
  };

  return (
    <BrowserRouter>
      <div style={layoutStyle}>
        <Sidebar user={user} onLogout={handleLogout} />
        <main style={mainContentStyle}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/tasks" element={<DailyTasksPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;