import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { authAPI, searchAPI } from './lib/api';
import LandingPageV2 from './components/jamii-ai-landing-v2';
import AuthPage from './components/jamii-ai-auth';
import JamiiAICommunity from './components/jamii-ai-community';
import { translations } from './translations';

// ── SOCKET SETUP ──────────────────────────────────────────────────
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const socket = io(SOCKET_URL, { autoConnect: false });

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('landing'); // landing, auth, community, admin
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'sw');
  const [isLoading, setIsLoading] = useState(!!token);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── AUTH PERSISTENCE ──────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      authAPI.me()
        .then(res => {
          setUser(res.data);
          socket.connect();
          socket.emit("join", res.data.id);
          setView('community');
        })
        .catch(() => handleLogout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    socket.connect();
    socket.emit("join", data.user.id);
    setView('community');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    socket.disconnect();
    setView('landing');
  };

  const toggleLang = () => {
    setLang(l => l === 'sw' ? 'en' : 'sw');
  };

  // ── SEARCH LOGIC ────────────────────────────────────────────────
  const handleSearch = async (query) => {
    if (!query || query.length < 2) return;
    setSearchQuery(query);
    try {
      const { data } = await searchAPI.search(query);
      setSearchResults(data.results);
    } catch (err) { toast.error("Search imefeli"); }
  };

  const closeSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // ── GLOBAL SOCKET EFFECTS ────────────────────────────────────────
  useEffect(() => {
    socket.on("notification", (data) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#151B28] shadow-2xl rounded-xl border border-white/10 p-4 flex items-start gap-4`}>
          <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex-shrink-0 flex items-center justify-center text-[#F5A623]">
            {data.actorAvatar ? <img src={data.actorAvatar} className="w-full h-full rounded-full object-cover" /> : "🔔"}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{data.title}</p>
            <p className="text-white/60 text-xs mt-0.5">{data.body}</p>
          </div>
        </div>
      ), { position: 'top-right' });
    });

    return () => { socket.off("notification"); };
  }, []);

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
      <Toaster />
      
      {/* ── SEARCH OVERLAY ────────────────────────────────────────── */}
      {searchResults && (
        <div className="fixed inset-0 z-[100] bg-[#080C14]/95 backdrop-blur-xl overflow-y-auto p-4 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white">Matokeo ya: <span className="text-[#F5A623]">{searchQuery}</span></h2>
              <button onClick={closeSearch} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10">✕</button>
            </div>
            
            <div className="grid gap-8">
              {/* Results categories rendering... simplified for now as per guide */}
              {Object.keys(searchResults).map(type => (
                searchResults[type].length > 0 && (
                  <section key={type} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">{type}</h3>
                    <div className="grid gap-3">
                      {searchResults[type].map(item => (
                        <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#F5A623]/50 transition-colors group cursor-pointer">
                          <p className="text-white font-medium group-hover:text-[#F5A623]">{item.name || item.title || item.content?.slice(0,100)}</p>
                          <p className="text-white/40 text-xs mt-1">{item.handle || item.company_name || type}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              ))}
            </div>
          </div>
        </div>
      )}

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
          socket={socket}
          onSearch={handleSearch}
        />
      )}

      {/* Admin View is handled in separate files but route exists here in logic */}
    </div>
  );
}

export default App;
