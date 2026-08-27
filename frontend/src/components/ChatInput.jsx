import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const textareaRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [text]);

  const handleSend = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser. Use Chrome.'); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = 'en-IN'; r.continuous = false; r.interimResults = false;
    r.onresult = (e) => setText(p => p ? p + ' ' + e.results[0][0].transcript : e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start(); recRef.current = r; setListening(true);
  };

  return (
    <div className="chat-input-bar p-3 px-4">
      <div className={`flex items-end gap-2 rounded-2xl px-4 py-2.5 transition-all
        border ${listening ? 'border-gold/50 bg-gold/5' : 'border-white/10 bg-white/5'}
        focus-within:border-gold/40 focus-within:bg-white/7`}>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about IIIT Pune…"
          className="flex-1 bg-transparent resize-none outline-none text-sm text-white/80 placeholder-white/25 max-h-[120px] leading-relaxed py-0.5"
          rows={1} disabled={disabled} aria-label="Chat message"
        />
        <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
          <button id="voice-btn" onClick={toggleVoice} type="button"
            className={`p-1.5 rounded-lg transition-all ${listening ? 'text-gold bg-gold/15' : 'text-white/25 hover:text-white/60 hover:bg-white/8'}`}
            title={listening ? 'Stop' : 'Voice input'} aria-label="Voice input">
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button id="send-btn" onClick={handleSend} type="button"
            disabled={!text.trim() || disabled}
            className={`p-1.5 rounded-lg transition-all ${text.trim() && !disabled ? 'btn-gold text-navy' : 'text-white/15 cursor-not-allowed'}`}
            aria-label="Send message">
            <Send size={15} />
          </button>
        </div>
      </div>
      <p className="text-white/15 text-[10px] text-center mt-1.5">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
