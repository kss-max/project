import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getProfile, updateProfile } from '../../Services/profileService'

// ─── All the options users can pick from ─────────────────

// Skills organized by category
const SKILL_OPTIONS = {
  programmingLanguages: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Go', 'Rust'],
  webDevelopment: ['HTML', 'CSS', 'React', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask'],
  mobileDevelopment: ['Flutter', 'React Native', 'Kotlin', 'Swift'],
  aiMl: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Computer Vision', 'NLP'],
  databases: ['MongoDB', 'MySQL', 'PostgreSQL', 'Firebase', 'Redis'],
  tools: ['Git', 'Docker', 'Figma', 'Linux', 'AWS'],
}

// Readable names for each skill category
const SKILL_LABELS = {
  programmingLanguages: 'Programming Languages',
  webDevelopment: 'Web Development',
  mobileDevelopment: 'Mobile Development',
  aiMl: 'AI / Machine Learning',
  databases: 'Databases',
  tools: 'Tools',
}

// Interest domains
const INTEREST_OPTIONS = [
  'Artificial Intelligence', 'Web Development', 'Cybersecurity',
  'Blockchain', 'Internet of Things (IoT)', 'Data Science',
  'FinTech', 'HealthTech', 'EdTech', 'Game Development',
]

const AVAILABILITY_OPTIONS = ['5 hours/week', '10 hours/week', '15+ hours/week']
const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']
const ROLE_PREFERENCE_OPTIONS = ['frontend', 'backend', 'ml', 'design']

// Tab buttons shown at the top
const TABS = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'skills', label: 'Skills' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'interests', label: 'Interests' },
  { key: 'links', label: 'Links' },
  { key: 'preferences', label: 'Preferences' },
]

