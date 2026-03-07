import React, { useState, useEffect, useRef } from 'react';
import { searchAPI } from '../lib/api';

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
    <div ref={wrapperRef} className="relative w-full max-w-md group">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tafuta watu, kazi, au habari..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#F5A623]/50 focus:bg-white/10 transition-all"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#F5A623]">🔍</span>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#151B28] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl">
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
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
                {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : s.name?.[0] || "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{s.name}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-tighter">{s.type === 'user' ? `@${s.handle}` : 'Mchango'}</p>
              </div>
            </div>
          ))}
          <div 
            onClick={handleSubmit}
            className="p-3 bg-[#F5A623]/5 text-[#F5A623] text-center text-xs font-bold cursor-pointer hover:bg-[#F5A623]/10"
          >
            Tafuta zote kwa "{q}" →
          </div>
        </div>
      )}
    </div>
  );
}
