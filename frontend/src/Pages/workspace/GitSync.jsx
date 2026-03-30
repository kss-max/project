import { useEffect, useState } from 'react'
import { saveGithubRepo, getBranches, getCommits, getPullRequests } from '../../Services/githubIntegrationService'

export default function GitSync({ projectId, githubRepo: initialRepo }) {
    const [repoUrl, setRepoUrl] = useState(initialRepo || '')
    const [connected, setConnected] = useState(!!initialRepo)
    const [saving, setSaving] = useState(false)

    const [activePanel, setActivePanel] = useState('branches')
    const [branches, setBranches] = useState([])
    const [commits, setCommits] = useState([])
    const [pulls, setPulls] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Save repo URL
    async function handleConnect(e) {
        e.preventDefault()
        if (!repoUrl.trim()) return
        setSaving(true)
        setError('')
        try {
            await saveGithubRepo(projectId, repoUrl.trim())
            setConnected(true)
            fetchData('branches')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save repo URL')
        } finally {
            setSaving(false)
        }
    }

    // Disconnect
    function handleDisconnect() {
        setConnected(false)
        setBranches([])
        setCommits([])
        setPulls([])
    }

    // Fetch data based on active panel
    async function fetchData(panel) {
        setLoading(true)
        setError('')
        try {
            if (panel === 'branches') {
                const res = await getBranches(projectId)
                setBranches(res.branches || [])
            } else if (panel === 'commits') {
                const res = await getCommits(projectId)
                setCommits(res.commits || [])
            } else if (panel === 'pulls') {
                const res = await getPullRequests(projectId)
                setPulls(res.pulls || [])
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch GitHub data')
        } finally {
            setLoading(false)
        }
    }

    // Load initial data when connected
    useEffect(() => {
        if (connected) fetchData(activePanel)
    }, [connected])

    // Switch panel
    function switchPanel(panel) {
        setActivePanel(panel)
        if (connected) fetchData(panel)
    }

    // ── Not connected: show connect form ──
    if (!connected) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-2">🔗 Git Sync</h1>
                <p className="text-gray-500 text-sm mb-8">Connect your GitHub repository to track branches, commits, and pull requests.</p>

                <form onSubmit={handleConnect} className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1e1e2a' }}>
                    <label className="block mb-4">
                        <span className="text-sm text-gray-400 font-medium block mb-2">GitHub Repository URL</span>
                        <input
                            value={repoUrl}
                            onChange={e => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repo"
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition"
                        />
                    </label>
                    {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50"
                    >
                        {saving ? 'Connecting...' : '🔗 Connect Repository'}
                    </button>
                </form>
            </div>
        )
    }

    // ── Connected: show dashboard ──
    const PANELS = [
        { id: 'branches', label: '🌿 Branches', count: branches.length },
        { id: 'commits',  label: '📝 Commits',  count: commits.length },
        { id: 'pulls',    label: '🔀 Pull Requests', count: pulls.length },
    ]

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">🔗 Git Sync</h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        Connected to <a href={repoUrl} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">{repoUrl.replace('https://github.com/', '')}</a>
                    </p>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:text-red-400 hover:border-red-500/30 transition"
                >
                    Disconnect
                </button>
            </div>

            {/* Panel Tabs */}
            <div className="flex gap-2 mb-5">
                {PANELS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => switchPanel(p.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activePanel === p.id
                                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white'
                        }`}
                    >
                        {p.label} {p.count > 0 && <span className="ml-1 text-xs opacity-60">({p.count})</span>}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            {/* Loading */}
            {loading ? (
                <p className="text-gray-500 animate-pulse text-center py-16">Fetching from GitHub...</p>
            ) : (
                <>
                    {activePanel === 'branches' && <BranchesPanel branches={branches} />}
                    {activePanel === 'commits' && <CommitsPanel commits={commits} />}
                    {activePanel === 'pulls' && <PullsPanel pulls={pulls} />}
                </>
            )}
        </div>
    )
}

// ─── Branches Panel ──────────────────────────────────────
function BranchesPanel({ branches }) {
    if (branches.length === 0) return <Empty text="No branches found" />
    return (
        <div className="space-y-2">
            {branches.map(b => (
                <div key={b.name} className="flex items-center justify-between rounded-lg p-3 border border-white/5" style={{ backgroundColor: '#1e1e2a' }}>
                    <div className="flex items-center gap-3">
                        <span className="text-emerald-400 text-sm">🌿</span>
                        <span className="text-sm font-medium text-white">{b.name}</span>
                        {b.protected && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">protected</span>}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{b.lastCommitSha?.substring(0, 7)}</span>
                </div>
            ))}
        </div>
    )
}

// ─── Commits Panel ───────────────────────────────────────
function CommitsPanel({ commits }) {
    if (commits.length === 0) return <Empty text="No commits found" />
    return (
        <div className="space-y-2">
            {commits.map(c => (
                <a
                    key={c.sha}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 rounded-lg p-3 border border-white/5 hover:border-white/10 transition group"
                    style={{ backgroundColor: '#1e1e2a' }}
                >
                    {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="w-7 h-7 rounded-full shrink-0" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(c.author || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium leading-snug line-clamp-1 group-hover:text-violet-300 transition">{c.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {c.author} • <span className="font-mono text-gray-600">{c.sha}</span> • {new Date(c.date).toLocaleDateString()}
                        </p>
                    </div>
                </a>
            ))}
        </div>
    )
}

// ─── Pull Requests Panel ─────────────────────────────────
function PullsPanel({ pulls }) {
    if (pulls.length === 0) return <Empty text="No pull requests found" />
    return (
        <div className="space-y-2">
            {pulls.map(pr => {
                const badge = pr.merged
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                    : pr.state === 'open'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                const label = pr.merged ? 'Merged' : pr.state === 'open' ? 'Open' : 'Closed'

                return (
                    <a
                        key={pr.number}
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg p-3 border border-white/5 hover:border-white/10 transition group"
                        style={{ backgroundColor: '#1e1e2a' }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <img src={pr.avatarUrl} alt="" className="w-7 h-7 rounded-full shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-violet-300 transition">
                                    #{pr.number} {pr.title}
                                </p>
                                <p className="text-xs text-gray-500">{pr.author} • {new Date(pr.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${badge}`}>
                            {label}
                        </span>
                    </a>
                )
            })}
        </div>
    )
}

// ─── Empty State ─────────────────────────────────────────
function Empty({ text }) {
    return <p className="text-gray-600 text-sm text-center py-16 italic">{text}</p>
}