// ─── Profile Component ───────────────────────────────────

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Loading & saving states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 'view' = show profile card, 'edit' = show edit form
  const [mode, setMode] = useState('view')

  // Show success/error messages
  const [message, setMessage] = useState({ text: '', type: '' })

  // Which tab is currently open
  const [activeTab, setActiveTab] = useState('basic')

  // ── All form data in one state object ──
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    department: '',
    yearOfStudy: '',
    bio: '',
    avatar: '',
    location: '',
    skills: {
      programmingLanguages: [],
      webDevelopment: [],
      mobileDevelopment: [],
      aiMl: [],
      databases: [],
      tools: [],
    },
    achievements: [],       // Array of { title, description, year }
    certificates: [],       // Array of { title, organization, issueDate, fileUrl, link }
    interests: [],           // Array of strings like "AI", "Web Development"
    learningGoals: [],
    learningGoalsInput: '',
    portfolioLinks: {
      github: '',
      linkedin: '',
      portfolio: '',
      kaggle: '',
      leetcode: '',
    },
    availability: '',        // e.g. "5 hours/week"
    availabilityHours: 0,
    experienceLevel: '',     // e.g. "Beginner"
    rolePreference: '',
  })


  // ── When page loads, fetch the user's profile from backend ──
  useEffect(() => {
    // If not logged in, send to auth page
    if (!user) {
      navigate('/auth')
      return
    }

    // Fetch profile data
    getProfile()
      .then((response) => {
        const u = response.user

        // Fill form with data from server (use empty defaults if missing)
        setForm({
          name: u.name || '',
          email: u.email || '',
          college: u.college || '',
          department: u.department || '',
          yearOfStudy: u.yearOfStudy || '',
          bio: u.bio || '',
          avatar: u.avatar || '',
          location: u.location || '',
          skills: {
            programmingLanguages: u.skills?.programmingLanguages || [],
            webDevelopment: u.skills?.webDevelopment || [],
            mobileDevelopment: u.skills?.mobileDevelopment || [],
            aiMl: u.skills?.aiMl || [],
            databases: u.skills?.databases || [],
            tools: u.skills?.tools || [],
          },
          achievements: u.achievements || [],
          certificates: u.certificates || [],
          interests: u.interests || [],
          learningGoals: u.learningGoals || [],
          learningGoalsInput: '',
          portfolioLinks: {
            github: u.portfolioLinks?.github || '',
            linkedin: u.portfolioLinks?.linkedin || '',
            portfolio: u.portfolioLinks?.portfolio || '',
            kaggle: u.portfolioLinks?.kaggle || '',
            leetcode: u.portfolioLinks?.leetcode || '',
          },
          availability: u.availability || '',
          availabilityHours: u.availabilityHours || 0,
          experienceLevel: u.experienceLevel || '',
          rolePreference: u.rolePreference || '',
        })
      })
      .catch(() => {
        setMessage({ text: 'Failed to load profile', type: 'error' })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user, navigate])


  // ────────────────────────────────────────────────────────
  //  HANDLER FUNCTIONS (how we update the form)
  // ────────────────────────────────────────────────────────

  // For simple text inputs (name, college, bio, etc.)
  // The input's "name" attribute matches the key in our form state
  function handleChange(e) {
    const fieldName = e.target.name   // e.g. "name", "college", "bio"
    const fieldValue = e.target.value // whatever the user typed
    setForm({ ...form, [fieldName]: fieldValue })
  }

  // Toggle a skill on/off in a category
  // e.g. toggleSkill("programmingLanguages", "Python")
  function toggleSkill(category, skill) {
    const currentSkills = form.skills[category]  // e.g. ["Python", "Java"]

    // If already selected → remove it, else → add it
    let updatedSkills
    if (currentSkills.includes(skill)) {
      updatedSkills = currentSkills.filter(s => s !== skill)  // remove
    } else {
      updatedSkills = [...currentSkills, skill]               // add
    }

    // Update the form with new skills for that category
    setForm({
      ...form,
      skills: { ...form.skills, [category]: updatedSkills }
    })
  }

  // Toggle an interest on/off
  function toggleInterest(interest) {
    let updatedInterests
    if (form.interests.includes(interest)) {
      updatedInterests = form.interests.filter(i => i !== interest)  // remove
    } else {
      updatedInterests = [...form.interests, interest]               // add
    }
    setForm({ ...form, interests: updatedInterests })
  }

  // ── Achievements: Add / Remove / Edit ──

  function addAchievement() {
    const newAchievement = { title: '', description: '', year: '' }
    setForm({ ...form, achievements: [...form.achievements, newAchievement] })
  }

  function removeAchievement(index) {
    const updated = form.achievements.filter((_, i) => i !== index)
    setForm({ ...form, achievements: updated })
  }

  function updateAchievement(index, field, value) {
    const updated = [...form.achievements]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, achievements: updated })
  }

  // ── Certificates: Add / Remove / Edit ──

  function addCertificate() {
    const newCert = { title: '', organization: '', issueDate: '', fileUrl: '', link: '' }
    setForm({ ...form, certificates: [...form.certificates, newCert] })
  }

  function removeCertificate(index) {
    const updated = form.certificates.filter((_, i) => i !== index)
    setForm({ ...form, certificates: updated })
  }

  function updateCertificate(index, field, value) {
    const updated = [...form.certificates]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, certificates: updated })
  }

  // For portfolio link inputs (github, linkedin, etc.)
  function handlePortfolioChange(e) {
    const fieldName = e.target.name
    const fieldValue = e.target.value
    setForm({
      ...form,
      portfolioLinks: { ...form.portfolioLinks, [fieldName]: fieldValue }
    })
  }

  // ── Save profile to backend ──
  async function handleSave() {
    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      // Build the data to send (don't send email — it's not editable)
      const dataToSend = { ...form }
      delete dataToSend.email
      dataToSend.yearOfStudy = Number(dataToSend.yearOfStudy)

      // Remove empty achievements (no title) and certificates (no title)
      dataToSend.achievements = dataToSend.achievements.filter(a => a.title.trim() !== '')
      dataToSend.certificates = dataToSend.certificates.filter(c => c.title.trim() !== '')
      dataToSend.learningGoals = dataToSend.learningGoals
        .map((goal) => goal.trim())
        .filter(Boolean)
      delete dataToSend.learningGoalsInput
      dataToSend.availabilityHours = Number(dataToSend.availabilityHours) || 0

      const response = await updateProfile(dataToSend)
      const u = response.user

      // Update the form with the saved data from backend
      setForm({
        name: u.name || '',
        email: u.email || '',
        college: u.college || '',
        department: u.department || '',
        yearOfStudy: u.yearOfStudy || '',
        bio: u.bio || '',
        avatar: u.avatar || '',
        location: u.location || '',
        skills: {
          programmingLanguages: u.skills?.programmingLanguages || [],
          webDevelopment: u.skills?.webDevelopment || [],
          mobileDevelopment: u.skills?.mobileDevelopment || [],
          aiMl: u.skills?.aiMl || [],
          databases: u.skills?.databases || [],
          tools: u.skills?.tools || [],
        },
        achievements: u.achievements || [],
        certificates: u.certificates || [],
        interests: u.interests || [],
        learningGoals: u.learningGoals || [],
        learningGoalsInput: '',
        portfolioLinks: {
          github: u.portfolioLinks?.github || '',
          linkedin: u.portfolioLinks?.linkedin || '',
          portfolio: u.portfolioLinks?.portfolio || '',
          kaggle: u.portfolioLinks?.kaggle || '',
          leetcode: u.portfolioLinks?.leetcode || '',
        },
        availability: u.availability || '',
        availabilityHours: u.availabilityHours || 0,
        experienceLevel: u.experienceLevel || '',
        rolePreference: u.rolePreference || '',
      })

      setMessage({ text: 'Profile saved successfully!', type: 'success' })
      setMode('view')  // Switch to view mode after saving
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save profile'
      setMessage({ text: errorMsg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }


  // ────────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────────

  // Show loading spinner while fetching profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-gray-500 text-lg">Loading profile...</div>
      </div>
    )
  }

  // Helper: get all skills as a flat array
  function getAllSkills() {
    const all = []
    Object.keys(form.skills).forEach(category => {
      form.skills[category].forEach(skill => all.push(skill))
    })
    return all
  }

  // Helper: check if portfolio has any links filled
  function hasAnyLink() {
    return form.portfolioLinks.github || form.portfolioLinks.linkedin ||
      form.portfolioLinks.portfolio || form.portfolioLinks.kaggle || form.portfolioLinks.leetcode
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="text-sm text-violet-400 hover:underline">
              ← Back to Dashboard
            </button>
            {mode === 'view' ? (
              <button onClick={() => setMode('edit')}
                className="text-sm bg-violet-600 text-white shadow-lg shadow-violet-900/30 px-3 py-1.5 rounded-lg hover:bg-violet-700 transition cursor-pointer">
                Edit Profile
              </button>
            ) : (
              <button onClick={() => setMode('view')}
                className="text-sm bg-[#0f0f13]0 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer">
                Cancel
              </button>
            )}
            <button
              onClick={async () => { await logout(); navigate('/auth'); }}
              className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition cursor-pointer">
              Logout
            </button>
          </div>
        </div>

        {/* ── Success / Error Message ── */}
        {message.text && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}


        {/* ══════════════════════════════════════════════════ */}
        {/*  VIEW MODE — Show profile as a nice card          */}
        {/* ══════════════════════════════════════════════════ */}
        {mode === 'view' && (
          <div className="space-y-6">

            {/* ── Top Card: Avatar + Basic Info ── */}
            <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center text-3xl font-bold text-violet-400 overflow-hidden flex-shrink-0">
                  {form.avatar ? (
                    <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    form.name ? form.name.charAt(0).toUpperCase() : '?'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{form.name || 'No Name'}</h2>
                  <p className="text-gray-500 mt-1">{form.email}</p>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-gray-500">
                    {form.college && <span>🎓 {form.college}</span>}
                    {form.department && <span>📚 {form.department}</span>}
                    {form.yearOfStudy && <span>📅 Year {form.yearOfStudy}</span>}
                    {form.location && <span>📍 {form.location}</span>}
                  </div>

                  {form.bio && (
                    <p className="mt-4 text-gray-300 leading-relaxed">{form.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {form.availability && (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded-full">
                        ⏰ {form.availability}
                      </span>
                    )}
                    {form.availabilityHours > 0 && (
                      <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-medium rounded-full">
                        🕒 {form.availabilityHours} hrs/week
                      </span>
                    )}
                    {form.experienceLevel && (
                      <span className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-xs font-medium rounded-full">
                        🚀 {form.experienceLevel}
                      </span>
                    )}
                    {form.rolePreference && (
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium rounded-full capitalize">
                        🎯 {form.rolePreference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* ── Skills ── */}
            {getAllSkills().length > 0 && (
              <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-white tracking-tight mb-4">Skills</h3>
                {Object.keys(SKILL_OPTIONS).map(category => {
                  const skills = form.skills[category]
                  if (skills.length === 0) return null
                  return (
                    <div key={category} className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{SKILL_LABELS[category]}</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <span key={skill} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-sm font-medium rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}


            {/* ── Interests ── */}
            {form.interests.length > 0 && (
              <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-white tracking-tight mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {form.interests.map(interest => (
                    <span key={interest} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-sm font-medium rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Learning Goals ── */}
            {form.learningGoals.length > 0 && (
              <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-white tracking-tight mb-4">Learning Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {form.learningGoals.map((goal) => (
                    <span key={goal} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-medium rounded-full">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}


            {/* ── Achievements ── */}
            {form.achievements.length > 0 && (
              <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-white tracking-tight mb-4">Achievements</h3>
                <div className="space-y-4">
                  {form.achievements.map((ach, i) => (
                    <div key={i} className="border-l-4 border-violet-500/50 pl-4">
                      <p className="font-semibold text-white tracking-tight">{ach.title}</p>
                      {ach.description && <p className="text-sm text-gray-500 mt-1">{ach.description}</p>}
                      {ach.year && <p className="text-xs text-gray-500 mt-1">{ach.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* ── Certificates ── */}
            {form.certificates.length > 0 && (
              <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-white tracking-tight mb-4">Certificates</h3>
                <div className="space-y-4">
                  {form.certificates.map((cert, i) => (
                    <div key={i} className="border-l-4 border-emerald-500/50 pl-4">
                      <p className="font-semibold text-white tracking-tight">{cert.title}</p>
                      {cert.organization && <p className="text-sm text-gray-500 mt-1">{cert.organization}</p>}
                      {cert.issueDate && <p className="text-xs text-gray-500 mt-1">{cert.issueDate}</p>}
                      {cert.link && (
                        <a href={cert.link} target="_blank" rel="noreferrer"
                          className="text-sm text-violet-400 hover:underline mt-1 inline-block">View Certificate ↗</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* ── Portfolio Links ── */}
            {hasAnyLink() && (
              <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-white tracking-tight mb-4">Portfolio Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.portfolioLinks.github && (
                    <a href={form.portfolioLinks.github} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                      <span className="w-8 h-8 bg-black/40 border border-white/5 rounded-full flex items-center justify-center">🐙</span>
                      GitHub
                    </a>
                  )}
                  {form.portfolioLinks.linkedin && (
                    <a href={form.portfolioLinks.linkedin} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                      <span className="w-8 h-8 bg-black/40 border border-white/5 rounded-full flex items-center justify-center">💼</span>
                      LinkedIn
                    </a>
                  )}
                  {form.portfolioLinks.portfolio && (
                    <a href={form.portfolioLinks.portfolio} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                      <span className="w-8 h-8 bg-black/40 border border-white/5 rounded-full flex items-center justify-center">🌐</span>
                      Portfolio
                    </a>
                  )}
                  {form.portfolioLinks.kaggle && (
                    <a href={form.portfolioLinks.kaggle} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                      <span className="w-8 h-8 bg-black/40 border border-white/5 rounded-full flex items-center justify-center">📊</span>
                      Kaggle
                    </a>
                  )}
                  {form.portfolioLinks.leetcode && (
                    <a href={form.portfolioLinks.leetcode} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-violet-400 transition">
                      <span className="w-8 h-8 bg-black/40 border border-white/5 rounded-full flex items-center justify-center">💻</span>
                      LeetCode
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Edit Profile button at bottom of view */}
            <div className="flex justify-center">
              <button onClick={() => setMode('edit')}
                className="bg-violet-600 text-white shadow-lg shadow-violet-900/30 px-8 py-3 rounded-lg hover:bg-violet-700 transition font-medium shadow-sm cursor-pointer">
                Edit Profile
              </button>
            </div>
          </div>
        )}


        {/* ══════════════════════════════════════════════════ */}
        {/*  EDIT MODE — Show the tabbed edit form            */}
        {/* ══════════════════════════════════════════════════ */}
        {mode === 'edit' && (
        <>

        {/* ── Tab Buttons ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 shadow-sm'
                  : 'bg-[#1e1e2a] border border-white/5 shadow-xl text-gray-500 hover:bg-black/40 border border-white/5 border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm p-8">


          {/* ===================== BASIC INFO TAB ===================== */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold mb-2">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                {/* Email (can't edit) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input value={form.email} disabled
                    className="w-full border rounded-lg px-4 py-2.5 bg-black/40 border border-white/5 text-gray-500 cursor-not-allowed" />
                </div>

                {/* College */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">College / University</label>
                  <input name="college" value={form.college} onChange={handleChange}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department / Branch</label>
                  <input name="department" value={form.department} onChange={handleChange}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Year of Study</label>
                  <select name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner">
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location (optional)</label>
                  <input name="location" value={form.location} onChange={handleChange}
                    placeholder="e.g. Bangalore, India"
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Avatar URL</label>
                <input name="avatar" value={form.avatar} onChange={handleChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                <textarea name="bio" value={form.bio} onChange={handleChange}
                  rows={4} maxLength={500} placeholder="Tell others about yourself..."
                  className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner resize-none" />
                <p className="text-xs text-gray-500 mt-1">{form.bio.length}/500</p>
              </div>
            </div>
          )}


          {/* ===================== SKILLS TAB ===================== */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-2">Skills</h2>

              {/* Loop through each skill category */}
              {Object.keys(SKILL_OPTIONS).map(category => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    {SKILL_LABELS[category]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS[category].map(skill => {
                      const isSelected = form.skills[category].includes(skill)
                      return (
                        <button key={skill} type="button"
                          onClick={() => toggleSkill(category, skill)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer ${
                            isSelected
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 border-violet-500'
                              : 'bg-[#1e1e2a] border border-white/5 shadow-xl text-gray-500 border-white/10 hover:border-violet-500/50'
                          }`}>
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}


          {/* ===================== ACHIEVEMENTS TAB ===================== */}
          {activeTab === 'achievements' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Achievements</h2>
                <button type="button" onClick={addAchievement}
                  className="text-sm bg-violet-600 text-white shadow-lg shadow-violet-900/30 px-4 py-2 rounded-lg hover:bg-violet-700 transition cursor-pointer">
                  + Add Achievement
                </button>
              </div>

              {/* Show message if no achievements */}
              {form.achievements.length === 0 && (
                <p className="text-gray-500 text-sm">No achievements added yet.</p>
              )}

              {/* Each achievement card */}
              {form.achievements.map((ach, i) => (
                <div key={i} className="border rounded-xl p-5 space-y-3 relative">
                  {/* Delete button */}
                  <button type="button" onClick={() => removeAchievement(i)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-lg cursor-pointer">
                    ✕
                  </button>
                   
                  <input placeholder="Title (e.g. Hackathon Winner)" value={ach.title}
                    onChange={(e) => updateAchievement(i, 'title', e.target.value)}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />

                  <input placeholder="Description" value={ach.description}
                    onChange={(e) => updateAchievement(i, 'description', e.target.value)}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />

                  <input placeholder="Year (e.g. 2025)" type="number" value={ach.year}
                    onChange={(e) => updateAchievement(i, 'year', e.target.value)}
                    className="w-48 bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>
              ))}
            </div>
          )}


          {/* ===================== CERTIFICATES TAB ===================== */}
          {activeTab === 'certificates' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Certificates</h2>
                <button type="button" onClick={addCertificate}
                  className="text-sm bg-violet-600 text-white shadow-lg shadow-violet-900/30 px-4 py-2 rounded-lg hover:bg-violet-700 transition cursor-pointer">
                  + Add Certificate
                </button>
              </div>

              {form.certificates.length === 0 && (
                <p className="text-gray-500 text-sm">No certificates added yet.</p>
              )}

              {form.certificates.map((cert, i) => (
                <div key={i} className="border rounded-xl p-5 space-y-3 relative">
                  <button type="button" onClick={() => removeCertificate(i)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-lg cursor-pointer">
                    ✕
                  </button>

                  <input placeholder="Certificate Title" value={cert.title}
                    onChange={(e) => updateCertificate(i, 'title', e.target.value)}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />

                  <input placeholder="Issuing Organization" value={cert.organization}
                    onChange={(e) => updateCertificate(i, 'organization', e.target.value)}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input placeholder="Issue Date (e.g. Jan 2025)" value={cert.issueDate}
                      onChange={(e) => updateCertificate(i, 'issueDate', e.target.value)}
                      className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />

                    <input placeholder="Certificate Link (optional)" value={cert.link}
                      onChange={(e) => updateCertificate(i, 'link', e.target.value)}
                      className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                  </div>

                  <input placeholder="File URL (PDF/Image)" value={cert.fileUrl}
                    onChange={(e) => updateCertificate(i, 'fileUrl', e.target.value)}
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>
              ))}
            </div>
          )}


          {/* ===================== INTERESTS TAB ===================== */}
          {activeTab === 'interests' && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold mb-2">Interests / Domains</h2>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => {
                  const isSelected = form.interests.includes(interest)
                  return (
                    <button key={interest} type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 border-violet-500'
                          : 'bg-[#1e1e2a] border border-white/5 shadow-xl text-gray-500 border-white/10 hover:border-violet-500/50'
                      }`}>
                      {interest}
                    </button>
                  )
                })}
              </div>
            </div>
          )}


          {/* ===================== PORTFOLIO LINKS TAB ===================== */}
          {activeTab === 'links' && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold mb-2">Portfolio Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">GitHub</label>
                  <input name="github" value={form.portfolioLinks.github} onChange={handlePortfolioChange}
                    placeholder="https://github.com/username"
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
                  <input name="linkedin" value={form.portfolioLinks.linkedin} onChange={handlePortfolioChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio Website</label>
                  <input name="portfolio" value={form.portfolioLinks.portfolio} onChange={handlePortfolioChange}
                    placeholder="https://yoursite.com"
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kaggle</label>
                  <input name="kaggle" value={form.portfolioLinks.kaggle} onChange={handlePortfolioChange}
                    placeholder="https://kaggle.com/username"
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">LeetCode</label>
                  <input name="leetcode" value={form.portfolioLinks.leetcode} onChange={handlePortfolioChange}
                    placeholder="https://leetcode.com/username"
                    className="w-full bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner" />
                </div>

              </div>
            </div>
          )}


          {/* ===================== PREFERENCES TAB ===================== */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">

              {/* Availability */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Availability</h2>
                <div className="flex flex-wrap gap-3">
                  {AVAILABILITY_OPTIONS.map(option => (
                    <button key={option} type="button"
                      onClick={() => {
                        // If already selected, unselect it. Otherwise select it.
                        if (form.availability === option) {
                          setForm({ ...form, availability: '' })
                        } else {
                          setForm({ ...form, availability: option })
                        }
                      }}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                        form.availability === option
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 border-violet-500'
                          : 'bg-[#1e1e2a] border border-white/5 shadow-xl text-gray-500 border-white/10 hover:border-violet-500/50'
                      }`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Experience Level</h2>
                <div className="flex flex-wrap gap-3">
                  {EXPERIENCE_OPTIONS.map(option => (
                    <button key={option} type="button"
                      onClick={() => {
                        if (form.experienceLevel === option) {
                          setForm({ ...form, experienceLevel: '' })
                        } else {
                          setForm({ ...form, experienceLevel: option })
                        }
                      }}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                        form.experienceLevel === option
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 border-violet-500'
                          : 'bg-[#1e1e2a] border border-white/5 shadow-xl text-gray-500 border-white/10 hover:border-violet-500/50'
                      }`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly availability hours */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Availability Hours (per week)</h2>
                <input
                  type="number"
                  min="0"
                  name="availabilityHours"
                  value={form.availabilityHours}
                  onChange={handleChange}
                  className="w-full md:w-64 border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="e.g. 8"
                />
              </div>

              {/* Role preference */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Preferred Role</h2>
                <div className="flex flex-wrap gap-3">
                  {ROLE_PREFERENCE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (form.rolePreference === option) {
                          setForm({ ...form, rolePreference: '' })
                        } else {
                          setForm({ ...form, rolePreference: option })
                        }
                      }}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer capitalize ${
                        form.rolePreference === option
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 border-violet-500'
                          : 'bg-[#1e1e2a] border border-white/5 shadow-xl text-gray-500 border-white/10 hover:border-violet-500/50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning goals */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Learning Goals</h2>
                <div className="flex gap-2">
                  <input
                    name="learningGoalsInput"
                    value={form.learningGoalsInput}
                    onChange={handleChange}
                    placeholder="Add a learning goal and press Add"
                    className="flex-1 bg-black/40 border-white/10 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-500 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const goal = form.learningGoalsInput.trim()
                      if (!goal) return
                      if (form.learningGoals.includes(goal)) return
                      setForm({
                        ...form,
                        learningGoals: [...form.learningGoals, goal],
                        learningGoalsInput: '',
                      })
                    }}
                    className="bg-violet-600 text-white shadow-lg shadow-violet-900/30 px-4 py-2.5 rounded-lg hover:bg-violet-700 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {form.learningGoals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.learningGoals.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => {
                          setForm({
                            ...form,
                            learningGoals: form.learningGoals.filter((g) => g !== goal),
                          })
                        }}
                        className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-medium rounded-full border border-cyan-500/20 hover:bg-cyan-500/20 transition"
                        title="Remove goal"
                      >
                        {goal} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ── Save Button ── */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => setMode('view')}
            className="bg-white/5 text-gray-300 px-6 py-3 rounded-lg hover:bg-white/10 transition font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 text-white shadow-lg shadow-violet-900/30 px-8 py-3 rounded-lg hover:bg-violet-700 transition font-medium shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        </> /* end of edit mode */
        )}

      </div>
    </div>
  )
}
