import { ChevronDown, ChevronUp, FileText, AlertTriangle, Copy, RefreshCw, Check } from 'lucide-react';
import { useState } from 'react';

function ConfidenceBadge({ score }) {
  if (!score) return null;
  const high = score >= 0.65;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border
      ${high ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
      {high ? '✓ High confidence' : '~ Low confidence'}
    </span>
  );
}

function SourceCard({ source }) {
  const [open, setOpen] = useState(false);
  const score = source.score ? `${Math.round(source.score * 100)}% match` : null;
  return (
    <div className="rounded-lg overflow-hidden border border-gold/15 bg-gold/5 text-xs">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-gold/70 hover:text-gold hover:bg-gold/8 transition-colors">
        <FileText size={10} className="shrink-0" />
        <span className="font-medium truncate">{source.documentTitle}</span>
        {source.page && <span className="text-gold/40 shrink-0">p.{source.page}</span>}
        {score && <span className="text-gold/40 shrink-0">{score}</span>}
        <span className="ml-auto shrink-0">{open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</span>
      </button>
      {open && source.excerpt && (
        <div className="px-3 pb-2 pt-1 text-white/40 border-t border-gold/10 leading-relaxed text-[11px]">
          {source.excerpt}
        </div>
      )}
    </div>
  );
}

function FeedbackButtons({ messageId, onFeedback }) {
  const [voted, setVoted] = useState(null);
  const vote = (r) => { if (voted) return; setVoted(r); onFeedback(messageId, r); };
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <button onClick={() => vote('up')}
        className={`text-sm px-1 py-0.5 rounded transition-all ${voted === 'up' ? 'text-green-400 scale-110' : 'text-white/20 hover:text-green-400'}`}
        title="Helpful" aria-label="Mark helpful">👍</button>
      <button onClick={() => vote('down')}
        className={`text-sm px-1 py-0.5 rounded transition-all ${voted === 'down' ? 'text-red-400 scale-110' : 'text-white/20 hover:text-red-400'}`}
        title="Not helpful" aria-label="Mark not helpful">👎</button>
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_))/g);
  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-black/20 px-1.5 py-0.5 text-gold/90 text-[0.9em]">{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index} className="italic text-white/90">{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
}

