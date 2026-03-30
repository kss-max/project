import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getProfile } from '../../Services/profileService'
import { getRecommendedProjects } from '../../Services/projectService'
import { applyToProject } from '../../Services/invitationService'
import Navbar from '../../Components/layout/Navbar'

export default function Dashboard() {
    const { user } = useAuth()

    // Store the profile and recommendation data
    const [profile, setProfile] = useState(null)
    const [recommendedProjects, setRecommendedProjects] = useState([])
    const [loadingRecs, setLoadingRecs] = useState(true)

    // Application modal state
    const [applyProject, setApplyProject] = useState(null)

    // Fetch profile and recommendations when page loads
    useEffect(() => {
        getProfile()
            .then((res) => setProfile(res.user))
            .catch(() => {})

        getRecommendedProjects()
            .then(res => setRecommendedProjects(res.projects || []))
            .catch(() => {})
            .finally(() => setLoadingRecs(false))
    }, [])

    // Get all skills as a flat array from the profile
    function getAllSkills() {
        if (!profile || !profile.skills) return []
        const all = []
        Object.keys(profile.skills).forEach(category => {
            profile.skills[category].forEach(skill => all.push(skill))
        })
        return all
    }

    const skills = getAllSkills()
    const interests = profile?.interests || []

    return (
        <div className="min-h-screen bg-[#0f0f13]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <h2 className="text-4xl font-bold text-white tracking-tight">Dashboard</h2>
                <p className="mt-1 text-gray-400">Welcome back, {user?.name || 'Student'}.</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <aside className="bg-[#1e1e2a] rounded-2xl border border-white/5 p-6 shadow-xl">
                        <h3 className="text-xl font-semibold text-white">Profile</h3>

                        <div className="mt-6">
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">My Skills</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {skills.length > 0 ? (
                                    skills.map((skill) => (
                                        <span key={skill} className="px-3 py-1 rounded-full text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 italic">No skills added yet</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Interests</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {interests.length > 0 ? (
                                    interests.map((interest) => (
                                        <span key={interest} className="px-3 py-1 rounded-full text-xs border border-white/10 text-gray-300 bg-white/5 font-medium">
                                            {interest}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500 italic">No interests added yet</p>
                                )}
                            </div>
                        </div>

                        <Link
                            to="/profile"
                            className="mt-8 inline-block text-violet-400 font-semibold hover:text-violet-300 transition"
                        >
                            Edit Profile &rarr;
                        </Link>
                    </aside>

                    <section className="lg:col-span-2 space-y-4">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Recommended for You</h3>

                        {loadingRecs ? (
                            <div className="bg-[#1e1e2a] rounded-2xl border border-white/5 p-8 text-center animate-pulse">
                                <p className="text-gray-400">Finding the perfect projects for you...</p>
                            </div>
                        ) : recommendedProjects.length === 0 ? (
                            <div className="bg-[#1e1e2a] rounded-2xl border border-white/5 p-8 text-center">
                                <p className="text-gray-400">No matching projects found right now.</p>
                                <p className="text-sm text-gray-500 mt-2">Try updating your skills in your Profile to get better matches!</p>
                            </div>
                        ) : (
                            recommendedProjects.map((project, index) => (
                                <article key={project._id || index} className="bg-[#1e1e2a] rounded-2xl border border-white/5 p-6 shadow-lg hover:border-violet-500/30 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-white tracking-tight">{project.title}</h4>
                                            <p className="mt-2 text-gray-400 line-clamp-2 leading-relaxed">{project.description}</p>
                                            <p className="mt-3 text-sm text-gray-500 font-medium">
                                                Stack: {project.techStack?.length > 0 ? <span className="text-violet-400">{project.techStack.join(' · ')}</span> : 'Not specified'}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                            {project.matchPercentage || 'New Pick'}
                                        </span>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <Link 
                                            to={`/workspace/${project._id}/hub`}
                                            className="px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition shadow-lg shadow-violet-900/40"
                                        >
                                            View Details
                                        </Link>
                                        <button 
                                            onClick={() => setApplyProject(project)}
                                            className="px-4 py-2.5 rounded-lg border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/5 hover:text-white transition"
                                        >
                                            Request to Join
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </section>
                </div>
            </main>

            {applyProject && (
                <ApplyModal project={applyProject} onClose={() => setApplyProject(null)} />
            )}
        </div>
    )
}

function ApplyModal({ project, onClose }) {
    const [form, setForm] = useState({ role: '', message: '' })
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.role.trim()) return
        setSubmitting(true)
        try {
            await applyToProject(project._id, form.role, form.message)
            alert('Application sent successfully!')
            onClose()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send application. You might have already applied or been invited.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <form 
                className="bg-[#1e1e2a] rounded-2xl shadow-2xl border border-white/10 max-w-md w-full p-6 relative" 
                onClick={e => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl transition">&times;</button>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Request to Join</h3>
                <p className="text-sm text-gray-400 mb-6">Applying to: <span className="font-semibold text-white">{project.title}</span></p>

                <label className="block mb-5">
                    <span className="text-sm font-semibold text-gray-300 block mb-1">What role are you applying for?</span>
                    <input 
                        required
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        placeholder="e.g. Frontend Developer, ML Engineer"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 shadow-inner transition" 
                    />
                </label>

                <label className="block mb-8">
                    <span className="text-sm font-semibold text-gray-300 block mb-1">Message to the owner (optional)</span>
                    <textarea 
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        placeholder="Why do you want to join? What are your relevant skills?"
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 outline-none text-white placeholder-gray-500 shadow-inner transition resize-none" 
                    />
                </label>

                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-violet-600 font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50 shadow-lg shadow-violet-900/30">
                        {submitting ? 'Sending...' : 'Send Application'}
                    </button>
                </div>
            </form>
        </div>
    )
}
