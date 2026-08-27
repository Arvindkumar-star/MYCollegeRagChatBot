import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Upload, Trash2, RefreshCw, BarChart2, FolderPlus, BookOpen,
  CheckCircle, Clock, XCircle, LogOut, MessageSquare, ThumbsUp,
  ArrowLeft, FileText, Database, Users, TrendingUp, Settings,
  Shield, Cpu, Layers, Key, Activity, GraduationCap, User
  , Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ProfileMenu from '../components/ProfileMenu';
import { useNavigate } from 'react-router-dom';

/* ─── Upload Modal ───────────────────────────────────────────────────────── */
function UploadModal({ collections, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return toast.error('File and title required');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file); fd.append('title', title);
    if (collectionId) fd.append('collectionId', collectionId);
    try {
      await adminAPI.uploadDocument(fd);
      toast.success('Document uploaded! Processing in background…');
      onSuccess(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-7 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-brand/20 flex items-center justify-center">
            <Upload size={18} className="text-blue-bright" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Upload Document</h2>
            <p className="text-white/35 text-xs">PDF files up to 50MB</p>
          </div>
        </div>

        <form id="upload-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Document Title *</label>
            <input className="input-dark" placeholder="e.g. Admission Brochure 2024" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Collection / Category</label>
            <select className="input-dark" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}
              style={{ color: collectionId ? '#e2e8f0' : 'rgba(255,255,255,0.3)' }}>
              <option value="">-- No collection --</option>
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">PDF File *</label>
            <div onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${file ? 'border-gold/40 bg-gold/5' : 'border-white/10 hover:border-white/20 hover:bg-white/3'}`}>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => setFile(e.target.files[0])} />
              {file ? (
                <div className="text-gold">
                  <FileText size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gold/60 mt-1">
                    {file.size === 0
                      ? 'Size loading…'
                      : file.size < 1048576
                      ? `${(file.size / 1024).toFixed(0)} KB`
                      : `${(file.size / 1048576).toFixed(2)} MB`}
                  </p>
                </div>
              ) : (
                <>
                  <Upload size={24} className="mx-auto mb-2 text-white/20" />
                  <p className="text-white/40 text-sm">Click to select a PDF</p>
                  <p className="text-white/20 text-xs mt-1">Maximum 50MB</p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost-light flex-1 py-2.5">Cancel</button>
            <button id="upload-submit-btn" type="submit" disabled={loading || !file} className="btn-blue flex-1 py-2.5 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Uploading…</> : <><Upload size={15} />Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Settings Tab ───────────────────────────────────────────────────────── */
function SettingsTab({ user, logout, documents }) {
  const [ragStatus] = useState({
    fastapi: { label: 'FastAPI Service', status: 'Online (v1.0.0)', color: 'text-green-400', dot: 'bg-green-400' },
    chroma: { label: 'ChromaDB Vectors', status: `${documents.reduce((s, d) => s + (d.chunkCount || 0), 0)} Chunks Indexed`, color: 'text-blue-bright', dot: 'bg-blue-bright' },
    gemini: { label: 'Gemini API Key', status: 'Active (Pro/Flash)', color: 'text-gold', dot: 'bg-gold' },
  });

  return (
    <div className="animate-fade-up space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Settings size={20} className="text-gold/70" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Account & System Settings</h2>
          <p className="text-white/35 text-sm">Manage your profile and verify connected AI system status</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="admin-settings-section">
        <div className="admin-settings-section-header">
          <User size={13} className="text-white/40" />
          <span>User Profile</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center text-gold text-2xl font-bold shadow-lg shadow-gold/10">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-bold text-lg">{user?.name}</p>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-bold uppercase tracking-wider">
                <Shield size={8} /> Admin
              </span>
            </div>
            <p className="text-white/40 text-sm mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Dean Info */}
      <div className="admin-settings-section">
        <div className="admin-settings-section-header">
          <GraduationCap size={13} className="text-white/40" />
          <span>Academic Administration</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-brand/30 to-blue-bright/10 border border-blue-bright/20 flex items-center justify-center text-blue-bright text-lg font-bold">
            S
          </div>
          <div>
            <p className="text-white font-semibold">Dr. Sanjeev Sharma</p>
            <p className="text-white/40 text-sm">Dean of Academic Affairs · IIIT Pune</p>
            <p className="text-white/25 text-xs mt-0.5">dean@iiitp.ac.in</p>
          </div>
        </div>
      </div>

      {/* RAG Engine Status */}
      <div className="admin-settings-section">
        <div className="flex items-center justify-between mb-4">
          <div className="admin-settings-section-header mb-0">
            <Activity size={13} className="text-white/40" />
            <span>Connected RAG Engine Status</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Backend
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.values(ragStatus).map(({ label, status, color, dot }) => (
            <div key={label} className="rag-status-card">
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
              </div>
              <p className={`font-bold text-sm ${color}`}>{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="admin-settings-section border-red-500/20 bg-red-500/3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 font-semibold text-sm">Sign Out</p>
            <p className="text-white/30 text-xs mt-0.5">Clear active JWT session on this device</p>
          </div>
          <button
            id="admin-signout-btn"
            onClick={logout}
            className="btn-danger flex items-center gap-2 px-4 py-2"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main AdminPage ─────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!documents.some((doc) => doc.status === 'processing')) return undefined;
    const timer = setInterval(() => loadData(false), 5000);
    return () => clearInterval(timer);
  }, [documents]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [docs, cols] = await Promise.all([adminAPI.getDocuments(), adminAPI.getCollections()]);
      setDocuments(docs.data); setCollections(cols.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'analytics') {
      adminAPI.getAnalytics().then(r => setAnalytics(r.data)).catch(() => {});
    }
  }, [tab]);

  const deleteDoc = async (id) => {
    if (!confirm('Soft-delete this document?')) return;
    try { await adminAPI.deleteDocument(id); toast.success('Document deleted'); loadData(); }
    catch { toast.error('Delete failed'); }
  };

  const retryDoc = async (id) => {
    try {
      await adminAPI.retryDocument(id);
      toast.success('Document reprocessing started');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Retry failed');
    }
  };

  const createCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    setCreating(true);
    try {
      await adminAPI.createCollection({ name: newColName.trim() });
      toast.success(`Collection "${newColName.trim()}" created!`);
      setNewColName('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const deleteCollection = async (id, name) => {
    if (!confirm(`Delete collection "${name}"? Documents inside will not be deleted.`)) return;
    try {
      await adminAPI.deleteCollection(id);
      toast.success(`Collection "${name}" deleted`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete collection');
    }
  };

  const statusBadge = (s) => {
    const map = { ready: 'badge-ready', processing: 'badge-processing', failed: 'badge-failed' };
    return <span className={map[s] || 'badge-inactive'}>{s}</span>;
  };

  const TABS = [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'collections', label: 'Collections', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0b1437 0%, #0d1a45 100%)' }}>
      {/* Bg orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="orb orb-1" /><div className="orb orb-2" />
      </div>

      {/* Header */}
      <header className="portal-header px-6 py-3.5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => navigate('/chat')} className="text-white/30 hover:text-white/70 transition mr-1" title="Back to chat">
            <ArrowLeft size={16} />
          </button>
          <img
            src="/iitp-logo.png"
            alt="IIIT Pune"
            className="w-8 h-8 rounded-full ring-1 ring-gold/30 cursor-pointer hover:ring-gold/60 transition-all"
            onClick={() => navigate('/')}
            title="Home"
          />
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Admin Dashboard</h1>
            <p className="text-[10px] text-white/30 mt-0.5">IIIT Pune Knowledge Base Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white/70">Dr. Sanjeev Sharma <span className="text-gold/60 font-normal">(Dean)</span></p>
            <p className="text-[10px] text-gold/60">Administrator · {user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/40 to-gold/20 flex items-center justify-center text-gold text-xs font-bold ring-2 ring-gold/30 shadow-lg shadow-gold/20">
            S
          </div>
          <ProfileMenu compact />
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-white/4 rounded-xl p-1 w-fit border border-white/8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} id={`tab-${id}`} onClick={() => setTab(id)}
              className={`tab-btn flex items-center gap-1.5 ${tab === id ? 'active' : ''}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-white/65">
          <Shield size={16} className="mt-0.5 shrink-0 text-gold" />
          <p><span className="font-semibold text-gold">Authorized administrators only.</span> This dashboard can upload, replace, and delete knowledge-base content. Do not share this account or leave it signed in on a shared device.</p>
        </div>

        {/* ═══════════ DOCUMENTS TAB ═══════════ */}
        {tab === 'documents' && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Documents</h2>
                <p className="text-white/35 text-sm mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''} in knowledge base</p>
              </div>
              <button id="open-upload-btn" onClick={() => setShowUpload(true)} className="btn-gold flex items-center gap-2 px-4 py-2.5">
                <Upload size={14} /> Upload Document
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-white/30 text-sm">Loading…</div>
              ) : documents.length === 0 ? (
                <div className="p-16 text-center">
                  <FileText size={40} className="mx-auto mb-4 text-white/10" />
                  <p className="text-white/40 text-sm">No documents uploaded yet</p>
                  <p className="text-white/20 text-xs mt-1">Click "Upload Document" to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Collection</th>
                        <th>Status</th>
                        <th>Chunks</th>
                        <th>Version</th>
                        <th>Uploaded</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc._id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-brand/15 flex items-center justify-center shrink-0">
                                <FileText size={12} className="text-blue-bright" />
                              </div>
                              <span className="font-medium text-white/80 text-sm">{doc.title}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-white/40 text-xs">{doc.collectionId?.name || '—'}</span>
                          </td>
                          <td>
                            <span title={doc.processingError || ''}>{statusBadge(doc.status)}</span>
                            {doc.processingError && <p className="text-red-400/70 text-[10px] mt-1 max-w-[180px] truncate" title={doc.processingError}>{doc.processingError}</p>}
                          </td>
                          <td><span className="text-white/50 text-xs">{doc.chunkCount || '—'}</span></td>
                          <td><span className="text-white/30 text-xs">v{doc.version}</span></td>
                          <td><span className="text-white/30 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</span></td>
                          <td>
                            {(doc.status === 'processing' || doc.status === 'failed') && (
                              <button id={`retry-doc-${doc._id}`} onClick={() => retryDoc(doc._id)}
                                className="text-white/30 hover:text-blue-bright transition p-1 rounded-lg hover:bg-blue-400/10 mr-1"
                                title="Retry processing">
                                <RefreshCw size={13} />
                              </button>
                            )}
                            <button id={`delete-doc-${doc._id}`} onClick={() => deleteDoc(doc._id)}
                              className="text-white/20 hover:text-red-400 transition p-1 rounded-lg hover:bg-red-400/10"
                              title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ COLLECTIONS TAB ═══════════ */}
        {tab === 'collections' && (
          <div className="animate-fade-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Collections</h2>
              <p className="text-white/35 text-sm mt-0.5">Organize documents by department or topic</p>
            </div>

            {/* Create collection */}
            <div className="glass-card p-5 mb-6">
              <h3 className="text-sm font-semibold text-white/70 mb-3">Create New Collection</h3>
              <form id="create-collection-form" onSubmit={createCollection} className="flex gap-3">
                <input
                  className="input-dark flex-1"
                  placeholder="e.g. Research Papers"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  disabled={creating}
                />
                <button
                  id="create-collection-btn"
                  type="submit"
                  disabled={creating || !newColName.trim()}
                  className="btn-blue px-5 flex items-center gap-1.5 min-w-[100px] justify-center"
                >
                  {creating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <FolderPlus size={14} /> Create
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {collections.map(col => (
                <div key={col._id} className="stat-card flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white/80 text-sm truncate">{col.name}</p>
                    <p className="text-white/30 text-xs mt-0.5">{col.documentCount || 0} documents</p>
                  </div>
                  <button
                    id={`delete-col-${col._id}`}
                    onClick={() => deleteCollection(col._id, col.name)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-400/10 shrink-0"
                    title="Delete collection"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ ANALYTICS TAB ═══════════ */}
        {tab === 'analytics' && (
          <div className="animate-fade-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Analytics</h2>
              <p className="text-white/35 text-sm mt-0.5">Usage statistics and chatbot performance</p>
            </div>

            {!analytics ? (
              <div className="text-white/30 text-sm text-center py-16">Loading analytics…</div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Queries', value: analytics.totalQueries, icon: MessageSquare, color: 'text-blue-bright' },
                    { label: 'Positive Feedback', value: analytics.positiveFeedback ?? '—', icon: ThumbsUp, color: 'text-green-400' },
                    { label: 'Documents', value: analytics.totalDocuments ?? documents.length, icon: FileText, color: 'text-gold' },
                    { label: 'Unanswered', value: analytics.unansweredQueries ?? '—', icon: XCircle, color: 'text-red-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card">
                      <Icon size={18} className={`${color} mb-3`} />
                      <p className="text-2xl font-bold text-white">{value ?? 0}</p>
                      <p className="text-white/35 text-xs mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {analytics.topDocuments?.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TrendingUp size={13} /> Most Referenced Documents
                    </h3>
                    <div className="space-y-2">
                      {analytics.topDocuments.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-white/20 text-xs w-4">{i + 1}.</span>
                            <FileText size={11} className="text-gold/50" />
                            <span className="text-white/60 truncate max-w-xs">{d.title}</span>
                          </div>
                          <span className="text-white/30 text-xs shrink-0 ml-2">{d.count} refs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════ SETTINGS TAB ═══════════ */}
        {tab === 'settings' && (
          <SettingsTab user={user} logout={logout} documents={documents} />
        )}
      </div>

      {showUpload && <UploadModal collections={collections} onClose={() => setShowUpload(false)} onSuccess={loadData} />}
    </div>
  );
}
