import React, { useState, useEffect } from 'react';
import LandingPageV2 from './components/jamii-ai-landing-v2';
import AuthPage from './components/jamii-ai-auth';
import JamiiAICommunity from './components/jamii-ai-community';
import { translations } from './translations';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('landing'); 
  const [lang, setLang] = useState('sw'); 
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setIsLoading(true);
      fetch('http://localhost:4000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser(data);
          setToken(savedToken);
          setView('community');
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setView('landing');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setView('landing');
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

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

  const toggleLang = () => {
    setLang(lang === 'sw' ? 'en' : 'sw');
  };

  if (isLoading) {
    return (
      <div style={{ background: "#0A0F1C", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#F5A623", fontFamily: "'Syne', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "4px solid rgba(245,166,35,0.1)", borderTopColor: "#F5A623", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontWeight: 800 }}>Inapakia JamiiAI...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14]">
      {view === 'landing' && (
        <LandingPageV2 
          lang={lang}
          toggleLang={toggleLang}
          onLogin={() => setView('auth')} 
          onRegister={() => setView('auth')}
          onEnterCommunity={() => setView('community')}
        />
      )}
      
      {view === 'auth' && (
        <AuthPage 
          lang={lang}
          onAuthSuccess={handleAuthSuccess} 
          onBack={() => setView('landing')} 
        />
      )}

      {view === 'community' && (
        <JamiiAICommunity 
          user={user}
          lang={lang}
          toggleLang={toggleLang}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
