import { useEffect, useState } from 'react'
import { getTasks, createTask, updateTask, deleteTask, generateAITasks } from '../../Services/taskService'
import { useAuth } from '../../context/AuthContext'
import TaskDetailModal from './TaskDetailModal'

const COLUMNS = [
    { id: 'todo',        label: 'To Do',       color: 'violet',  icon: '📋' },
    { id: 'in_progress', label: 'In Progress', color: 'yellow',  icon: '⏳' },
    { id: 'review',      label: 'Review',      color: 'blue',    icon: '🔍' },
    { id: 'done',        label: 'Done',        color: 'emerald', icon: '✅' },
]

const COL_STYLES = {
    violet:  { header: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',  border: 'border-violet-500/20' },
    yellow:  { header: 'text-yellow-400',  badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',  border: 'border-yellow-500/20' },
    blue:    { header: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',        border: 'border-blue-500/20' },
    emerald: { header: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'border-emerald-500/20' },
}

const PRIORITY_CONFIG = {
    high:   { label: 'High',   dot: 'bg-red-400',    badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
    medium: { label: 'Medium', dot: 'bg-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    low:    { label: 'Low',    dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
}

export default function TaskBoard({ projectId, teamMembers }) {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [aiLoading, setAiLoading] = useState(false)
    const [showAdd, setShowAdd] = useState(false)
    const [myTasksOnly, setMyTasksOnly] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)

    // Add task form state
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [newPriority, setNewPriority] = useState('medium')
    const [newAssignee, setNewAssignee] = useState('')
    const [newDueDate, setNewDueDate] = useState('')

    async function fetchTasks() {
        try {
            const res = await getTasks(projectId)
            setTasks(res.tasks || [])
        } catch (err) {
            console.error('Failed to load tasks', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchTasks() }, [projectId])

    // AI Breakdown
    async function handleAIBreakdown() {
        setAiLoading(true)
        try {
            const res = await generateAITasks(projectId)
            setTasks(prev => [...(res.tasks || []), ...prev])
        } catch (err) {
            alert('AI generation failed. Please try again.')
        } finally {
            setAiLoading(false)
        }
    }

    // Create task
    async function handleAddTask(e) {
        e.preventDefault()
        if (!newTitle.trim()) return
        try {
            const payload = {
                projectId,
                title: newTitle,
                description: newDesc,
                priority: newPriority,
            }
            if (newAssignee) payload.assignee = newAssignee
            if (newDueDate) payload.dueDate = newDueDate
            const res = await createTask(payload)
            setTasks(prev => [res.task, ...prev])
            setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewAssignee(''); setNewDueDate('')
            setShowAdd(false)
        } catch (err) {
            alert('Failed to create task')
        }
    }

    // Move task
    async function handleMove(taskId, newStatus) {
        try {
            await updateTask(taskId, { status: newStatus })
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t))
        } catch (err) {
            alert('Failed to move task')
        }
    }

    // Delete task
    async function handleDelete(taskId) {
        try {
            await deleteTask(taskId)
            setTasks(prev => prev.filter(t => t._id !== taskId))
        } catch (err) {
            alert('Failed to delete task')
        }
    }

    // Assign task
    async function handleAssign(taskId, assigneeId) {
        try {
            await updateTask(taskId, { assignee: assigneeId || null })
            setTasks(prev => prev.map(t => {
                if (t._id !== taskId) return t
                const member = teamMembers?.find(m => (m.user?._id || m.user) === assigneeId)
                return { ...t, assignee: assigneeId ? { _id: assigneeId, name: member?.user?.name || 'Assigned' } : null }
            }))
        } catch (err) {
            alert('Failed to assign task')
        }
    }

    // Filter tasks
    const filteredTasks = myTasksOnly
        ? tasks.filter(t => {
            const assigneeId = t.assignee?._id || t.assignee
            return assigneeId === user?._id
        })
        : tasks

    if (loading) {
        return <div className="flex-1 flex items-center justify-center"><p className="text-gray-500 animate-pulse">Loading tasks...</p></div>
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white">📋 Task Board</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your project milestones and tasks</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* My Tasks filter */}
                    <button
                        onClick={() => setMyTasksOnly(!myTasksOnly)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            myTasksOnly
                                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                        }`}
                    >
                        👤 My Tasks
                    </button>
                    <button
                        onClick={handleAIBreakdown}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition shadow-lg shadow-violet-900/30 disabled:opacity-50"
                    >
                        {aiLoading ? (
                            <><span className="animate-spin">⏳</span> Analyzing...</>
                        ) : (
                            <>✨ AI Breakdown</>
                        )}
                    </button>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition"
                    >
                        + Add Task
                    </button>
                </div>
            </div>

            {/* Add Task Form */}
            {showAdd && (
                <form onSubmit={handleAddTask} className="mb-5 p-4 rounded-xl border border-white/10" style={{ backgroundColor: '#1e1e2a' }}>
                    {/* Row 1: Title + Description */}
                    <div className="flex gap-3 mb-3">
                        <input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="Task title..."
                            required
                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                        />
                        <input
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            placeholder="Description (optional)"
                            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                    {/* Row 2: Priority + Assignee + Due Date + Buttons */}
                    <div className="flex gap-3 items-center">
                        <select
                            value={newPriority}
                            onChange={e => setNewPriority(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none"
                        >
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🔴 High</option>
                        </select>
                        <select
                            value={newAssignee}
                            onChange={e => setNewAssignee(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none"
                        >
                            <option value="">Unassigned</option>
                            {teamMembers?.map(m => (
                                <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                                    {m.user?.name || 'Team Member'}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={newDueDate}
                            onChange={e => setNewDueDate(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50"
                        />
                        <button type="submit" className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">Create</button>
                        <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg text-gray-400 hover:text-white text-sm transition">✕</button>
                    </div>
                </form>
            )}

            {/* Kanban Columns */}
            <div className="grid grid-cols-4 gap-4" style={{ minHeight: '60vh' }}>
                {COLUMNS.map(col => {
                    const style = COL_STYLES[col.color]
                    const colTasks = filteredTasks.filter(t => t.status === col.id)
                    return (
                        <div key={col.id} className={`rounded-xl border ${style.border} p-3`} style={{ backgroundColor: '#16161e' }}>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <span>{col.icon}</span>
                                    <h3 className={`text-sm font-semibold ${style.header}`}>{col.label}</h3>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>{colTasks.length}</span>
                            </div>
                            <div className="space-y-2.5">
                                {colTasks.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        currentCol={col.id}
                                        teamMembers={teamMembers}
                                        onMove={handleMove}
                                        onDelete={handleDelete}
                                        onAssign={handleAssign}
                                        onCardClick={setSelectedTask}
                                    />
                                ))}
                                {colTasks.length === 0 && (
                                    <p className="text-xs text-gray-600 text-center py-8 italic">No tasks</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Task Detail Modal (with real-time comments) */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onCommentAdded={(taskId, comment) => {
                        setTasks(prev => prev.map(t => {
                            if (t._id === taskId) {
                                // Add comment to local state so it's there if they close and reopen
                                return { ...t, comments: [...(t.comments || []), comment] }
                            }
                            return t
                        }))
                    }}
                />
            )}
        </div>
    )
}

// ─── Task Card ───────────────────────────────────────────
function TaskCard({ task, currentCol, teamMembers, onMove, onDelete, onAssign, onCardClick }) {
    const [showAssign, setShowAssign] = useState(false)
    const colOrder = ['todo', 'in_progress', 'review', 'done']
    const idx = colOrder.indexOf(currentCol)
    const canLeft = idx > 0
    const canRight = idx < colOrder.length - 1
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

    // Format due date
    const dueLabel = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

    return (
        <div 
            onClick={() => onCardClick && onCardClick(task)}
            className="rounded-lg p-3 border border-white/5 hover:border-white/10 transition group cursor-pointer" 
            style={{ backgroundColor: '#1e1e2a' }}
        >
            {/* Top row: priority + due date */}
            <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priority.badge}`}>
                    {priority.label}
                </span>
                {dueLabel && (
                    <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                        📅 {dueLabel}
                    </span>
                )}
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-white mb-1 leading-snug">{task.title}</p>
            {task.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
            )}

            {/* Assignee */}
            <div className="relative mb-2">
                <button
                    onClick={(e) => { e.stopPropagation(); setShowAssign(!showAssign); }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/30 text-xs text-violet-300 hover:bg-violet-600/25 hover:text-white transition w-full"
                >
                    {task.assignee ? (
                        <>
                            <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {(task.assignee.name || 'U')[0].toUpperCase()}
                            </span>
                            <span className="font-medium">{task.assignee.name || 'Assigned'}</span>
                        </>
                    ) : (
                        <>
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-500 text-sm shrink-0">+</span>
                            <span className="text-gray-500">Assign member</span>
                        </>
                    )}
                </button>

                {/* Assignee dropdown */}
                {showAssign && (
                    <div className="absolute top-7 left-0 z-10 w-44 rounded-lg border border-white/10 py-1 shadow-xl" style={{ backgroundColor: '#16161e' }}>
                        <button
                            onClick={() => { onAssign(task._id, ''); setShowAssign(false) }}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition"
                        >
                            Unassigned
                        </button>
                        {teamMembers?.map(m => {
                            const memberId = m.user?._id || m.user
                            const memberName = m.user?.name || 'Team Member'
                            return (
                                <button
                                    key={memberId}
                                    onClick={() => { onAssign(task._id, memberId); setShowAssign(false) }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition flex items-center gap-2"
                                >
                                    <span className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                        {memberName[0].toUpperCase()}
                                    </span>
                                    {memberName}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Action buttons (hidden until hover) */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {canLeft && (
                        <button onClick={() => onMove(task._id, colOrder[idx - 1])} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-7 h-7 rounded flex items-center justify-center transition" title="Move Left">
                            ←
                        </button>
                    )}
                    {canRight && (
                        <button onClick={() => onMove(task._id, colOrder[idx + 1])} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-7 h-7 rounded flex items-center justify-center transition" title="Move Right">
                            →
                        </button>
                    )}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} 
                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 w-7 h-7 rounded flex items-center justify-center transition" 
                    title="Delete Task"
                >
                    🗑
                </button>
            </div>
        </div>
    )
}
