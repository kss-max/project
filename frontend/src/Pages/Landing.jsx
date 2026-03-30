import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleJoinPlatform = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/auth')
    }
  }

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/auth')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white overflow-hidden relative">

      {/* Decorative Background Elements */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none -z-10"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Campus</span>Connector
        </h1>

        <div className="flex items-center gap-6">
          {user && (
            <Link
              to="/dashboard"
              className="text-sm text-gray-400 hover:text-white font-medium transition"
            >
              Dashboard
            </Link>
          )}
          <Link
            to={user ? "/projects" : "/auth"}
            className="text-sm text-gray-400 hover:text-white font-medium transition"
          >
            Explore Projects
          </Link>

          <button
            onClick={handleGetStarted}
            className="bg-violet-600 text-white px-5 py-2 rounded-lg hover:bg-violet-700 transition text-sm font-semibold shadow-lg shadow-violet-900/30 cursor-pointer"
          >
            Get Started &rarr;
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center mt-24 md:mt-32 px-6 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI-Powered Matching Engine
        </div>

        <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-tight max-w-5xl mx-auto tracking-tight">
          Turn vague ideas into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">structured projects.</span>
        </h2>

        <p className="mt-8 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Stop struggling to find the right project or team. Describe what you
          want to build, let AI structure it, and automatically match with students
          who have the skills you need.
        </p>

        <div className="mt-12 flex justify-center gap-4 flex-wrap">
          <button
            onClick={handleJoinPlatform}
            className="bg-violet-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-700 transition shadow-xl shadow-violet-900/40 inline-flex items-center gap-2 cursor-pointer border border-violet-500/50"
          >
            Join the Platform
            <span>&rarr;</span>
          </button>

          <Link
            to={user ? "/projects" : "/auth"}
            className="bg-[#1e1e2a] border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition inline-flex items-center gap-2"
          >
            Explore Projects
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto mt-32 border-t border-white/5"></div>

      {/* Features Section */}
      <section className="mt-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center relative z-10 pb-28">

        {/* Feature 1 - AI Ideation */}
        <div className="flex flex-col items-center bg-[#1e1e2a] p-8 rounded-3xl border border-white/5 hover:border-violet-500/30 transition-all hover:-translate-y-1 shadow-2xl shadow-black/50">
          <div className="w-16 h-16 bg-violet-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">AI Ideation</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Convert plain text into technical requirements automatically.
          </p>
        </div>

        {/* Feature 2 - Smart Matching */}
        <div className="flex flex-col items-center bg-[#1e1e2a] p-8 rounded-3xl border border-white/5 hover:border-violet-500/30 transition-all hover:-translate-y-1 shadow-2xl shadow-black/50">
          <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Smart Matching</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Find teammates based on extracted tech stack skills.
          </p>
        </div>

        {/* Feature 3 - Team Workspace */}
        <div className="flex flex-col items-center bg-[#1e1e2a] p-8 rounded-3xl border border-white/5 hover:border-violet-500/30 transition-all hover:-translate-y-1 shadow-2xl shadow-black/50">
          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Team Workspace</h3>
          <p className="text-gray-400 leading-relaxed text-sm">
            Collaborate, track milestones, and ship faster in real-time.
          </p>
        </div>

      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/5 bg-[#0f0f13] relative z-20">
        &copy; 2026 CampusConnector. Built for students, by students.
      </footer>

    </div>
  )
}
