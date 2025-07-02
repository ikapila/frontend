import React, { useEffect, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authError, setAuthError] = useState('');

  // Car parts state
  const [parts, setParts] = useState([]);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [stockStatus, setStockStatus] = useState('available');
  const [availableFrom, setAvailableFrom] = useState('');
  const [soldDate, setSoldDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch car parts from backend
  const fetchParts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/parts`);
      const data = await res.json();
      setParts(data);
    } catch (err) {
      setError('Failed to fetch car parts');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchParts();
  }, [token]);

  // Add a new car part
  const handleAddPart = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          name,
          manufacturer,
          stock_status: stockStatus,
          available_from: availableFrom || null,
          sold_date: soldDate || null
        })
      });
      if (!res.ok) throw new Error('Failed to add part');
      setName('');
      setManufacturer('');
      setStockStatus('available');
      setAvailableFrom('');
      setSoldDate('');
      fetchParts();
    } catch (err) {
      setError('Failed to add car part');
    }
  };

  // Handle login/register
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      if (authMode === 'login') {
        setToken(data.token);
        localStorage.setItem('token', data.token);
      } else {
        setAuthMode('login');
      }
      setUsername('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setParts([]);
  };

  return (
    <div className="App">
      <h1>Car Parts</h1>
      <p>Welcome to the Car Parts Management App! Use this tool to view and add car parts to your inventory.</p>
      {!token ? (
        <div style={{ marginBottom: 20 }}>
          <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuth}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ marginTop: 10 }}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
        </div>
      ) : (
        <>
          <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>
          <h2>Car Parts Management</h2>
          <form onSubmit={handleAddPart} style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Part Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Manufacturer"
              value={manufacturer}
              onChange={e => setManufacturer(e.target.value)}
              required
            />
            <select value={stockStatus} onChange={e => setStockStatus(e.target.value)}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
            </select>
            <input
              type="date"
              placeholder="Available From"
              value={availableFrom}
              onChange={e => setAvailableFrom(e.target.value)}
            />
            <input
              type="date"
              placeholder="Sold Date"
              value={soldDate}
              onChange={e => setSoldDate(e.target.value)}
            />
            <button type="submit">Add Part</button>
          </form>
          {loading ? <p>Loading...</p> : null}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Name</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Manufacturer</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Stock Status</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Available From</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Sold Date</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id}>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.id}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.manufacturer}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.stock_status}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.available_from || ''}</td>
                  <td style={{ border: '1px solid #ccc', padding: 8 }}>{part.sold_date || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
