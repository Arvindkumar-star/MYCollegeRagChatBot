import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Zap, Shield, User, Loader2 } from 'lucide-react';

const DEMO_ADMIN = { email: 'admin@iiitp.ac.in', password: 'Admin@1234', name: 'Admin' };
const DEMO_STUDENT = { email: 'student@iiitp.ac.in', password: 'Student@1234', name: 'Demo Student' };

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'admin' | 'student' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/chat');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Fill the form fields only (no auto-submit)
  const fillDemo = (creds) => {
    setForm({ email: creds.email, password: creds.password });
    toast('Demo credentials filled — click Sign In!', { icon: '✨' });
  };

  // Auto login (+ register if needed) for student demo
  const quickLoginStudent = async () => {
    setDemoLoading('student');
    try {
      // Try login first
      const user = await login(DEMO_STUDENT.email, DEMO_STUDENT.password);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/chat');
    } catch {
      // Account doesn't exist → auto-register then login
      try {
        await register(DEMO_STUDENT.name, DEMO_STUDENT.email, DEMO_STUDENT.password);
        toast.success('Demo student account created & logged in!');
        navigate('/chat');
      } catch (regErr) {
        toast.error(regErr.response?.data?.error || 'Could not create demo account');
      }
    } finally {
      setDemoLoading(null);
    }
  };

  // Quick login for admin (must already exist)
  const quickLoginAdmin = async () => {
    setDemoLoading('admin');
    try {
      const user = await login(DEMO_ADMIN.email, DEMO_ADMIN.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/admin');
    } catch {
      // Fall back to filling the form
      fillDemo(DEMO_ADMIN);
      toast.error('Admin account not found — credentials filled. Ask your admin to seed the DB.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="auth-page min-h-screen flex relative overflow-hidden px-3 sm:px-6" style={{ background: 'linear-gradient(135deg, #0b1437 0%, #0d1a45 100%)' }}>
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ─── Left — branding panel ────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-14 relative z-10">
        {/* Logo — clickable to home */}
        <div className="flex items-center gap-3 animate-fade-up cursor-pointer group" onClick={() => navigate('/')}>
          <img src="/iitp-logo.png" alt="IIIT Pune" className="w-14 h-14 rounded-full ring-2 ring-gold/40 shadow-lg shadow-gold/20 group-hover:ring-gold/70 transition-all" />
          <div>
            <p className="text-gold font-bold text-lg leading-none group-hover:text-gold-light transition-colors">IIIT Pune</p>
            <p className="text-white/40 text-xs mt-0.5">Est. 2016</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-gold/70 text-sm font-medium tracking-widest uppercase mb-4">Knowledge Assistant</p>
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">
            Your Campus,<br />
            <span className="text-gold-shimmer">Your Answers.</span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-md">
            Instantly access admissions info, fee structures, hostel details,
            placements data and more — powered by official IIIT Pune documents.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['🎓 Admissions', '💰 Fee Structure', '🏠 Hostel', '📊 Placements', '📚 Academics', '🏆 Clubs'].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full text-white/60 border border-white/10 bg-white/5 hover:border-gold/30 hover:text-white/80 transition-all">{f}</span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-white/25 text-xs italic">"Knowledge is the foundation of excellence."</p>
          <p className="text-white/15 text-xs mt-1">— Indian Institute of Information Technology, Pune</p>
        </div>
      </div>

      {/* ─── Right — login form ───────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-8 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="auth-logo flex items-center gap-3 mb-8 lg:hidden cursor-pointer" onClick={() => navigate('/')}>
            <img src="/iitp-logo.png" alt="IIIT Pune" className="w-12 h-12 rounded-full ring-2 ring-gold/40" />
            <div>
              <p className="text-gold font-bold">IIIT Pune</p>
              <p className="text-white/40 text-xs">Knowledge Assistant</p>
            </div>
          </div>

          {/* Card with glowing border */}
          <div className="auth-card login-glow-card p-4 sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white mb-1">Sign In</h2>
              <p className="text-white/40 text-sm">Access the IIIT Pune knowledge base</p>
            </div>

            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  id="email" type="email" required autoComplete="email"
                  className="input-dark input-glow"
                  placeholder="you@iiitp.ac.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    required autoComplete="current-password"
                    className="input-dark input-glow pr-10"
                    placeholder="Your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button id="login-submit-btn" type="submit" disabled={loading}
                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 mt-2 text-base">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/20 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <p className="text-center text-sm text-white/40">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold hover:text-gold-light font-semibold transition-colors">
                Register here
              </Link>
            </p>
          </div>

          {/* ── Demo credentials card ─────────────────────────────────── */}
          <div className="mt-4 demo-creds-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gold/20 flex items-center justify-center">
                <Zap size={12} className="text-gold" />
              </div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Try Demo Accounts</p>
            </div>
            <div className="space-y-2">
              {/* Admin demo */}
              <div className="demo-cred-row">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                    <Shield size={12} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-semibold">Admin</p>
                    <p className="text-white/35 text-[10px] truncate">{DEMO_ADMIN.email}</p>
                  </div>
                </div>
                <button
                  id="fill-admin-demo-btn"
                  type="button"
                  onClick={quickLoginAdmin}
                  disabled={demoLoading !== null}
                  className="demo-fill-btn"
                >
                  {demoLoading === 'admin'
                    ? <Loader2 size={11} className="animate-spin" />
                    : 'Login ↗'}
                </button>
              </div>
              {/* Student demo */}
              <div className="demo-cred-row">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-brand/20 border border-blue-bright/25 flex items-center justify-center shrink-0">
                    <User size={12} className="text-blue-bright" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-semibold">Student</p>
                    <p className="text-white/35 text-[10px] truncate">{DEMO_STUDENT.email}</p>
                  </div>
                </div>
                <button
                  id="fill-student-demo-btn"
                  type="button"
                  onClick={quickLoginStudent}
                  disabled={demoLoading !== null}
                  className="demo-fill-btn demo-fill-btn-blue"
                >
                  {demoLoading === 'student'
                    ? <Loader2 size={11} className="animate-spin" />
                    : 'Login ↗'}
                </button>
              </div>
            </div>
            <p className="text-white/20 text-[10px] mt-3 text-center">
              One click — auto-creates account if needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
