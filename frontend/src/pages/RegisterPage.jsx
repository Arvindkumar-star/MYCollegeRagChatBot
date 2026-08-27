import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, UserPlus } from 'lucide-react';

const ROLES = [
  {
    key: 'student',
    icon: GraduationCap,
    title: 'Student',
    desc: 'Access the chatbot to get answers about admissions, fees, hostel, placements & more.',
    color: 'from-blue-brand/20 to-blue-bright/10',
  },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'student',
      });
      const user = await login(form.email, form.password);
      toast.success(`Welcome to IIIT Pune, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/chat');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #0b1437 0%, #0d1a45 100%)' }}>

      {/* Animated bg */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="w-full max-w-lg relative z-10 animate-scale-in">
        {/* Logo header */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src="/iitp-logo.png" alt="IIIT Pune" className="w-14 h-14 rounded-full ring-2 ring-gold/40 shadow-lg shadow-gold/20" />
          <div>
            <p className="text-gold font-bold text-lg leading-none">IIIT Pune</p>
            <p className="text-white/40 text-xs mt-0.5">Create your account</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-white/40 text-sm mt-1">Join the IIIT Pune Knowledge Assistant</p>
          </div>

          {/* ─── Role selection ─── */}
          <div className="mb-7">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">I am registering as</p>
              <div className="grid grid-cols-1 gap-3">
              {ROLES.map(({ key, icon: Icon, title, desc, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  id={`role-${key}`}
                  className={`role-card text-left ${role === key ? 'selected' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                    <Icon size={18} className={role === key ? 'text-gold' : 'text-white/50'} />
                  </div>
                  <p className={`font-semibold text-sm mb-1 ${role === key ? 'text-gold-light' : 'text-white/70'}`}>{title}</p>
                  <p className="text-white/35 text-xs leading-snug">{desc}</p>
                  {role === key && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <span className="text-gold text-xs font-medium">Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Form ─── */}
          <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Full Name</label>
              <input className="input-dark" placeholder="Your full name" required value={form.name} onChange={update('name')} id="reg-name" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
              <input className="input-dark" type="email" placeholder="you@iiitp.ac.in" required value={form.email} onChange={update('email')} id="reg-email" autoComplete="email" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    className="input-dark pr-9"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 chars"
                    required minLength={6}
                    value={form.password} onChange={update('password')}
                    id="reg-password" autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Confirm</label>
                <input className="input-dark" type="password" placeholder="Repeat password" required
                  value={form.confirm} onChange={update('confirm')} id="reg-confirm" autoComplete="new-password" />
              </div>
            </div>

            <button id="register-submit-btn" type="submit" disabled={loading}
              className="btn-gold w-full py-3 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Student Account
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/35 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:text-gold-light font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
