import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { addComment } from '../../Services/taskService'

// Base API URL for socket connection
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export default function TaskDetailModal({ task, onClose, onCommentAdded }) {
    const [comments, setComments] = useState(task.comments || [])
    const [newText, setNewText] = useState('')
    const [posting, setPosting] = useState(false)
    const messagesEndRef = useRef(null)
    const socketRef = useRef(null)

    // Scroll to bottom when new comments arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        scrollToBottom()
    }, [comments])

    // Setup Socket.io listening
    useEffect(() => {
        // Connect to socket.io
        const socket = io(SOCKET_URL, {
            withCredentials: true
        })
        socketRef.current = socket

        // Join the specific task room
        socket.emit('join_task', task._id)

        // Listen for new comments
        socket.on('new_comment', (data) => {
            if (data.taskId === task._id) {
                // If the comment doesn't already exist in state, add it
                setComments(prev => {
                    if (prev.find(c => c._id === data.comment._id)) return prev;
                    return [...prev, data.comment]
                })
                // Optionally let parent know so the board task object stays in sync
                if (onCommentAdded) onCommentAdded(task._id, data.comment)
            }
        })

        return () => {
            socket.emit('leave_task', task._id)
            socket.disconnect()
        }
    }, [task._id, onCommentAdded])

    async function handlePost(e) {
        e.preventDefault()
        if (!newText.trim()) return

        setPosting(true)
        try {
            await addComment(task._id, newText)
            setNewText('')
            // We don't need to manually update `comments` state here because 
            // the server will instantly broadcast `new_comment` back to us via socket!
        } catch (err) {
            console.error('Failed to post comment', err)
            alert('Failed to post comment')
        } finally {
            setPosting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                className="relative flex flex-col md:flex-row w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                style={{ backgroundColor: '#13131a' }}
            >
                {/* ── Left Side: Task Full Details ── */}
                <div className="md:w-[45%] p-6 lg:p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col bg-[#0f0f13]">
                    <div className="mb-4 flex flex-wrap gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border
                            ${task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    'bg-green-500/10 text-green-400 border-green-500/20'}
                        `}>
                            {task.priority || 'Medium'} Priority
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border bg-white/5 text-gray-400 border-white/10">
                            Status: {task.status.replace('_', ' ')}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 leading-snug">{task.title}</h2>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Description</h3>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-8">
                            {task.description || <span className="italic text-gray-600">No description provided.</span>}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Assignee</h3>
                                <div className="flex items-center gap-2">
                                    {task.assignee ? (
                                        <>
                                            <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                {(task.assignee.name || 'U')[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm text-gray-300 font-medium">{task.assignee.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500 italic">Unassigned</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Due Date</h3>
                                <p className="text-sm text-gray-300">
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="italic text-gray-600">None</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Side: Real-time Comments Thread ── */}
                <div className="md:w-[55%] flex flex-col h-full bg-[#1e1e2a]/50">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            💬 Group Discussion
                            <span className="bg-violet-600/20 text-violet-400 text-xs px-2 py-0.5 rounded-full border border-violet-500/30">Live</span>
                        </h3>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {comments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <span className="text-4xl mb-3">💭</span>
                                <p className="text-sm">No comments yet.</p>
                                <p className="text-xs mt-1 text-gray-600">Start the conversation below!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment._id} className="flex gap-3 animate-fade-in-up">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-purple-900/20 mt-1">
                                        {(comment.user?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-200">{comment.user?.name || 'Unknown User'}</span>
                                            <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-gray-300 leading-relaxed shadow-sm">
                                            {comment.text}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-[#181824] border-t border-white/5 mt-auto">
                        <form onSubmit={handlePost} className="relative">
                            <input
                                value={newText}
                                onChange={e => setNewText(e.target.value)}
                                placeholder="Type a comment..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={posting || !newText.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-px">
                                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Close Button X (Top Right corner) */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-gray-400 hover:text-white hover:bg-white/10 transition z-10"
                >
                    ✕
                </button>
            </div>
            {/* Some CSS for animation */}
            <style>{`
                .animate-fade-in-up {
                    animation: fadeInUp 0.3s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
