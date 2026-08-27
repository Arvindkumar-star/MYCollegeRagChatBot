import { Plus, MessageSquare, LogOut, Settings, Download, History, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useState } from 'react';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function Sidebar({ conversations, activeId, onSelect, onNewChat, onDelete, loading, isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleExport = async (convId, e) => {
    e.stopPropagation();
    try {
      const res = await chatAPI.exportConversation(convId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `conversation-${convId}.txt`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/60 sm:hidden" onClick={onClose} />}
      <aside className={`w-64 h-screen chat-sidebar flex flex-col shrink-0
        max-sm:fixed max-sm:left-0 max-sm:top-0 max-sm:z-40 max-sm:transition-transform max-sm:duration-300
        ${isOpen ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full'}`}>
      {/* ─── Logo ─── */}
      <div className="px-4 py-5 border-b border-white/5">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
          title="Go to Home"
        >
          <img
            src="/campussaathi-mark.svg"
            alt="CampusSaathi"
            className="w-9 h-9 rounded-full ring-2 ring-gold/30 group-hover:ring-gold/60 transition-all shadow-md shadow-gold/10"
          />
          <div>
            <p className="text-gold font-semibold text-sm leading-none group-hover:text-gold-light transition-colors">CampusSaathi</p>
            <p className="text-white/30 text-[10px] mt-0.5">IIIT Pune assistant</p>
          </div>
        </div>
      </div>

      {/* ─── Nav tabs ─── */}
      <div className="px-3 pt-3 pb-1 flex gap-1">
        <button
          id="sidebar-chat-tab"
          onClick={() => navigate('/chat')}
          className={`sidebar-nav-tab flex-1 ${location.pathname === '/chat' ? 'active' : ''}`}
        >
          <MessageSquare size={12} /> Chat
        </button>
        <button
          id="sidebar-history-tab"
          onClick={() => navigate('/history')}
          className={`sidebar-nav-tab flex-1 ${location.pathname === '/history' ? 'active' : ''}`}
        >
          <History size={12} /> History
        </button>
      </div>

      {/* ─── New Chat ─── */}
      <div className="px-3 pt-2 pb-2">
        <button id="new-chat-btn" onClick={onNewChat}
          className="new-chat-btn w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium">
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* ─── Conversations ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        <p className="text-[9px] text-white/20 uppercase tracking-[0.15em] px-2 py-2 mt-1">Recent</p>

        {loading && (
          <div className="space-y-2 px-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center py-8 px-4 text-center">
            <MessageSquare size={24} className="text-white/10 mb-2" />
            <p className="text-white/20 text-xs">No conversations yet</p>
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv._id}
            onClick={() => { onSelect(conv._id); onClose?.(); }}
            className={`group flex items-center rounded-xl cursor-pointer transition-all mb-0.5 px-2 py-2
              ${activeId === conv._id ? 'sidebar-item active' : 'sidebar-item'}`}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(conv._id)}
          >
            <MessageSquare size={12} className="text-white/20 shrink-0 mr-2 group-hover:text-gold/50 transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] leading-tight">{conv.title}</p>
              <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(conv.updatedAt)}</p>
            </div>
            <button onClick={(e) => handleExport(conv._id, e)}
              className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-gold/70 transition ml-1 shrink-0"
              title="Export">
              <Download size={11} />
            </button>
            <button onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(conv);
              }}
              className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition ml-1 shrink-0"
              title="Delete conversation" aria-label={`Delete ${conv.title}`}>
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* ─── Footer ─── */}
      <div className="border-t border-white/5 px-3 py-4">
        {isAdmin && (
          <a href="/admin"
            className="flex items-center gap-2 text-[11px] text-gold/50 hover:text-gold transition-colors mb-3 px-2">
            <Settings size={12} />
            Admin Dashboard
          </a>
        )}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-brand to-blue-bright flex items-center justify-center text-white text-xs font-bold shrink-0 ring-1 ring-white/10">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70 truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-white/25 truncate mt-0.5 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="text-white/25 hover:text-red-400 transition-colors shrink-0" title="Log out" aria-label="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
    {deleteTarget && <DeleteConfirmModal title={`Delete “${deleteTarget.title}”?`} onCancel={() => setDeleteTarget(null)} onConfirm={() => { onDelete?.(deleteTarget._id); setDeleteTarget(null); }} />}
    </>
  );
}
