import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Shield, Users, BookOpen, ArrowRight, ChevronDown,
  Database, Search, Zap, FileCheck, GraduationCap, Building2,
  ExternalLink, Star, CheckCircle2
} from 'lucide-react';

/* ── Animated counter ──────────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(timer); }
        else setVal(Math.floor(start));
      }, 16);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Feature card ──────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <div
      className="landing-feature-card animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <div className={`landing-feature-icon ${color}`}>
        <Icon size={22} />
      </div>
      <h3 className="text-white font-bold text-base mt-4 mb-2">{title}</h3>
      <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Pipeline step ─────────────────────────────────────────────────────── */
function PipelineStep({ icon: Icon, title, desc, color, step }) {
  return (
    <div className="landing-pipeline-step">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon size={20} />
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-navy2 border border-white/10 text-[9px] font-bold text-white/50 flex items-center justify-center">
            {step}
          </span>
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm mb-1">{title}</h4>
          <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(150deg, #060d28 0%, #0b1437 40%, #0d1a45 100%)' }}>

      {/* ── Animated mesh background ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb" style={{ width: 600, height: 600, top: -200, left: -100, background: 'radial-gradient(circle, rgba(26,79,186,0.22), transparent 65%)', animationDuration: '10s' }} />
        <div className="orb" style={{ width: 400, height: 400, top: '30%', right: '-5%', background: 'radial-gradient(circle, rgba(201,168,76,0.14), transparent 65%)', animationDelay: '3s', animationDuration: '12s' }} />
        <div className="orb" style={{ width: 300, height: 300, bottom: '10%', left: '20%', background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 65%)', animationDelay: '6s' }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Sticky navbar ────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'landing-nav-scrolled' : 'landing-nav'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/campussaathi-mark.svg" alt="CampusSaathi" className="w-10 h-10 rounded-xl ring-2 ring-gold/40 shadow-lg shadow-gold/20" />
            <div>
              <p className="text-gold font-bold text-base leading-none">CampusSaathi</p>
              <p className="text-white/30 text-[10px] mt-0.5 tracking-wide">IIIT Pune knowledge assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="landing-admin-btn"
              onClick={() => navigate('/login')}
              className="btn-ghost-light px-4 py-2 text-sm"
            >
              Administrator Login
            </button>
            <button
              id="landing-open-chat-btn"
              onClick={() => navigate('/login')}
              className="btn-gold px-5 py-2 text-sm flex items-center gap-2"
            >
              Open Chat <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        {/* Badge */}
        <div className="landing-badge animate-fade-up mb-6">
          <Sparkles size={12} className="text-gold" />
          <span>Strictly Grounded Retrieval-Augmented Generation</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-fade-up max-w-4xl" style={{ animationDelay: '0.1s' }}>
          Ask Your College
          <br />
          <span className="text-gold-shimmer">Handbook Anything.</span>
        </h1>

        {/* Subtext */}
        <p className="text-white/50 text-base md:text-lg leading-relaxed max-w-2xl mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          CampusSaathi connects directly to IIIT Pune's official syllabus, circulars, fee schedules,
          exam rules, and placement notices. Every answer cites the exact source document and page — zero hallucinations, always verified.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <button
            id="hero-open-chat-btn"
            onClick={() => navigate('/login')}
            className="landing-cta-primary"
          >
            <span>Open Chat Interface</span>
            <ArrowRight size={18} />
          </button>
          <button
            id="hero-admin-login-btn"
            onClick={() => navigate('/login')}
            className="landing-cta-secondary"
          >
            Administrator Login
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 md:gap-16 mt-16 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          {[
            { val: 100, suffix: '%', label: 'Source Verified' },
            { val: 0, suffix: ' Hallucinations', label: 'Guaranteed' },
            { val: 24, suffix: '/7', label: 'Available' },
          ].map(({ val, suffix, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gold">
                <AnimatedNumber target={val} suffix={suffix} />
              </p>
              <p className="text-white/35 text-xs mt-1 tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
            <p className="text-gold/60 text-xs uppercase tracking-widest font-semibold mb-3">Why CampusSaathi</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Built for Accuracy, Not Guessing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Shield}
            title="Zero Hallucinations"
            desc="If an answer isn't in the uploaded college documents, CampusSaathi explicitly says 'I don't know' rather than making one up."
            color="feature-icon-blue"
            delay="0s"
          />
          <FeatureCard
            icon={FileCheck}
            title="Auditable Source Citations"
            desc="Every single citation includes the specific document filename, page number, and similarity confidence score for full auditability."
            color="feature-icon-gold"
            delay="0.1s"
          />
          <FeatureCard
            icon={Users}
            title="Role Separation"
            desc="Admin users upload and manage documents with background chunking and vector purge; students get fast, authenticated chat answers."
            color="feature-icon-purple"
            delay="0.2s"
          />
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── RAG Pipeline ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-gold/60 text-xs uppercase tracking-widest font-semibold mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">How the RAG Pipeline Works</h2>
          <p className="text-white/35 text-sm mt-3">A complete end-to-end architecture built with LangChain, ChromaDB, and Google Gemini.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PipelineStep
            step={1}
            icon={Database}
            title="Document Ingestion"
            desc="PDFs are chunked by page using LangChain's RecursiveCharacterTextSplitter with overlap for context continuity."
            color="pipeline-icon-blue"
          />
          <PipelineStep
            step={2}
            icon={BookOpen}
            title="Vector Storage"
            desc="Chunks are embedded using Google's text-embedding-004 model and stored persistently in ChromaDB."
            color="pipeline-icon-gold"
          />
          <PipelineStep
            step={3}
            icon={Search}
            title="Similarity Search"
            desc="Student queries are embedded at runtime and matched against vectors using cosine similarity with confidence thresholds."
            color="pipeline-icon-purple"
          />
          <PipelineStep
            step={4}
            icon={Zap}
            title="Grounded Generation"
            desc="Gemini's LLM synthesizes a cited answer exclusively from retrieved content chunks — no external knowledge used."
            color="pipeline-icon-green"
          />
        </div>
      </section>

      {/* ── Topic pills ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-white/30 text-sm mb-6">Ask about anything in the official college documents</p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            '🎓 Admissions', '💰 Fee Structure', '🏠 Hostel Rules',
            '📊 Placements', '📚 Academics', '🏆 Clubs & Events',
            '📋 Exam Rules', '🔬 Research', '📜 Scholarships', '🏫 Departments',
          ].map(tag => (
            <span key={tag} className="landing-topic-pill">{tag}</span>
          ))}
        </div>
      </section>

      {/* ── Testimonial / Trust bar ───────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="landing-trust-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
              <GraduationCap size={22} className="text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-bold text-base">IIIT Pune Official Knowledge Base</p>
                <span className="landing-verified-badge">
                  <CheckCircle2 size={10} /> Verified
                </span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed">
                All documents loaded into CampusSaathi are sourced exclusively from IIIT Pune's official publications.
                Under the administration of <span className="text-gold font-semibold">Dr. Sanjeev Sharma</span>, Dean of Academic Affairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="landing-final-cta">
          <div className="flex justify-center mb-4">
            <div className="flex -space-x-1">
              {['#1a4fba','#c9a84c','#6366f1'].map(c => (
                <div key={c} className="w-8 h-8 rounded-full border-2 border-navy2 flex items-center justify-center" style={{ background: c }}>
                  <Star size={10} className="text-white" />
                </div>
              ))}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get instant answers?</h2>
          <p className="text-white/40 text-sm mb-8">Join students already using CampusSaathi to navigate college life effortlessly.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="final-cta-chat-btn"
              onClick={() => navigate('/login')}
              className="landing-cta-primary"
            >
              <span>Start Asking Now</span>
              <ArrowRight size={18} />
            </button>
            <button
              id="final-cta-register-btn"
              onClick={() => navigate('/register')}
              className="landing-cta-secondary"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/6 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/campussaathi-mark.svg" alt="CampusSaathi" className="w-7 h-7 rounded-lg ring-1 ring-gold/30" />
          <span className="text-white/30 text-sm">Indian Institute of Information Technology, Pune</span>
        </div>
        <p className="text-white/15 text-xs">CampusSaathi answers exclusively from verified official college documents.</p>
      </footer>
    </div>
  );
}
