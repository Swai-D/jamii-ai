import React, { useState, useEffect, useRef } from "react";
import { notificationsAPI } from "../lib/api";

export default function NotificationBell({ socket }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    notificationsAPI.list().then(r => setNotifs(r.data.notifications || []));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotif = (n) => setNotifs(p => [n, ...p]);
    socket.on("notification", handleNewNotif);
    return () => socket.off("notification", handleNewNotif);
  }, [socket]);

  const markAllRead = async () => {
    try {
      await notificationsAPI.readAll();
      setNotifs(p => p.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button 
        onClick={() => setOpen(!open)} 
        className="relative p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-[#F5A623] text-black rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] font-black px-1 border-2 border-[#080C14]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-[#151B28] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110] backdrop-blur-xl">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-black text-white flex items-center gap-2">🔔 Arifa</h3>
            {unread > 0 && (
              <button 
                onClick={markAllRead} 
                className="text-[10px] font-bold text-[#F5A623] hover:underline"
              >
                Soma zote
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-10 text-center text-white/20 text-xs">Hakuna arifa mpya</div>
            ) : (
              notifs.map((n, i) => (
                <div 
                  key={n.id || i} 
                  className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${!n.is_read ? 'bg-[#F5A623]/5' : ''}`}
                  onClick={() => {
                    if (!n.is_read) notificationsAPI.read(n.id);
                    setNotifs(p => p.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                  }}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
                      {n.actor_avatar ? <img src={n.actor_avatar} className="w-full h-full object-cover" /> : "🤖"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs ${!n.is_read ? 'text-white font-bold' : 'text-white/60'}`}>{n.title}</p>
                      {n.body && <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{n.body}</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
