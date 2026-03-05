import React, { useState, useEffect } from 'react';
import LandingPageV2 from './components/jamii-ai-landing-v2';
import AuthPage from './components/jamii-ai-auth';
import JamiiAICommunity from './components/jamii-ai-community';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('landing'); // 'landing', 'auth', 'community'

  useEffect(() => {
    if (token) {
      // Kama kuna token, jaribu kuivuta profile ya user
      fetch('http://localhost:4000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser(data);
          setView('community');
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      });
    }
  }, [token]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setView('community');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-[#080C14]">
      {view === 'landing' && (
        <LandingPageV2 
          onLogin={() => setView('auth')} 
          onRegister={() => setView('auth')}
          onEnterCommunity={() => setView('community')}
        />
      )}
      
      {view === 'auth' && (
        <AuthPage 
          onAuthSuccess={handleAuthSuccess} 
          onBack={() => setView('landing')} 
        />
      )}

      {view === 'community' && (
        <JamiiAICommunity 
          user={user}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
