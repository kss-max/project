import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../Components/layout/Navbar';
import { getProjectById } from '../../Services/projectService';
import { getProjectMatches } from '../../Services/matchingService';
import { sendInvitation } from '../../Services/invitationService';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find Teammates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Project: {project?.title || 'Loading...'}
            </p>
          </div>
          <Link
            to="/projects"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Projects
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Roles (comma-separated)</label>
            <input
              value={requiredRolesInput}
              onChange={(e) => setRequiredRolesInput(e.target.value)}
              placeholder="frontend, backend, ml"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Team Size</label>
            <input
              type="number"
              min="1"
              max="12"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={runMatching}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Run Matching
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Finding best teammates...</p>
        ) : matches.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No candidate matches found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((match) => (
              <div key={match.user._id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{match.user.name}</h3>
                  <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    {match.matchScore}%
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-2">{match.user.email}</p>

                <div className="text-xs text-gray-600 space-y-1 mb-3">
                  <p>Skill match: {match.explanation?.skillScore || 0}%</p>
                  <p>Role fit: {match.explanation?.roleScore || 0}%</p>
                  <p>Availability: {match.explanation?.availabilityScore || 0}%</p>
                </div>

                {match.user.rolePreference && (
                  <p className="text-xs text-indigo-600 mb-2 capitalize">
                    Preferred role: {match.user.rolePreference}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(match.user.topSkills || []).slice(0, 5).map((skill) => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleInvite(match.user._id)}
                  disabled={inviting[match.user._id]}
                  className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {inviting[match.user._id] ? 'Sending...' : 'Invite to Project'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
