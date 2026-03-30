import { useEffect, useState, useRef } from 'react'
import { getActivities } from '../../Services/activityService'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const ACTION_CONFIG = {
    task_created:      { icon: '📝', color: 'text-emerald-400' },
    task_moved:        { icon: '➡️', color: 'text-yellow-400' },
    task_deleted:      { icon: '🗑️', color: 'text-red-400' },
    task_assigned:     { icon: '👤', color: 'text-blue-400' },
    member_joined:     { icon: '🤝', color: 'text-violet-400' },
    github_connected:  { icon: '🔗', color: 'text-cyan-400' },
    ai_breakdown:      { icon: '✨', color: 'text-violet-400' },
}

export default function ActivityFeed({ projectId }) {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const socketRef = useRef(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await getActivities(projectId)
                setActivities(res.activities || [])
            } catch (err) {
                console.error('Failed to load activities', err)
            } finally {
                setLoading(false)
            }
        }
        load()

        // Setup Socket.io listening for new activity broadcasts
        const socket = io(SOCKET_URL, {
            withCredentials: true
        })
        socketRef.current = socket

        // Join the general project room
        socket.emit('join_project', projectId)

        // Listen for new activity log
        socket.on('new_activity', (newActivity) => {
            setActivities(prev => [newActivity, ...prev])
        })

        return () => {
            socket.emit('leave_project', projectId)
            socket.disconnect()
        }
    }, [projectId])

    if (loading) {
        return <div className="flex-1 flex items-center justify-center"><p className="text-gray-500 animate-pulse">Loading activity...</p></div>
    }

    return (
        <div className="p-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-white mb-2">⚡ Activity Feed</h1>
            <p className="text-gray-500 text-sm mb-6">Everything that's happened in your workspace</p>

            {activities.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-500 text-sm">No activity yet. Start creating tasks or connect GitHub to see events here!</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10"></div>

                    <div className="space-y-1">
                        {activities.map((a, i) => {
                            const config = ACTION_CONFIG[a.action] || { icon: '📌', color: 'text-gray-400' }
                            const time = formatTime(a.createdAt)
                            const userName = a.user?.name || 'Someone'

                            return (
                                <div key={a._id || i} className="flex items-start gap-4 pl-1 py-3 group">
                                    {/* Icon circle */}
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base shrink-0 z-10 group-hover:border-white/20 transition">
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-200 leading-snug">
                                            <span className={`font-semibold ${config.color}`}>{userName}</span>
                                            {' '}
                                            <span className="text-gray-400">{a.details}</span>
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5">{time}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Time formatter ──────────────────────────────────────
function formatTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
