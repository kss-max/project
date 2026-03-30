import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getProjectById } from '../../Services/projectService'
import { getTasks } from '../../Services/taskService'
import { useAuth } from '../../context/AuthContext'
import ManageTeam from './ManageTeam'
import TaskBoard from './TaskBoard'
import GitSync from './GitSync'
import ActivityFeed from './ActivityFeed'
import Resources from './Resources'

// ─── Sidebar nav items ───────────────────────────────────
const NAV_ITEMS = [
    { id: 'hub', label: 'Team Hub', icon: '🏠' },
    { id: 'tasks', label: 'Task Board', icon: '📋' },
    { id: 'git', label: 'Git Sync', icon: '🔗' },
    { id: 'activity', label: 'Activity Feed', icon: '⚡' },
    { id: 'resources', label: 'Resources', icon: '📚' },
    { id: 'team', label: 'Manage Team', icon: '⚙️' },
]

// ─── Tech stack chip colors ──────────────────────────────
const CHIP_COLORS = [
    'bg-violet-900/50 text-violet-300 border border-violet-700/50',
    'bg-blue-900/50   text-blue-300   border border-blue-700/50',
    'bg-cyan-900/50   text-cyan-300   border border-cyan-700/50',
    'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    'bg-rose-900/50   text-rose-300   border border-rose-700/50',
]

function getChipColor(index) {
    return CHIP_COLORS[index % CHIP_COLORS.length]
}

// ─── Main Component ──────────────────────────────────────
export default function WorkspaceHub() {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('hub')

    // Fetch project data when projectId changes
    useEffect(() => {
        setLoading(true)
        getProjectById(projectId)
            .then((res) => setProject(res.project))
            .catch((err) => console.error('Failed to load project', err))
            .finally(() => setLoading(false))
    }, [projectId])

    // ── Sidebar ──────────────────────────────────────────
    function Sidebar() {
        return (
            <aside
                style={{ backgroundColor: '#16161e' }}
                className="w-64 min-h-screen flex flex-col border-r border-white/5 shrink-0"
            >
                {/* Back to projects */}
                <div className="px-5 pt-6 pb-4">
                    <Link
                        to="/projects"
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition font-medium tracking-widest uppercase"
                    >
                        ← Projects
                    </Link>
                </div>

                {/* Project name */}
                <div className="px-5 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {(project?.title || 'P')[0].toUpperCase()}
                        </div>
                        <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
                            {project?.title || 'Loading...'}
                        </p>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer text-left ${activeTab === item.id
                                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Comm Link button */}
                <div className="px-4 pb-6">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition shadow-lg shadow-violet-900/30 cursor-pointer">
                        💬 Open Comm Link
                    </button>
                </div>
            </aside>
        )
    }

    // ── Main content dispatcher ──────────────────────────
    function MainContent() {
        if (loading) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500 animate-pulse">Loading workspace...</p>
                </div>
            )
        }

        if (!project) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-red-400">Project not found.</p>
                </div>
            )
        }

        if (activeTab === 'hub') return <TeamHubView project={project} user={user} navigate={navigate} projectId={projectId} />
        if (activeTab === 'tasks') return <TaskBoard projectId={projectId} teamMembers={project.teamMembers} />
        if (activeTab === 'git') return <GitSync projectId={projectId} githubRepo={project.githubRepo} />
        if (activeTab === 'activity') return <ActivityFeed projectId={projectId} />
        if (activeTab === 'resources') return <Resources projectId={projectId} initialResources={project.resources} />
        if (activeTab === 'team') return <ManageTeam project={project} user={user} projectId={projectId} />
        return <ComingSoon label={NAV_ITEMS.find(n => n.id === activeTab)?.label} />
    }

    return (
        <div
            style={{ backgroundColor: '#0f0f13' }}
            className="flex min-h-screen text-white"
        >
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <MainContent />
            </main>
        </div>
    )
}

