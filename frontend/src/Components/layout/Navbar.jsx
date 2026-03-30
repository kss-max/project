import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getProjects } from '../../Services/projectService'

// Nav links shown in the navbar
const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/ai-ideation', label: 'AI Ideation' },
  { path: '/projects', label: 'Projects' },
  { path: '/invitations', label: 'Invitations' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])

  useEffect(() => {
    if (user) {
      getProjects({ myProjects: true })
        .then(res => {
          setWorkspaces(res.projects || [])
        })
        .catch(err => console.error('Failed to load workspaces for nav:', err))
    }
  }, [user])

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  return (
    <header className="bg-[#0f0f13]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="text-2xl font-bold text-white tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Campus</span>Connector
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors duration-200 ${
                location.pathname === link.path
                  ? 'text-violet-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Workspaces Dropdown */}
          <div className="relative group py-2">
            <button className={`flex items-center gap-1 transition-colors duration-200 cursor-pointer ${
              location.pathname.startsWith('/workspace') ? 'text-violet-400' : 'text-gray-400 hover:text-white'
            }`}>
              Workspaces
              <svg className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-56 bg-[#1e1e2a] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50 transform origin-top scale-95 group-hover:scale-100">
              {workspaces.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-500 text-center">No active workspaces</div>
              ) : (
                workspaces.map(w => (
                  <Link 
                    key={w._id} 
                    to={`/workspace/${w._id}/hub`}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-violet-400 truncate transition-colors"
                  >
                    {w.title}
                  </Link>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Right side: user info + logout */}
        <div className="flex items-center gap-4">
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition bg-white/5 rounded-full pl-2 pr-4 py-1 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-900/50 uppercase">
                {(user?.name || 'S')[0]}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-200 leading-tight">{user?.name || 'Student'}</p>
              <p className="text-[10px] text-violet-400 uppercase tracking-wider font-bold">Student</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-2 rounded-lg transition cursor-pointer border border-transparent hover:border-red-500/20"
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  )
}
