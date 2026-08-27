import { useEffect, useRef, useState } from 'react';
import { LogOut, MessageSquare, Settings, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileMenu({ compact = false }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const signOut = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`profile-trigger ${open ? 'active' : ''}`}
        aria-label="Open profile menu"
        aria-expanded={open}
        title="Profile menu"
      >
        <span className="profile-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
        {!compact && <span className="hidden md:block max-w-[120px] truncate text-xs font-semibold">{user?.name || 'Account'}</span>}
        <span className="profile-chevron">⌄</span>
      </button>

      {open && (
        <div className="profile-menu animate-scale-in" role="menu">
          <div className="profile-menu-header">
            <div className="profile-avatar profile-avatar-large">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
              <p className="profile-muted text-xs truncate">{user?.email}</p>
              <span className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'Student'}</span>
            </div>
            <button onClick={() => setOpen(false)} className="profile-close" aria-label="Close profile menu"><X size={14} /></button>
          </div>
          <div className="profile-menu-links">
            <button onClick={() => go('/chat')} role="menuitem"><MessageSquare size={14} /> Chat</button>
            <button onClick={() => go('/history')} role="menuitem"><UserRound size={14} /> My history</button>
            {isAdmin && <button onClick={() => go('/admin')} role="menuitem"><Settings size={14} /> Admin dashboard</button>}
          </div>
          <div className="profile-menu-divider" />
          <button onClick={signOut} role="menuitem" className="profile-signout"><LogOut size={14} /> Sign out</button>
        </div>
      )}
    </div>
  );
}
