import React, { useState, useEffect, useRef } from "react";
import { messagesAPI, usersAPI } from "../lib/api";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Send, Search, Image as ImageIcon, Trash2, MoreVertical, CheckCheck } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DirectMessages({ user, socket, t }) {
  const [convos, setConvos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef();

  // Fetch conversations
  const fetchConvos = async () => {
    try {
      const { data } = await messagesAPI.conversations();
      setConvos(data.conversations || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchConvos();
    const timer = setInterval(fetchConvos, 30000); // refresh convos list
    return () => clearInterval(timer);
  }, []);

  // Fetch messages when selected
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    messagesAPI.getMessages(selectedId)
      .then(res => {
        setMessages(res.data.messages);
        setOtherUser(res.data.otherUser);
        socket.emit("join:dm", selectedId);
      })
      .finally(() => setLoading(false));

    return () => { if (selectedId) socket.emit("leave:dm", selectedId); };
  }, [selectedId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket) return;
    const handleNew = (msg) => {
      if (msg.sender_id === selectedId || msg.receiver_id === selectedId) {
        setMessages(p => [...p, msg]);
      }
      fetchConvos();
    };
    socket.on("new_message", handleNew);
    return () => socket.off("new_message", handleNew);
  }, [socket, selectedId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedId) return;
    const tempText = text;
    setText("");
    try {
      const { data } = await messagesAPI.send(selectedId, { text: tempText });
      setMessages(p => [...p, data.message]);
      fetchConvos();
    } catch (err) { toast.error("Imeshindwa kutuma"); setText(tempText); }
  };

  const filteredConvos = convos.filter(c => 
    c.other_name.toLowerCase().includes(search.toLowerCase()) || 
    c.other_handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
      {/* Sidebar */}
      <div className={`w-full md:w-80 flex flex-col border-r border-white/10 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-black mb-4">Ujumbe</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tafuta chat..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#F5A623]/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConvos.length === 0 ? (
            <div className="p-10 text-center text-white/20 text-sm">Hakuna mazungumzo</div>
          ) : (
            filteredConvos.map(c => (
              <div 
                key={c.other_user_id}
                onClick={() => setSelectedId(c.other_user_id)}
                className={`p-4 rounded-2xl flex gap-4 cursor-pointer transition-all ${selectedId === c.other_user_id ? 'bg-[#F5A623]/10 border border-[#F5A623]/20' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden border border-white/10">
                    {c.other_avatar ? <img src={c.other_avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{c.other_name[0]}</div>}
                  </div>
                  {c.unread_count > 0 && <span className="absolute -top-1 -right-1 bg-[#F5A623] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A0F1C]">{c.unread_count}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm truncate">{c.other_name}</p>
                    <span className="text-[10px] text-white/30 whitespace-nowrap">{formatDistanceToNow(new Date(c.created_at), { locale: enUS, addSuffix: false })}</span>
                  </div>
                  <p className={`text-xs truncate ${c.unread_count > 0 ? 'text-white font-bold' : 'text-white/40'}`}>{c.text || "📷 Picha"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white/[0.02] ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedId && otherUser ? (
          <>
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedId(null)} className="md:hidden text-white/40 hover:text-white">←</button>
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  {otherUser.avatar_url ? <img src={otherUser.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{otherUser.name[0]}</div>}
                </div>
                <div>
                  <p className="font-black text-sm">{otherUser.name}</p>
                  <p className="text-[10px] text-[#F5A623] font-bold tracking-widest uppercase">@{otherUser.handle}</p>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-white/5 text-white/40"><MoreVertical size={20} /></button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="h-full flex items-center justify-center opacity-20">...</div>
              ) : messages.map((m, i) => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#F5A623] text-black font-medium rounded-tr-none shadow-[0_10px_20px_rgba(245,166,35,0.15)]' : 'bg-white/5 text-white rounded-tl-none border border-white/10'}`}>
                        {m.image_url && <img src={m.image_url} className="rounded-lg mb-3 max-w-full" />}
                        {m.text}
                      </div>
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <span className="text-[9px] text-white/20 uppercase font-bold tracking-tighter">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck size={12} className={m.is_read ? 'text-[#F5A623]' : 'text-white/20'} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-6 border-top border-white/10 bg-white/[0.02]">
              <form onSubmit={handleSend} className="flex gap-3 items-end">
                <button type="button" className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"><ImageIcon size={20} /></button>
                <div className="flex-1 relative">
                  <textarea 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder="Andika ujumbe hapa..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-[#F5A623]/50 transition-all resize-none max-h-32"
                    rows={1}
                  />
                  <button 
                    disabled={!text.trim()}
                    className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${text.trim() ? 'bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <Send size={32} />
            </div>
            <h3 className="text-xl font-black mb-2 uppercase tracking-tighter">Mazungumzo Yako</h3>
            <p className="text-sm max-w-xs">Chagua mazungumzo upande wa kushoto au anza mapya kwa kumtafuta mtaalamu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
