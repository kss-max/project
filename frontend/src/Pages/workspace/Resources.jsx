import { useState } from 'react'
import { addResource, deleteResource } from '../../Services/resourceService'

const TYPE_ICONS = {
    Documentation: '📄',
    Design: '🎨',
    Research: '🔬',
    Tutorial: '📚',
    API: '⚙️',
    Other: '🔗',
}

const TYPE_COLORS = {
    Documentation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Design: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    Research: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Tutorial: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    API: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    Other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

export default function Resources({ projectId, initialResources }) {
    const [resources, setResources] = useState(initialResources || [])
    const [showAdd, setShowAdd] = useState(false)
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [type, setType] = useState('Other')
    const [saving, setSaving] = useState(false)

    async function handleAdd(e) {
        e.preventDefault()
        if (!title.trim() || !url.trim()) return
        setSaving(true)
        try {
            const res = await addResource(projectId, { title, url, type })
            setResources(res.resources || [])
            setTitle(''); setUrl(''); setType('Other')
            setShowAdd(false)
        } catch (err) {
            alert('Failed to add resource')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(resourceId) {
        try {
            const res = await deleteResource(projectId, resourceId)
            setResources(res.resources || [])
        } catch (err) {
            alert('Failed to delete resource')
        }
    }

    return (
        <div className="p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">📚 Resources</h1>
                    <p className="text-gray-500 text-sm mt-1">Shared links, docs, and references for your team</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition shadow-lg shadow-violet-900/30"
                >
                    + Add Resource
                </button>
            </div>

            {/* Add form */}
            {showAdd && (
                <form onSubmit={handleAdd} className="mb-6 p-4 rounded-xl border border-white/10" style={{ backgroundColor: '#1e1e2a' }}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Resource title"
                            required
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                        />
                        <input
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://..."
                            required
                            type="url"
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                        />
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 appearance-none"
                        >
                            <option>Documentation</option>
                            <option>Design</option>
                            <option>Research</option>
                            <option>Tutorial</option>
                            <option>API</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="flex gap-3 mt-3">
                        <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50">
                            {saving ? 'Adding...' : 'Add'}
                        </button>
                        <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg text-gray-400 hover:text-white text-sm transition">Cancel</button>
                    </div>
                </form>
            )}

            {/* Resource list */}
            {resources.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-500 text-sm">No resources yet. Add docs, links, or references for your team!</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {resources.map(r => {
                        const icon = TYPE_ICONS[r.type] || '🔗'
                        const badgeColor = TYPE_COLORS[r.type] || TYPE_COLORS.Other
                        return (
                            <div key={r._id} className="flex items-center justify-between rounded-xl p-4 border border-white/5 hover:border-white/10 transition group" style={{ backgroundColor: '#1e1e2a' }}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xl">{icon}</span>
                                    <div className="min-w-0">
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-white hover:text-violet-300 transition line-clamp-1"
                                        >
                                            {r.title}
                                        </a>
                                        <p className="text-xs text-gray-600 line-clamp-1">{r.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                                        {r.type}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(r._id)}
                                        className="text-xs px-2 py-1 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                                        title="Delete resource"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
