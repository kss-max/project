import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginUser, signupUser } from '../../Services/authService'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    college: '', department: '', yearOfStudy: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      let data
      if (isLogin) {
        data = await loginUser({ email: form.email, password: form.password })
      } else {
        data = await signupUser({
          name: form.name,
          email: form.email,
          password: form.password,
          college: form.college,
          department: form.department,
          yearOfStudy: Number(form.yearOfStudy),
        })
      }
      login(data.user)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message || err.message || 'Something went wrong'
      if (status === 404 && isLogin) {
        setError('No account found with this email. Please create an account first.')
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="bg-[#1e1e2a] p-10 rounded-2xl shadow-2xl border border-white/5 w-full max-w-md relative z-10">

        {/* Tab Toggle */}
        <div className="flex mb-8 bg-black/20 rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition cursor-pointer ${
              isLogin
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition cursor-pointer ${
              !isLogin
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-white tracking-tight">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
            {error}
            {error.includes('create an account') && (
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError('') }}
                className="block w-full mt-2 text-violet-400 hover:text-violet-300 font-semibold underline text-xs cursor-pointer"
              >
                → Click here to Sign Up
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-black/40 text-white placeholder-gray-500 shadow-inner"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />

          {!isLogin && (
            <>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-black/40 text-white placeholder-gray-500 shadow-inner"
              />

              <input
                type="text"
                name="college"
                placeholder="College / University"
                value={form.college}
                onChange={handleChange}
                className="w-full border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-black/40 text-white placeholder-gray-500 shadow-inner"
              />

              <input
                type="text"
                name="department"
                placeholder="Department / Branch"
                value={form.department}
                onChange={handleChange}
                className="w-full border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-black/40 text-white placeholder-gray-500 shadow-inner"
              />

              <select
                name="yearOfStudy"
                value={form.yearOfStudy}
                onChange={handleChange}
                className="w-full border border-white/10 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 appearance-none bg-black/40 shadow-inner"
              >
                <option value="" disabled className="bg-[#1e1e2a] text-gray-400">Year of Study</option>
                <option value="1" className="bg-[#1e1e2a]">1st Year</option>
                <option value="2" className="bg-[#1e1e2a]">2nd Year</option>
                <option value="3" className="bg-[#1e1e2a]">3rd Year</option>
                <option value="4" className="bg-[#1e1e2a]">4th Year</option>
                <option value="5" className="bg-[#1e1e2a]">5th Year</option>
              </select>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 border border-violet-500/50"
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-violet-400 font-semibold hover:text-violet-300 transition cursor-pointer bg-transparent border-none p-0"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