// ─── Team Hub View ────────────────────────────────────────
function TeamHubView({ project, user, navigate, projectId }) {
    const p = project
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        getTasks(projectId)
            .then(res => setTasks(res.tasks || []))
            .catch(err => console.error('Failed to load tasks for progress', err))
    }, [projectId])

    const totalTasks = tasks.length
    const doneTasks = tasks.filter(t => t.status === 'done').length
    const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

    const counts = {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
    }

    // Status badge color
    const statusColor =
        p.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            p.status === 'in-progress' ? 'bg-yellow-500/20  text-yellow-400  border border-yellow-500/30' :
                'bg-blue-500/20    text-blue-400    border border-blue-500/30'

    return (
        <div className="p-8 max-w-6xl">

            {/* ── Page header ── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Hub</h1>
                    <p className="text-gray-500 text-sm mt-1">Your project command center</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide ${statusColor}`}>
                    {p.status || 'open'}
                </span>
            </div>

            {/* ── Top row: Overview + Team Members ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Project Overview */}
                <div
                    style={{ backgroundColor: '#1e1e2a' }}
                    className="lg:col-span-2 rounded-2xl p-6 border border-white/5"
                >
                    <h2 className="text-base font-semibold text-violet-400 mb-3">Project Overview</h2>
                    <p className="text-gray-300 text-sm leading-relaxed mb-5">
                        {p.description}
                    </p>

                    {/* Tech stack */}
                    {p.techStack?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {p.techStack.map((tech, i) => (
                                <span
                                    key={tech}
                                    className={`text-xs px-3 py-1 rounded-full font-medium ${getChipColor(i)}`}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Meta info */}
                    <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500">
                        {p.difficulty && (
                            <span>Difficulty: <span className="text-gray-300 font-medium">{p.difficulty}</span></span>
                        )}
                        {p.estimatedDuration && (
                            <span>Duration: <span className="text-gray-300 font-medium">{p.estimatedDuration}</span></span>
                        )}
                        {p.category && (
                            <span>Category: <span className="text-gray-300 font-medium">{p.category}</span></span>
                        )}
                    </div>
                </div>

                {/* Team Members */}
                <div
                    style={{ backgroundColor: '#1e1e2a' }}
                    className="rounded-2xl p-6 border border-white/5"
                >
                    <h2 className="text-base font-semibold text-white mb-4">Team Members</h2>

                    {p.teamMembers?.length > 0 ? (
                        <div className="space-y-3">
                            {p.teamMembers.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {(m.user?.name || user?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white leading-tight">
                                            {m.user?.name || user?.name || 'You'}
                                        </p>
                                        <p className="text-xs text-gray-500">{m.role || 'Member'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Show current user as owner if no team yet
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">
                                {(user?.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white leading-tight">{user?.name || 'You'}</p>
                                <p className="text-xs text-gray-500">Owner</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Project Progress ── */}
            <div
                style={{ backgroundColor: '#1e1e2a' }}
                className="rounded-2xl p-6 border border-white/5 mb-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white">Project Progress</h2>
                    <span className="text-sm text-gray-400">{doneTasks} / {totalTasks} Tasks Completed</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/5 rounded-full h-2.5 mb-6 overflow-hidden">
                    <div
                        className="bg-violet-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                        <p className="text-lg font-bold text-gray-300">{counts.todo}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">To Do</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                        <p className="text-lg font-bold text-yellow-400">{counts.in_progress}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">In Progress</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                        <p className="text-lg font-bold text-blue-400">{counts.review}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Review</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                        <p className="text-lg font-bold text-emerald-400">{doneTasks}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Done</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Coming Soon placeholder ──────────────────────────────
function ComingSoon({ label }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-3xl mb-5">
                🚧
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{label}</h2>
            <p className="text-gray-500 text-sm max-w-sm">
                This section is coming soon. We're building it step by step!
            </p>
        </div>
    )
}