function MarkdownContent({ content }) {
  const lines = (content || '').replace(/\r/g, '').split('\n');
  const elements = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (!listItems.length) return;
    const List = listType === 'ordered' ? 'ol' : 'ul';
    elements.push(
      <List key={`list-${elements.length}`} className={`${listType === 'ordered' ? 'list-decimal' : 'list-disc'} pl-5 space-y-1.5 my-2`}>
        {listItems.map((item, index) => <li key={index} className="pl-1">{renderInline(item)}</li>)}
      </List>
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)/);
    const unordered = trimmed.match(/^[-*•]\s+(.+)/);

    if (ordered || unordered) {
      const currentType = ordered ? 'ordered' : 'unordered';
      if (listType && listType !== currentType) flushList();
      listType = currentType;
      listItems.push((ordered || unordered)[1]);
    } else {
      flushList();
      if (!trimmed) {
        elements.push(<div key={`space-${index}`} className="h-2" />);
      } else if (/^###\s+/.test(trimmed)) {
        elements.push(<h4 key={index} className="font-semibold text-white mt-2 mb-1">{renderInline(trimmed.replace(/^###\s+/, ''))}</h4>);
      } else if (/^##\s+/.test(trimmed)) {
        elements.push(<h3 key={index} className="font-bold text-white mt-2 mb-1">{renderInline(trimmed.replace(/^##\s+/, ''))}</h3>);
      } else if (/^#\s+/.test(trimmed)) {
        elements.push(<h3 key={index} className="font-bold text-white mt-2 mb-1">{renderInline(trimmed.replace(/^#\s+/, ''))}</h3>);
      } else {
        elements.push(<p key={index} className="leading-relaxed">{renderInline(trimmed)}</p>);
      }
    }
  });
  flushList();

  return <div className="space-y-1 text-white/85">{elements}</div>;
}

/* ── "Not Found" styled notice ────────────────────────────────────────────── */
function NotFoundNotice({ message, onFeedback }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex justify-start mb-5 animate-fade-up">
      {/* Warning icon avatar */}
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mr-3 shrink-0 mt-1 shadow-lg shadow-amber-500/10">
        <AlertTriangle size={15} className="text-amber-400" />
      </div>

      <div className="not-found-bubble max-w-[82%]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">CampusMind Notice</span>
          </div>
          <button onClick={handleCopy} className="text-white/20 hover:text-white/50 transition" title="Copy">
            <Copy size={11} />
          </button>
        </div>

        {/* Not-found label */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-500/15">
          <span className="text-amber-400 text-sm">🔍</span>
          <p className="text-amber-300 font-semibold text-sm">Not Found in College Documents</p>
        </div>

        {/* Body */}
        <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-white/6 flex items-center justify-between">
          <p className="text-white/25 text-[10px] italic">
            CampusMind answers exclusively from verified official college documents.
          </p>
          {onFeedback && message._id && <FeedbackButtons messageId={message._id} onFeedback={onFeedback} />}
        </div>
      </div>
    </div>
  );
}

/* ── Detect "not found" pattern ────────────────────────────────────────────── */
function isNotFoundResponse(message) {
  if (message.role !== 'assistant') return false;
  // No sources at all, or content suggests not found
  const noSources = !message.sources || message.sources.length === 0;
  const content = (message.content || '').toLowerCase();
  const notFoundPhrases = [
    "i could not find",
    "i don't know",
    "not found in",
    "no relevant information",
    "couldn't find",
    "not available in",
    "not present in",
    "i cannot find",
    "i was unable to find",
    "no information",
  ];
  const looksLikeNotFound = notFoundPhrases.some(p => content.includes(p));
  return noSources && looksLikeNotFound;
}

export default function MessageBubble({ message, onFeedback, onRegenerate }) {
  const isUser = message.role === 'user';
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = message.sources?.length > 0;
  const [copied, setCopied] = useState(false);

  const copyAnswer = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  // Show styled not-found notice for assistant messages with no sources + not-found phrasing
  if (isNotFoundResponse(message)) {
    return <NotFoundNotice message={message} onFeedback={onFeedback} />;
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 animate-fade-up`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-brand to-blue-bright flex items-center justify-center mr-3 shrink-0 mt-1 shadow-lg shadow-blue-brand/30">
          <img src="/iitp-logo.png" alt="" className="w-6 h-6 rounded-full" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[82%]`}>
        {isUser ? (
          <div className="bubble-user">{message.content}</div>
        ) : (
          <div className="bubble-ai">
            <MarkdownContent content={message.content} />

            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/8">
              <button onClick={copyAnswer} className="message-action" title="Copy answer" aria-label="Copy answer">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              {onRegenerate && (
                <button onClick={() => onRegenerate(message)} className="message-action" title="Regenerate answer" aria-label="Regenerate answer">
                  <RefreshCw size={12} /> <span>Regenerate</span>
                </button>
              )}
            </div>

            {hasSources && (
              <div className="mt-3 pt-2 border-t border-white/8">
                <button onClick={() => setSourcesOpen(!sourcesOpen)} className="source-chip">
                  <FileText size={9} />
                  {message.sources.length} Source{message.sources.length > 1 ? 's' : ''}
                  {sourcesOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                </button>
                {sourcesOpen && (
                  <div className="mt-2 space-y-1.5 animate-fade-in">
                    {message.sources.map((src, i) => <SourceCard key={i} source={src} />)}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {message.confidenceScore > 0 && <ConfidenceBadge score={message.confidenceScore} />}
              {onFeedback && message._id && <FeedbackButtons messageId={message._id} onFeedback={onFeedback} />}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center ml-3 shrink-0 mt-1 text-white/60 text-xs font-bold">
          {message.role === 'user' ? 'U' : 'A'}
        </div>
      )}
    </div>
  );
}
