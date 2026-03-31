import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '../../Services/projectService';
import { applyToProject } from '../../Services/invitationService';
import Navbar from '../../Components/layout/Navbar';
import StudentProfileModal from '../workspace/StudentProfileModal';

// ─── constants ──────────────────────────────────────────
const CATEGORIES = ['All', 'AI', 'Web', 'Mobile', 'Data Science', 'Hardware', 'Design', 'Other'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const BADGE_COLOR = {
  Beginner:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Intermediate: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Advanced:     'bg-red-500/10 text-red-400 border border-red-500/20',
};

// ─── main component ─────────────────────────────────────
export default function Projects() {
  /* ---------- state ---------- */
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [difficulty, setDifficulty]   = useState('All');
  const [selected, setSelected]       = useState(null);   // project in modal
  const [showCreate, setShowCreate]   = useState(false);  // create-project modal
  const [applyProject, setApplyProject] = useState(null); // application modal
  const [selectedUserId, setSelectedUserId] = useState(null);

  /* ---------- fetch ---------- */
  useEffect(() => {
    fetchProjects();
  }, [category, difficulty]);

  async function fetchProjects() {
    try {
      setLoading(true);
      const params = {};
      if (search)                   params.search    = search;
      if (category !== 'All')       params.category  = category;
      if (difficulty !== 'All')     params.difficulty = difficulty;

      const res = await getProjects(params);
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  }

  /* search on Enter key */
  function handleSearchKey(e) {
    if (e.key === 'Enter') fetchProjects();
  }

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      <Navbar />

      {/* ── hero / header ── */}
      <div className="relative py-12 px-6 text-center border-b border-white/5 bg-[#0f0f13] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-3 text-white tracking-tight">Explore Projects</h1>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            Discover exciting projects, filter by tech stack or category, and find the perfect team to join.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-900/40"
          >
            + Create New Project
          </button>
        </div>
      </div>

      {/* ── search + filters ── */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-20">
        <div className="bg-[#1e1e2a] rounded-xl shadow-2xl p-4 flex flex-col md:flex-row gap-4 items-center border border-white/5">
          {/* search bar */}
          <div className="flex-1 flex gap-2 w-full">
            <input
              type="text"
              placeholder="Search by title or tech stack…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500/50 outline-none placeholder-gray-500"
            />
            <button
              onClick={fetchProjects}
              className="bg-violet-600 text-white px-5 py-2 rounded-lg hover:bg-violet-700 transition font-medium"
            >
              Search
            </button>
          </div>

          {/* difficulty dropdown */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} className="bg-[#1e1e2a]">{d}</option>
            ))}
          </select>
        </div>

        {/* category chips */}
        <div className="flex flex-wrap gap-2 mt-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                category === cat
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-violet-500/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── project grid ── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-center text-gray-500 py-20 animate-pulse">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-[#1e1e2a] rounded-2xl border border-white/5 shadow-xl">
             <p className="text-gray-400">No projects found. Try a different filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <ProjectCard 
                key={p._id} 
                project={p} 
                onView={() => setSelected(p)} 
                onApply={() => setApplyProject(p)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* ── detail modal ── */}
      {selected && (
        <ProjectModal 
          project={selected} 
          onClose={() => setSelected(null)} 
          onViewProfile={(uid) => setSelectedUserId(uid)}
        />
      )}

      {/* ── create project modal ── */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchProjects(); }}
        />
      )}

      {/* ── apply to project modal ── */}
      {applyProject && (
        <ApplyModal project={applyProject} onClose={() => setApplyProject(null)} />
      )}

      {/* ── student profile modal ── */}
      {selectedUserId && (
        <StudentProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

// ─── Project Card ───────────────────────────────────────
function ProjectCard({ project, onView, onApply }) {
  const p = project;
  return (
    <div className="bg-[#1e1e2a] rounded-2xl shadow-xl border border-white/5 hover:border-violet-500/30 transition-colors p-6 flex flex-col relative group overflow-hidden">
      {/* top row: difficulty + category */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${BADGE_COLOR[p.difficulty] || 'bg-white/10 text-gray-400'}`}>
          {p.difficulty}
        </span>
        {p.category && (
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{p.category}</span>
        )}
      </div>

      {/* title */}
      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 tracking-tight">{p.title}</h3>

      {/* description */}
      <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed">{p.description}</p>

      {/* tech stack chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(p.techStack || []).slice(0, 5).map((t) => (
          <span key={t} className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            {t}
          </span>
        ))}
        {(p.techStack || []).length > 5 && (
          <span className="text-xs text-gray-500 font-medium">+{p.techStack.length - 5}</span>
        )}
      </div>

      {/* footer */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-xs text-gray-500">
          by <span className="text-gray-300 font-medium">{p.createdBy?.name || 'Unknown'}</span>
        </span>
        <div className="flex gap-2">
            <button
              onClick={onApply}
              className="bg-white/5 text-gray-300 font-medium text-xs px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              Apply
            </button>
            <button
              onClick={onView}
              className="bg-violet-600 text-white font-medium text-xs px-4 py-2 rounded-lg hover:bg-violet-700 transition shadow-lg shadow-violet-900/30"
            >
              View
            </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Detail Modal ───────────────────────────────
function ProjectModal({ project, onClose, onViewProfile }) {
  const p = project;
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#1e1e2a] rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl transition">&times;</button>

        {/* header */}
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${BADGE_COLOR[p.difficulty] || 'bg-white/5 text-gray-400 border-white/10'}`}>
            {p.difficulty}
          </span>
          {p.category && <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">{p.category}</span>}
          {p.status && (
            <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.status}</span>
          )}
        </div>
        <h2 className="text-3xl font-bold text-white mt-3 tracking-tight">{p.title}</h2>
        <p className="text-sm text-gray-500 mb-6 font-medium">by <span className="text-gray-300">{p.createdBy?.name || 'Unknown'}</span></p>

        {/* description */}
        <Section title="Description">
          <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">{p.description}</p>
        </Section>

        {/* tech stack */}
        <Section title="Tech Stack">
          <div className="flex flex-wrap gap-2">
            {(p.techStack || []).map((t) => (
              <span key={t} className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded">{t}</span>
            ))}
          </div>
        </Section>

        {/* estimated duration */}
        {p.estimatedDuration && (
          <Section title="Estimated Duration">
            <p className="text-gray-300 text-sm font-medium">{p.estimatedDuration}</p>
          </Section>
        )}

        {/* datasets */}
        {p.datasets?.length > 0 && (
          <Section title="Datasets">
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              {p.datasets.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </Section>
        )}

        {/* kaggle dataset links */}
        {p.datasetLinks?.length > 0 && (
          <Section title="Kaggle Datasets">
            <div className="space-y-2 relative z-10">
              {p.datasetLinks.map((ds, i) => (
                <a key={i} href={ds.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-violet-500/30 transition group">
                  <span className="text-sm font-medium text-violet-400 group-hover:text-violet-300">{ds.name}</span>
                  {ds.size && <span className="text-xs text-gray-500 bg-black/40 px-2 py-1 rounded">{ds.size}</span>}
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* challenges */}
        {p.challenges?.length > 0 && (
          <Section title="Challenges">
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              {p.challenges.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </Section>
        )}

        {/* improvements */}
        {p.improvements?.length > 0 && (
          <Section title="Possible Improvements">
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              {p.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
            </ul>
          </Section>
        )}

        {/* team members */}
        {p.teamMembers?.length > 0 && (
          <Section title="Team Members">
            <div className="flex flex-wrap gap-3">
              {p.teamMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {(m.user?.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200">{m.user?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-violet-400">{m.role}</p>
                      <button 
                        onClick={() => onViewProfile(m.user?._id)}
                        className="text-[9px] text-gray-500 hover:text-white uppercase font-bold transition"
                      >
                        (View Profile)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
          <button
            onClick={() => {
              onClose();
              navigate(`/workspace/${p._id}/hub`);
            }}
            className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-bold hover:bg-violet-700 transition shadow-lg shadow-violet-900/30"
          >
            Enter Workspace 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Project Modal ────────────────────────────────
const CREATE_CATEGORIES = ['AI', 'Web', 'Mobile', 'Data Science', 'Hardware', 'Design', 'Other'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    techStack: '',
    difficulty: 'Beginner',
    category: '',
    estimatedDuration: '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await createProject({
        ...form,
        techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean),
      });
      onCreated();
    } catch (err) {
      console.error('Create failed', err);
      alert(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <form
        className="bg-[#1e1e2a] rounded-2xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative custom-scrollbar"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl transition">&times;</button>
        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Create New Project</h2>

        {/* title */}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-gray-300 block mb-1.5">Project Title *</span>
          <input name="title" value={form.title} onChange={handleChange} required
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 transition shadow-inner" />
        </label>

        {/* description */}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-gray-300 block mb-1.5">Description *</span>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 transition shadow-inner resize-none" />
        </label>

        {/* tech stack */}
        <label className="block mb-4">
          <span className="text-sm font-semibold text-gray-300 block mb-1.5">Tech Stack</span>
          <input name="techStack" value={form.techStack} onChange={handleChange}
            placeholder="React, Node.js, MongoDB"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 transition shadow-inner" />
          <span className="text-xs text-gray-500 mt-1 block">Comma-separated values</span>
        </label>

        {/* difficulty + category row */}
        <div className="flex gap-4 mb-4">
          <label className="flex-1">
            <span className="text-sm font-semibold text-gray-300 block mb-1.5">Difficulty</span>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white transition shadow-inner">
              <option className="bg-[#1e1e2a]">Beginner</option>
              <option className="bg-[#1e1e2a]">Intermediate</option>
              <option className="bg-[#1e1e2a]">Advanced</option>
            </select>
          </label>
          <label className="flex-1">
            <span className="text-sm font-semibold text-gray-300 block mb-1.5">Category</span>
            <select name="category" value={form.category} onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white transition shadow-inner">
              <option value="" className="bg-[#1e1e2a] text-gray-500">Select…</option>
              {CREATE_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1e1e2a]">{c}</option>)}
            </select>
          </label>
        </div>

        {/* estimated duration */}
        <label className="block mb-8">
          <span className="text-sm font-semibold text-gray-300 block mb-1.5">Estimated Duration</span>
          <input name="estimatedDuration" value={form.estimatedDuration} onChange={handleChange}
            placeholder="e.g. 4-6 weeks"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 transition shadow-inner" />
        </label>

        {/* submit */}
        <button type="submit" disabled={saving}
          className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold hover:bg-violet-700 transition disabled:opacity-50 shadow-lg shadow-violet-900/40">
          {saving ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}

// ─── small helper ───────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );
}

// ─── Apply Modal ────────────────────────────────────────
function ApplyModal({ project, onClose }) {
    const [form, setForm] = useState({ role: '', message: '' })
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.role.trim()) return
        setSubmitting(true)
        try {
            await applyToProject(project._id, form.role, form.message)
            alert('Application sent successfully!')
            onClose()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send application. You might have already applied.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <form 
                className="bg-[#1e1e2a] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full p-6 relative" 
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl transition">&times;</button>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Request to Join</h3>
                <p className="text-sm text-gray-400 mb-6">Applying to: <span className="font-semibold text-white">{project.title}</span></p>

                <label className="block mb-5">
                    <span className="text-sm font-semibold text-gray-300 block mb-1">What role are you applying for?</span>
                    <input 
                        required
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        placeholder="e.g. Frontend Developer, ML Engineer"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 shadow-inner transition" 
                    />
                </label>

                <label className="block mb-8">
                    <span className="text-sm font-semibold text-gray-300 block mb-1">Message to the owner (optional)</span>
                    <textarea 
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Why do you want to join? What are your relevant skills?"
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 shadow-inner transition resize-none" 
                    />
                </label>

                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-violet-600 font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50 shadow-lg shadow-violet-900/30">
                        {submitting ? 'Sending...' : 'Send Application'}
                    </button>
                </div>
            </form>
        </div>
    )
}
