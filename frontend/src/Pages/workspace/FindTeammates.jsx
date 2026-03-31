import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../Components/layout/Navbar';
import { getProjectById } from '../../Services/projectService';
import { getProjectMatches } from '../../Services/matchingService';
import { sendInvitation } from '../../Services/invitationService';
import StudentProfileModal from './StudentProfileModal';

function toRoleList(requiredRoles) {
  if (!requiredRoles?.length) return '';
  return requiredRoles.join(', ');
}

export default function FindTeammates() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [requiredRolesInput, setRequiredRolesInput] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [inviting, setInviting] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);

  const requiredRoles = useMemo(
    () => requiredRolesInput.split(',').map((r) => r.trim()).filter(Boolean),
    [requiredRolesInput]
  );

  async function loadInitial() {
    try {
      setLoading(true);
      const projectRes = await getProjectById(projectId);
      const currentProject = projectRes.project;
      setProject(currentProject);
      setRequiredRolesInput(toRoleList(currentProject.requiredRoles));

      const matchRes = await getProjectMatches(projectId, {
        requiredRoles: currentProject.requiredRoles || [],
        teamSize,
      });
      setMatches(matchRes.matches || []);
    } catch (err) {
      console.error('Failed to load teammates data', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function runMatching() {
    try {
      setLoading(true);
      const matchRes = await getProjectMatches(projectId, {
        requiredRoles,
        teamSize,
      });
      setMatches(matchRes.matches || []);
    } catch (err) {
      console.error('Failed to fetch matches', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(userId) {
    setInviting(prev => ({ ...prev, [userId]: true }));
    try {
      await sendInvitation({
        projectId,
        receiverId: userId,
        role: 'Member'
      });
      alert('Invitation sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invitation. They might already be invited.');
    } finally {
      setInviting(prev => ({ ...prev, [userId]: false }));
    }
  }

  useEffect(() => {
    loadInitial();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Find Teammates</h1>
            <p className="text-lg text-gray-400 mt-2">
              Recruiting the best talent for <span className="text-violet-400 font-semibold">{project?.title || 'your project'}</span>
            </p>
          </div>
          <Link
            to={`/workspace/${projectId}/hub`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition font-medium"
          >
            ← Back to Workspace
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#1e1e2a] rounded-2xl p-6 border border-white/5 shadow-2xl mb-10 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Required Skills / Roles</label>
              <input
                value={requiredRolesInput}
                onChange={(e) => setRequiredRolesInput(e.target.value)}
                placeholder="e.g. React, Node.js, Python, Designer"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ideal Team Size</label>
              <input
                type="number"
                min="1"
                max="12"
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value) || 1)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none transition"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={runMatching}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-violet-900/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Analyzing Talent...' : 'Refresh Matches'}
            </button>
          </div>
        </div>

        {/* Candidates Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-xl font-medium text-gray-400">Scanning campus for the best fits...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
            <p className="text-2xl text-gray-500 font-medium">No candidates meet your criteria yet.</p>
            <p className="text-gray-600 mt-2">Try broadening your role search or skill requirements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match.user._id} className="group relative bg-[#1e1e2a] rounded-3xl border border-white/5 p-6 hover:border-violet-500/30 transition-all duration-300 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-xs font-bold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-full">
                    {match.matchScore}% Match
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-xl font-extrabold shadow-lg">
                    {(match.user.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight line-clamp-1">{match.user.name}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">{match.user.email}</p>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Skills</p>
                    <p className="text-xs text-white font-bold">{match.explanation?.skillScore || 0}%</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Role</p>
                    <p className="text-xs text-white font-bold">{match.explanation?.roleScore || 0}%</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2 text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Time</p>
                    <p className="text-xs text-white font-bold">{match.explanation?.availabilityScore || 0}%</p>
                  </div>
                </div>

                {/* Top Arsenal */}
                <div className="mb-8">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Technical Arsenal</p>
                  <div className="flex flex-wrap gap-2">
                    {(match.user.topSkills || []).slice(0, 5).map((skill) => (
                      <span key={skill} className="text-[11px] bg-white/5 text-gray-300 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/10 transition cursor-default">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto">
                    <button
                        onClick={() => setSelectedUserId(match.user._id)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition uppercase tracking-widest"
                    >
                        View Profile
                    </button>
                    <button
                        onClick={() => handleInvite(match.user._id)}
                        disabled={inviting[match.user._id]}
                        className="flex-[1.5] px-4 py-3 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition uppercase tracking-widest disabled:opacity-50"
                    >
                        {inviting[match.user._id] ? 'Sending...' : 'Send Invitation'}
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedUserId && (
          <StudentProfileModal 
            userId={selectedUserId} 
            onClose={() => setSelectedUserId(null)} 
          />
      )}
    </div>
  );
}
