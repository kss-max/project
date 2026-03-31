import { useEffect, useState } from 'react'
import { getProfileById } from '../../Services/profileService'

export default function StudentProfileModal({ userId, onClose }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) {
            setLoading(true)
            getProfileById(userId)
                .then(res => setProfile(res.user))
                .catch(err => console.error('Failed to load profile', err))
                .finally(() => setLoading(false))
        }
    }, [userId])

    if (!userId) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div 
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/10 bg-[#1e1e2a] custom-scrollbar"
            >
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-gray-400 font-medium">Loading profile...</p>
                    </div>
                ) : !profile ? (
                    <div className="p-20 text-center">
                        <p className="text-red-400 italic">User profile not found.</p>
                        <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-white underline">Close</button>
                    </div>
                ) : (
                    <>
                        {/* Header/Cover Area */}
                        <div className="h-32 bg-gradient-to-r from-violet-600/30 to-indigo-600/30"></div>
                        
                        <div className="px-6 pb-8 -mt-12">
                            <div className="flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-2xl bg-violet-600 border-4 border-[#1e1e2a] flex items-center justify-center text-white text-3xl font-bold shadow-xl mb-4">
                                    {(profile.name || 'U')[0].toUpperCase()}
                                </div>
                                
                                <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                                <p className="text-violet-400 font-medium text-sm mb-4">
                                    {profile.department} • Year {profile.yearOfStudy}
                                </p>
                                
                                {profile.bio && (
                                    <p className="text-gray-300 text-sm max-w-md leading-relaxed italic mb-6">
                                        "{profile.bio}"
                                    </p>
                                )}

                                {/* Meta Info Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full border-t border-white/5 pt-6 mb-8">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">University</p>
                                        <p className="text-xs text-white font-medium">{profile.college}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Location</p>
                                        <p className="text-xs text-white font-medium">{profile.location || 'Not Specified'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Experience</p>
                                        <p className="text-xs text-white font-medium">{profile.experienceLevel || 'Beginner'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-3 ml-1">Technical Arsenal</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(profile.skills || {}).map(category => (
                                            profile.skills[category]?.map(skill => (
                                                <span key={skill} className="px-3 py-1.5 rounded-lg text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium hover:bg-violet-500/20 transition cursor-default">
                                                    {skill}
                                                </span>
                                            ))
                                        ))}
                                        {(!profile.skills || Object.values(profile.skills).every(v => v.length === 0)) && (
                                            <p className="text-xs text-gray-600 italic">No specific skills listed.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Interests */}
                                <div>
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-3 ml-1">Domains of Interest</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests?.map(interest => (
                                            <span key={interest} className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                                                {interest}
                                            </span>
                                        )) || <p className="text-xs text-gray-600 italic">No interests listed.</p>}
                                    </div>
                                </div>

                                {/* Availability & Preferences */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 mb-1">Commitment</h4>
                                        <p className="text-sm text-white font-medium">{profile.availability || 'Flexible'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 mb-1">Role Preference</h4>
                                        <p className="text-sm text-white font-medium capitalize">{profile.rolePreference || 'Open to all'}</p>
                                    </div>
                                </div>

                                {/* Links */}
                                <div className="flex justify-center gap-4 pt-4">
                                    {profile.portfolioLinks?.github && (
                                        <a href={profile.portfolioLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                                            <span className="text-xs font-bold">GitHub ↗</span>
                                        </a>
                                    )}
                                    {profile.portfolioLinks?.linkedin && (
                                        <a href={profile.portfolioLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                                            <span className="text-xs font-bold">LinkedIn ↗</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer button */}
                        <div className="sticky bottom-0 p-4 bg-[#1e1e2a] border-t border-white/5 flex justify-center">
                            <button 
                                onClick={onClose}
                                className="px-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition"
                            >
                                Close Profile
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
