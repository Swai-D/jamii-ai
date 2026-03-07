import React, { useState, useEffect, useRef } from 'react';
import { searchAPI } from '../lib/api';
import { Search } from 'lucide-react';

export default function SearchBar({ onNavigate }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (q.length < 1) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchAPI.suggestions(q);
        setSuggestions(data.suggestions || []);
        setOpen(true);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (q.length < 2) return;
    onNavigate?.("search", { q });
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full group">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tafuta JamiiAI..."
          style={{ 
            width: "100%", 
            background: "rgba(255,255,255,0.04)", 
            border: "1px solid rgba(255,255,255,0.08)", 
            borderRadius: 10, 
            padding: "10px 14px 10px 34px", 
            color: "#F2F2F5", 
            fontFamily: "'Roboto Mono',monospace", 
            fontSize: 13, 
            outline: "none" 
          }}
          className="search-input"
        />
        <span style={{ 
          position: "absolute", 
          left: 11, 
          top: "50%", 
          transform: "translateY(-50%)", 
          color: "rgba(220,230,240,0.28)", 
          fontSize: 13,
          display: "flex",
          alignItems: "center"
        }}>
          <Search size={14} />
        </span>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0D1322] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl">
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                if (s.type === 'user') onNavigate?.('profile', { handle: s.handle });
                else if (s.type === 'post') onNavigate?.('post', { id: s.id });
                setOpen(false);
                setQ("");
              }}
              className="p-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden border border-white/5">
                {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : s.name?.[0] || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{s.name}</p>
                <p className="text-[9px] text-white/30 uppercase tracking-tighter font-mono">{s.type === 'user' ? `@${s.handle}` : 'Mchango'}</p>
              </div>
            </div>
          ))}
          <div 
            onClick={handleSubmit}
            className="p-2.5 bg-[#F5A623]/5 text-[#F5A623] text-center text-[10px] font-bold cursor-pointer hover:bg-[#F5A623]/10 border-t border-white/5 uppercase tracking-wider"
          >
            Tafuta zote kwa "{q}" →
          </div>
        </div>
      )}
    </div>
  );
}
