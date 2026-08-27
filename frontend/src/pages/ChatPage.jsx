import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import toast from 'react-hot-toast';
import { Menu, MessageSquare, History, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SUGGESTED = [
  'What are the B.Tech admission requirements?',
  'What is the annual fee structure?',
  'Tell me about hostel facilities.',
  'What are the latest placement statistics?',
  'What departments does IIIT Pune offer?',
  'What scholarships are available for students?',
];

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-5 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-brand to-blue-bright flex items-center justify-center mr-3 shrink-0 mt-1 shadow-lg shadow-blue-brand/30">
        <img src="/iitp-logo.png" alt="" className="w-6 h-6 rounded-full" />
      </div>
      <div className="bubble-ai py-4 px-5 flex items-center gap-2">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convsLoading, setConvsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    chatAPI.getConversations()
      .then(r => setConversations(r.data))
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setConvsLoading(false));
  }, []);

  // Resume conversation from History page
  useEffect(() => {
    if (location.state?.conversationId) {
      loadConversation(location.state.conversationId);
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const loadConversation = async (id) => {
    setLoading(true); setActiveConvId(id);
    try {
      const r = await chatAPI.getConversation(id);
      setMessages(r.data.messages);
    } catch { toast.error('Failed to load conversation'); }
    finally { setLoading(false); }
  };

  const handleNewChat = () => { setActiveConvId(null); setMessages([]); setSidebarOpen(false); };

  const handleSend = async (text) => {
    setSending(true);
    setMessages(p => [...p, { role: 'user', content: text, _id: Date.now().toString() }]);
    try {
      const r = await chatAPI.send({ message: text, conversation_id: activeConvId });
      const { conversation_id, answer, sources, confidence, message_id } = r.data;
      if (!activeConvId) {
        setActiveConvId(conversation_id);
        const cr = await chatAPI.getConversations();
        setConversations(cr.data);
      } else {
        setConversations(p => p.map(c => c._id === conversation_id ? { ...c, updatedAt: new Date() } : c));
      }
      setMessages(p => [...p, { role: 'assistant', content: answer, sources: sources || [], confidenceScore: confidence, _id: message_id }]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to get response');
      setMessages(p => p.slice(0, -1));
    } finally { setSending(false); }
  };

  const handleFeedback = async (messageId, rating) => {
    try {
      await chatAPI.submitFeedback(messageId, { rating });
      toast.success(rating === 'up' ? 'Thanks for the feedback!' : "Thanks, we'll improve!");
    } catch { toast.error('Failed to submit feedback'); }
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b1437 0%, #0d1a45 100%)' }}>
      {/* Subtle background orbs inside chat area */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="orb" style={{ width: 350, height: 350, top: -80, right: 100, animationDelay: '2s', background: 'radial-gradient(circle, rgba(26,79,186,0.12), transparent 70%)' }} />
        <div className="orb" style={{ width: 250, height: 250, bottom: 50, right: 300, animationDelay: '5s', background: 'radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)' }} />
      </div>

      <Sidebar conversations={conversations} activeId={activeConvId} onSelect={loadConversation} onNewChat={handleNewChat} loading={convsLoading} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="portal-header px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')} title="Home">
            <button className="sm:hidden text-white/60 hover:text-white mr-1" onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }} aria-label="Open navigation menu">
              <Menu size={20} />
            </button>
            <img src="/iitp-logo.png" alt="IIIT Pune" className="w-8 h-8 rounded-full ring-1 ring-gold/30 group-hover:ring-gold/60 transition-all" />
            <div>
              <h1 className="text-xs sm:text-sm font-semibold text-white leading-none group-hover:text-gold/90 transition-colors">IIIT Pune Knowledge Assistant</h1>
              <p className="text-[9px] sm:text-[10px] text-white/30 mt-0.5">Answers sourced only from official documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {/* Nav tabs */}
            <nav className="hidden sm:flex items-center gap-1">
              <button id="chat-nav-chat" onClick={() => navigate('/chat')} className="chat-header-nav-btn active">
                <MessageSquare size={13} /> Chat
              </button>
              <button id="chat-nav-history" onClick={() => navigate('/history')} className="chat-header-nav-btn">
                <History size={13} /> History
              </button>
            </nav>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-brand to-blue-bright flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-10 py-5 sm:py-8">
          {/* Empty state */}
          {isEmpty && (
            <div id="empty-state" className="flex flex-col items-center justify-center h-full text-center animate-fade-up">
              <img src="/iitp-logo.png" alt="IIIT Pune" className="w-20 h-20 rounded-full ring-2 ring-gold/30 shadow-2xl shadow-gold/20 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-white/40 text-sm mb-8 max-w-md leading-relaxed">
                Ask me anything about IIIT Pune — admissions, fees, hostel, placements, academics, and more.
                I'll answer using only official documents.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTED.map((q, i) => (
                  <button key={i} id={`suggested-q-${i}`} onClick={() => handleSend(q)} className="suggest-chip">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="h-14 w-64 rounded-2xl bg-white/5 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {!loading && messages.map(msg => (
            <MessageBubble key={msg._id} message={msg} onFeedback={msg.role === 'assistant' ? handleFeedback : null} />
          ))}

          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
