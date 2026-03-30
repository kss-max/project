import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyInvitations, respondToInvitation } from '../../Services/invitationService'
import Navbar from '../../Components/layout/Navbar'

export default function Invitations() {
    const { user } = useAuth()
    const [invitations, setInvitations] = useState([])
    const [loading, setLoading] = useState(true)
    const [responding, setResponding] = useState({}) // { invId: true }

    // Fetch invitations on mount
    useEffect(() => {
        getMyInvitations()
            .then((res) => setInvitations(res.invitations || []))
            .catch((err) => console.error('Failed to load invitations', err))
            .finally(() => setLoading(false))
    }, [])

    // Handle accept or reject
    async function handleRespond(invId, action) {
        setResponding(prev => ({ ...prev, [invId]: true }))
        try {
            await respondToInvitation(invId, action)
            // Update the local state so the UI reflects the change
            setInvitations(prev =>
                prev.map(inv =>
                    inv._id === invId ? { ...inv, status: action } : inv
                )
            )
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to respond')
        } finally {
            setResponding(prev => ({ ...prev, [invId]: false }))
        }
    }

    // Split invitations into pending and responded
    const pending = invitations.filter(inv => inv.status === 'pending')
    const responded = invitations.filter(inv => inv.status !== 'pending')

    return (
        <div className="min-h-screen bg-[#0f0f13] text-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">Inbox</h2>
                <p className="mt-1 text-gray-400 text-sm">
                    Project invitations and applications to join your projects.
                </p>

                {loading ? (
                    <p className="text-gray-500 text-sm mt-10 text-center animate-pulse">
                        Loading invitations...
                    </p>
                ) : invitations.length === 0 ? (
                    <div className="mt-16 text-center bg-[#1e1e2a] border border-white/5 p-12 rounded-2xl shadow-xl">
                        <p className="text-5xl mb-4 opacity-50">📭</p>
                        <p className="text-gray-400 font-medium">No messages yet.</p>
                        <p className="text-gray-500 text-sm mt-2">
                            When someone invites you, or applies to your project, it will show up here.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Pending Invitations ── */}
                        {pending.length > 0 && (
                            <section className="mt-10">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-white/5 pb-2">
                                    Pending ({pending.length})
                                </h3>
                                <div className="space-y-4">
                                    {pending.map(inv => (
                                        <InvitationCard
                                            key={inv._id}
                                            inv={inv}
                                            responding={responding[inv._id]}
                                            onRespond={handleRespond}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Responded Invitations ── */}
                        {responded.length > 0 && (
                            <section className="mt-12">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b border-white/5 pb-2">
                                    History
                                </h3>
                                <div className="space-y-4">
                                    {responded.map(inv => (
                                        <InvitationCard
                                            key={inv._id}
                                            inv={inv}
                                            responding={false}
                                            onRespond={handleRespond}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

// ─── Individual Invitation Card ────────────────────────────
function InvitationCard({ inv, responding, onRespond }) {
    const project = inv.projectId
    const sender = inv.sender

    return (
        <div className="bg-[#1e1e2a] rounded-2xl border border-white/5 p-6 shadow-lg hover:border-violet-500/20 transition-colors">
            {/* Top row: project info + status */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-sm border ${inv.type === 'application' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                            {inv.type === 'application' ? 'Application' : 'Invitation'}
                        </span>
                    </div>
                    <h4 className="text-xl font-bold text-white tracking-tight">
                        {project?.title || 'Untitled Project'}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {project?.description || 'No description'}
                    </p>
                </div>
                <StatusBadge status={inv.status} />
            </div>

            {/* Tech stack chips */}
            {project?.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {project.techStack.map(tech => (
                        <span
                            key={tech}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-6 mt-5 text-xs text-gray-500">
                {inv.type === 'application' ? (
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-[8px]">{sender?.name?.[0].toUpperCase() || '?'}</div>
                        Applicant: <span className="font-semibold text-gray-200">{sender?.name || 'Unknown'}</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[8px]">{sender?.name?.[0].toUpperCase() || '?'}</div>
                        Invited by <span className="font-semibold text-gray-200">{sender?.name || 'Unknown'}</span>
                    </span>
                )}
                <span className="flex items-center">Role: <span className="font-semibold text-white ml-2 bg-white/10 px-2 py-0.5 rounded">{inv.role || 'Member'}</span></span>
                <span className="flex items-center">{new Date(inv.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Application Message */}
            {inv.type === 'application' && inv.message && (
                <div className="mt-4 bg-black/40 p-4 rounded-xl border border-white/5 text-sm text-gray-300 italic shadow-inner">
                    "{inv.message}"
                </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/5">
                {inv.status === 'pending' ? (
                    <>
                        <button
                            onClick={() => onRespond(inv._id, 'accepted')}
                            disabled={responding}
                            className="px-6 py-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-600/40 transition disabled:opacity-50 cursor-pointer"
                        >
                            {responding ? '...' : '✓ Accept'}
                        </button>
                        <button
                            onClick={() => onRespond(inv._id, 'rejected')}
                            disabled={responding}
                            className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm font-bold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50 cursor-pointer"
                        >
                            {responding ? '...' : '✗ Reject'}
                        </button>
                    </>
                ) : inv.status === 'accepted' ? (
                    <Link
                        to={`/workspace/${project?._id}/hub`}
                        className="px-6 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition shadow-lg shadow-violet-900/30"
                    >
                        Enter Workspace →
                    </Link>
                ) : (
                    <div className="px-5 py-2 rounded-lg bg-black/40 border border-white/5 text-gray-500 text-sm font-medium">
                        Invitation declined
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }) {
    const styles = {
        pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        accepted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-500 border border-red-500/20',
    }
    return (
        <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full tracking-wider ${styles[status] || styles.pending}`}>
            {status}
        </span>
    )
}
