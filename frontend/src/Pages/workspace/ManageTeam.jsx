import { useState, useEffect } from 'react'
import { getProjectMatches } from '../../Services/matchingService'
import { sendInvitation, getProjectInvitations } from '../../Services/invitationService'

// ─── Role options (fixed fallback + project-specific) ────
const FALLBACK_ROLES = ['Member', 'Frontend Lead', 'Backend Lead', 'ML Engineer', 'Project Manager', 'Designer']

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ status }) {
    const colors = {
        pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        accepted: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
    }
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] || colors.pending}`}>
            {status}
        </span>
    )
}

// ─── Table header cell ────────────────────────────────────
function TH({ children }) {
    return (
        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
            {children}
        </th>
    )
}

// ─── Main Component ───────────────────────────────────────
export default function ManageTeam({ project, user, projectId }) {
    const p = project

    // Role list: use project's requiredRoles if available, else fallback
    const ROLES = p.requiredRoles?.length > 0
        ? ['Member', ...p.requiredRoles]
        : FALLBACK_ROLES

    // ── State ──
    const [matches, setMatches] = useState([])
    const [invitations, setInvitations] = useState([])
    const [loadingMatch, setLoadingMatch] = useState(true)
    const [assignRoles, setAssignRoles] = useState({})  // { userId: role }
    const [inviting, setInviting] = useState({})  // { userId: bool }
    const [invited, setInvited] = useState({})  // { userId: true }

    // ── Load matches + invitations on mount ──
    useEffect(() => {
        async function load() {
            try {
                const [matchRes, invRes] = await Promise.all([
                    getProjectMatches(projectId, { teamSize: 10 }),
                    getProjectInvitations(projectId),
                ])
                setMatches(matchRes.matches || [])
                setInvitations(invRes.invitations || [])

                // Pre-mark already-invited users so button shows ✓
                const alreadyInvited = {}
                for (const inv of (invRes.invitations || [])) {
                    if (inv.status === 'pending') alreadyInvited[inv.receiver._id] = true
                }
                setInvited(alreadyInvited)
            } catch (err) {
                console.error('ManageTeam load error', err)
            } finally {
                setLoadingMatch(false)
            }
        }
        load()
    }, [projectId])

    // ── Send invite ──
    async function handleInvite(receiverId) {
        const role = assignRoles[receiverId] || 'Member'
        setInviting(prev => ({ ...prev, [receiverId]: true }))
        try {
            await sendInvitation({ projectId, receiverId, role })
            setInvited(prev => ({ ...prev, [receiverId]: true }))
            const invRes = await getProjectInvitations(projectId)
            setInvitations(invRes.invitations || [])
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send invite')
        } finally {
            setInviting(prev => ({ ...prev, [receiverId]: false }))
        }
    }

    return (
        <div className="p-8 max-w-5xl">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Team</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage existing members and invite new teammates</p>
                </div>
            </div>

            {/* ─────────────────────────────────────────── */}
            {/* Section 1 — Current Team                   */}
            {/* ─────────────────────────────────────────── */}
            <div style={{ backgroundColor: '#1e1e2a' }} className="rounded-2xl border border-white/5 mb-6 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5">
                    <h2 className="text-base font-semibold text-white">Current Team</h2>
                    <p className="text-gray-500 text-xs mt-1">Manage existing project members and roles.</p>
                </div>

                <table className="w-full">
                    <thead style={{ backgroundColor: '#16161e' }}>
                        <tr>
                            <TH>Teammate</TH>
                            <TH>Role</TH>
                            <TH>Joined</TH>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {/* Owner row (always the current user) */}
                        <tr>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {(user?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{user?.name}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className="text-xs border border-violet-500/40 text-violet-300 px-3 py-1 rounded-full">Owner</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                                {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                        </tr>

                        {/* Other team members */}
                        {(p.teamMembers || []).filter(m => m.user?._id !== user?._id).map((m, i) => (
                            <tr key={i}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {(m.user?.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{m.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{m.user?.email || ''}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs border border-white/10 text-gray-400 px-3 py-1 rounded-full">{m.role || 'Member'}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─────────────────────────────────────────── */}
            {/* Section 2 — Discover Teammates             */}
            {/* ─────────────────────────────────────────── */}
            <div style={{ backgroundColor: '#1e1e2a' }} className="rounded-2xl border border-white/5 mb-6 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5">
                    <h2 className="text-base font-semibold text-white">Discover Teammates</h2>
                    <p className="text-gray-500 text-xs mt-1">Find users whose skills match your project's tech stack.</p>
                </div>

                {loadingMatch ? (
                    <p className="text-center text-gray-500 text-sm py-10 animate-pulse">Finding best matches...</p>
                ) : matches.length === 0 ? (
                    <p className="text-center text-gray-600 text-sm py-10">No candidates found.</p>
                ) : (
                    <table className="w-full">
                        <thead style={{ backgroundColor: '#16161e' }}>
                            <tr>
                                <TH>Candidate</TH>
                                <TH>Match %</TH>
                                <TH>Assign Role</TH>
                                <TH>Actions</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {matches.map((m) => (
                                <tr key={m.user._id}>
                                    {/* Candidate info */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {(m.user.name || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{m.user.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{m.user.rolePreference || 'Student'}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Match score badge */}
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.matchScore >= 60 ? 'bg-emerald-500/20 text-emerald-400' :
                                                m.matchScore >= 30 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-gray-700 text-gray-400'
                                            }`}>
                                            {m.matchScore}% Match
                                        </span>
                                    </td>

                                    {/* Role dropdown — uses project roles or fallback */}
                                    <td className="px-4 py-3">
                                        <select
                                            value={assignRoles[m.user._id] || 'Member'}
                                            onChange={(e) => setAssignRoles(prev => ({ ...prev, [m.user._id]: e.target.value }))}
                                            disabled={invited[m.user._id]}
                                            className="bg-black/40 border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
                                        >
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>

                                    {/* Invite button */}
                                    <td className="px-4 py-3">
                                        {invited[m.user._id] ? (
                                            <span className="text-xs text-emerald-400 font-medium">✓ Sent</span>
                                        ) : (
                                            <button
                                                onClick={() => handleInvite(m.user._id)}
                                                disabled={inviting[m.user._id]}
                                                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                                            >
                                                {inviting[m.user._id] ? '...' : 'Invite'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ─────────────────────────────────────────── */}
            {/* Section 3 — Invitations tracker            */}
            {/* ─────────────────────────────────────────── */}
            <div style={{ backgroundColor: '#1e1e2a' }} className="rounded-2xl border border-white/5 mb-6 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5">
                    <h2 className="text-base font-semibold text-white">Invitations</h2>
                    <p className="text-gray-500 text-xs mt-1">Track pending and accepted invite status.</p>
                </div>

                {invitations.length === 0 ? (
                    <p className="text-center text-gray-600 text-sm py-8">No invitations sent yet.</p>
                ) : (
                    <table className="w-full">
                        <thead style={{ backgroundColor: '#16161e' }}>
                            <tr>
                                <TH>Candidate</TH>
                                <TH>Role</TH>
                                <TH>Status</TH>
                                <TH>Sent</TH>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {invitations.map((inv) => (
                                <tr key={inv._id}>
                                    <td className="px-4 py-3 text-sm font-medium text-white">
                                        {inv.receiver?.name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400">
                                        {inv.role || 'Member'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={inv.status} />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ─────────────────────────────────────────── */}
            {/* Section 4 — Lead Access Permissions        */}
            {/* ─────────────────────────────────────────── */}
            <div className="flex gap-3 p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5">
                <span className="text-violet-400 text-lg shrink-0">🛡️</span>
                <div>
                    <p className="text-sm font-semibold text-violet-300 mb-1">Lead Access Permissions</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Only users with Lead Access (Project Manager, Frontend Lead, Backend Lead, ML Engineer) can approve
                        tasks from "In Review" to "Done", merge features, and update project integrations.
                        Standard members can create tasks and update status up to "In Review".
                    </p>
                </div>
            </div>

        </div>
    )
}
