import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  History, Search, MessageSquare, ArrowRight,
  Calendar, ChevronLeft, Clock, Inbox, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function timeLabel(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fullDateTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function ConvCard({ conv, index }) {
  const navigate = useNavigate();
  const initials = conv.title?.slice(0, 2)?.toUpperCase() || 'CH';

  return (
    <div
      id={`history-card-${conv._id}`}
      className="history-card animate-fade-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Left accent */}
      <div className="w-1 h-full rounded-full bg-gradient-to-b from-blue-brand to-gold/60 mr-4 shrink-0 self-stretch" />

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-brand/30 to-blue-bright/20 border border-blue-bright/20 flex items-center justify-center text-blue-bright text-xs font-bold shrink-0">
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-white font-semibold text-sm truncate mb-1">{conv.title}</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-white/35 text-xs">
            <Calendar size={10} />
            {fullDateTime(conv.updatedAt)}
          </span>
          <span className="flex items-center gap-1 text-white/35 text-xs">
            <MessageSquare size={10} />
            {conv.messageCount ?? '—'} messages
          </span>
        </div>
      </div>

      {/* Action */}
      <button
        id={`resume-chat-${conv._id}`}
        onClick={() => navigate('/chat', { state: { conversationId: conv._id } })}
        className="history-resume-btn shrink-0"
      >
        Resume Chat <ArrowRight size={13} />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    chatAPI.getConversations()
      .then(r => setConversations(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter(c =>
    c.title?.toLowerCase().includes(query.toLowerCase())
  );

  // Group by relative date
  const groups = filtered.reduce((acc, conv) => {
    const label = timeLabel(conv.updatedAt);
    const key = ['Just now', 'Yesterday'].includes(label) || label.endsWith('ago') ? 'Recent' :
      new Date(conv.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {});

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b1437 0%, #0d1a45 100%)' }}>
      {/* Bg orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      {/* Header */}
      <header className="portal-header px-6 py-3.5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="text-white/30 hover:text-white/70 transition mr-1"
            title="Back to chat"
          >
            <ChevronLeft size={18} />
          </button>
          <img
            src="/iitp-logo.png"
            alt="IIIT Pune"
            className="w-8 h-8 rounded-full ring-1 ring-gold/30 cursor-pointer"
            onClick={() => navigate('/')}
          />
          <div>
            <h1 className="text-sm font-bold text-white leading-none">IIIT Pune Knowledge Assistant</h1>
            <p className="text-[10px] text-white/30 mt-0.5">Conversation History</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <button onClick={() => navigate('/chat')} className="history-nav-btn">
              <MessageSquare size={14} /> Chat
            </button>
            <button className="history-nav-btn active">
              <History size={14} /> History
            </button>
          </nav>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-brand to-blue-bright flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-brand/30 to-gold/20 border border-white/10 flex items-center justify-center">
                <Clock size={18} className="text-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white">Conversation History</h2>
            </div>
            <p className="text-white/35 text-sm ml-11">Browse and resume all your past verified queries and research sessions</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="history-search"
              type="text"
              placeholder="Search conversations…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-dark pl-9 pr-4 py-2.5 text-sm w-full"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-5">
              <Inbox size={28} className="text-white/15" />
            </div>
            <h3 className="text-white/50 font-semibold text-base mb-1">
              {query ? 'No results found' : 'No conversations yet'}
            </h3>
            <p className="text-white/25 text-sm">
              {query ? `Try a different search term` : 'Start a new chat to see your history here.'}
            </p>
            {!query && (
              <button onClick={() => navigate('/chat')} className="btn-gold mt-6 px-5 py-2.5 flex items-center gap-2">
                <MessageSquare size={14} /> Start Chatting
              </button>
            )}
          </div>
        )}

        {/* Conversation groups */}
        {!loading && Object.entries(groups).map(([groupLabel, convs]) => (
          <div key={groupLabel} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{groupLabel}</p>
              <div className="flex-1 h-px bg-white/6" />
              <span className="text-[10px] text-white/20">{convs.length}</span>
            </div>
            <div className="space-y-2.5">
              {convs.map((conv, i) => <ConvCard key={conv._id} conv={conv} index={i} />)}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
