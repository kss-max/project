import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../Components/layout/Navbar'
import { generateIdeas, searchKaggleDatasets, searchGitHubRepos } from '../../Services/ideationService'
import { createProject } from '../../Services/projectService'

export default function AIIdeation() {
  const { user } = useAuth()

  // The idea text the user types
  const [idea, setIdea] = useState('')

  // Loading state when "generating"
  const [loading, setLoading] = useState(false)

  // Generated project results (will come from backend later)
  const [results, setResults] = useState([])

  // Whether we've generated at least once
  const [hasGenerated, setHasGenerated] = useState(false)

  // Kaggle search state — per-card: { [index]: { loading, datasets, error } }
  const [kaggleState, setKaggleState] = useState({})

  // GitHub search state — per-card: { [index]: { loading, repos, error } }
  const [githubState, setGithubState] = useState({})

  // Handle form submit
  async function handleGenerate() {
    if (!idea.trim()) return

    setLoading(true)
    setResults([])
    setHasGenerated(true)

    try {
      const res = await generateIdeas(idea)
      setResults(res.projects || [])
    } catch (err) {
      console.error('Failed to generate ideas:', err)
      alert(err.response?.data?.message || 'Failed to generate ideas. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Save a generated project to the Projects collection
  async function handleSave(project) {
    try {
      await createProject({
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        difficulty: project.difficulty === 'easy' ? 'Beginner' : project.difficulty === 'hard' ? 'Advanced' : 'Intermediate',
        estimatedDuration: project.estimatedDuration,
        datasets: project.datasets || [],
        challenges: project.challenges || [],
        category: project.category || '',
      })
      alert('Project saved! View it in Projects page.')
    } catch (err) {
      console.error('Failed to save project:', err)
      alert(err.response?.data?.message || 'Failed to save project.')
    }
  }

  // Search Kaggle datasets for a specific project card
  async function handleKaggleSearch(project, index) {
    setKaggleState(prev => ({ ...prev, [index]: { loading: true, datasets: [], error: null } }))
    try {
      const res = await searchKaggleDatasets({
        title: project.title,
        description: project.description,
        techStack: project.techStack,
      })
      setKaggleState(prev => ({ ...prev, [index]: { loading: false, datasets: res.datasets || [], error: null } }))
    } catch (err) {
      console.error('Kaggle search failed:', err)
      setKaggleState(prev => ({ ...prev, [index]: { loading: false, datasets: [], error: err.response?.data?.message || 'Failed to search datasets' } }))
    }
  }

  // Search GitHub repos for a specific project card
  async function handleGitHubSearch(project, index) {
    setGithubState(prev => ({ ...prev, [index]: { loading: true, repos: [], error: null } }))
    try {
      const res = await searchGitHubRepos({
        title: project.title,
        description: project.description,
        techStack: project.techStack,
      })
      setGithubState(prev => ({ ...prev, [index]: { loading: false, repos: res.repos || [], error: null } }))
    } catch (err) {
      console.error('GitHub search failed:', err)
      setGithubState(prev => ({ ...prev, [index]: { loading: false, repos: [], error: err.response?.data?.message || 'Failed to search GitHub' } }))
    }
  }

  // Difficulty badge colors
  function getDifficultyColor(level) {
    if (level === 'easy') return 'bg-green-100 text-green-700'
    if (level === 'medium') return 'bg-yellow-100 text-yellow-700'
    if (level === 'hard') return 'bg-red-100 text-red-400'
    return 'bg-black/30 text-gray-300 border border-white/5 text-gray-300'
  }

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <Navbar />


      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight">AI Project Structuring</h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Describe your vague idea in plain English. Our AI will break it down into
            technical requirements, identify the tech stack, and suggest datasets.
          </p>
        </div>


        {/* Idea Input */}
        <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm border border-white/10 p-8">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="E.g., I want to build something that helps students manage their messy PDF lecture notes..."
            rows={5}
            className="w-full border border-white/20 rounded-xl px-5 py-4 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent resize-none text-base"
          />

          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-400">
              💡 Pro tip: Mention the problem, not the solution.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading || !idea.trim()}
              className="bg-violet-600 shadow-lg shadow-violet-900/30 text-white text-white px-6 py-3 rounded-xl hover:bg-violet-700 text-white transition font-medium shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate Architecture
                </>
              )}
            </button>
          </div>
        </div>


        {/* ── Loading State ── */}
        {loading && (
          <div className="mt-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
            <p className="mt-4 text-gray-400 text-sm">Analyzing your idea and building recommendations...</p>
          </div>
        )}


        {/* ── Results: Project Cards ── */}
        {results.length > 0 && (
          <div className="mt-12 space-y-6">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              🎯 Recommended Projects ({results.length})
            </h3>

            {results.map((project, index) => (
              <div key={index} className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm border border-white/10 p-8">

                {/* Title + Difficulty */}
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-xl font-bold text-white tracking-tight">{project.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDifficultyColor(project.difficulty)}`}>
                    {project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-gray-400 leading-relaxed">{project.description}</p>

                {/* Duration */}
                <p className="mt-3 text-sm text-gray-500">
                  ⏱️ Estimated Duration: <span className="font-medium text-gray-300">{project.estimatedDuration}</span>
                </p>

                {/* Tech Stack */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-300 mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map(tech => (
                      <span key={tech} className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-blue-700 text-sm rounded-full font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills You Have */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">✅ Skills You Already Have</p>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-green-700 text-sm rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skill Gap */}
                {project.skillGap.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-orange-700 mb-2">📚 Skills to Learn (Skill Gap)</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skillGap.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleSave(project)}
                    className="px-5 py-2.5 bg-violet-600 shadow-lg shadow-violet-900/30 text-white text-white rounded-lg hover:bg-violet-700 text-white transition font-medium cursor-pointer"
                  >
                    💾 Save Project
                  </button>

                  {project.needsDataset && (
                    <button
                      onClick={() => handleKaggleSearch(project, index)}
                      disabled={kaggleState[index]?.loading}
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {kaggleState[index]?.loading ? (
                        <><span className="animate-spin">⚙️</span> Searching Kaggle...</>
                      ) : (
                        <>🔍 Search Kaggle Datasets</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleGitHubSearch(project, index)}
                    disabled={githubState[index]?.loading}
                    className="px-5 py-2.5 bg-[#1e1e2a] text-white rounded-lg hover:bg-gray-900 transition font-medium cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {githubState[index]?.loading ? (
                      <><span className="animate-spin">⚙️</span> Searching GitHub...</>
                    ) : (
                      <>🔍 Search GitHub</>
                    )}
                  </button>
                </div>

                {/* Kaggle Dataset Results */}
                {kaggleState[index]?.error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 border border-red-200 rounded-lg text-sm text-red-400">
                    {kaggleState[index].error}
                  </div>
                )}
                {kaggleState[index]?.datasets?.length > 0 && (
                  <div className="mt-4 border border-purple-200 rounded-xl p-4 bg-fuchsia-500/10 border border-fuchsia-500/20/50">
                    <p className="text-sm font-semibold text-fuchsia-400 mb-3">📊 Kaggle Datasets Found</p>
                    <div className="space-y-2">
                      {kaggleState[index].datasets.map((ds, di) => (
                        <a
                          key={di}
                          href={ds.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-[#1e1e2a] border border-white/5 shadow-xl rounded-lg border border-purple-100 hover:border-purple-300 hover:shadow-sm transition group"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-200 group-hover:text-fuchsia-400">{ds.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{ds.size} · {ds.downloads.toLocaleString()} downloads</p>
                          </div>
                          <span className="text-purple-500 text-xs font-medium">View on Kaggle →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* GitHub Repo Results */}
                {githubState[index]?.error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 border border-red-200 rounded-lg text-sm text-red-400">
                    {githubState[index].error}
                  </div>
                )}
                {githubState[index]?.repos?.length > 0 && (
                  <div className="mt-4 border border-white/10 rounded-xl p-4 bg-[#0f0f13]/50">
                    <p className="text-sm font-semibold text-gray-300 mb-3">📂 Similar GitHub Projects</p>
                    <div className="space-y-2">
                      {githubState[index].repos.map((repo, ri) => (
                        <a
                          key={ri}
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-[#1e1e2a] border border-white/5 shadow-xl rounded-lg border border-gray-100 hover:border-white/20 hover:shadow-sm transition group"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white tracking-tight">{repo.full_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{repo.description}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="text-xs font-medium text-gray-400">⭐ {repo.stargazers_count.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{repo.language}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


        {/* ── No results yet message ── */}
        {hasGenerated && !loading && results.length === 0 && (
          <div className="mt-12 text-center text-gray-400">
            <p>No recommendations could be generated. Try describing your idea differently.</p>
          </div>
        )}


        {/* ── Tips & Limitations Section ── */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tips */}
          <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm border border-white/10 p-6">
            <h4 className="text-lg font-bold text-white tracking-tight mb-4">💡 Tips for Better Results</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Describe the <strong>problem</strong>, not the solution — <em>"students struggle to find study partners"</em></span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Mention your <strong>domain interest</strong> — <em>"healthcare"</em>, <em>"agriculture"</em>, <em>"education"</em></span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Add context about your <strong>target users</strong> — <em>"for college students"</em>, <em>"for farmers"</em></span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Be specific about constraints — <em>"beginner friendly"</em>, <em>"can be done in 4 weeks"</em></span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span>Update your <Link to="/profile" className="text-violet-400 hover:underline">Profile skills</Link> — AI uses them to personalize suggestions</span>
              </li>
            </ul>
          </div>

          {/* Limitations */}
          <div className="bg-[#1e1e2a] border border-white/5 shadow-xl rounded-2xl shadow-sm border border-white/10 p-6">
            <h4 className="text-lg font-bold text-white tracking-tight mb-4">⚠️ Limitations</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">!</span>
                <span>AI suggestions are <strong>starting points</strong>, not final blueprints — always do your own research</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">!</span>
                <span><strong>Dataset names</strong> may not be real — verify on Kaggle, UCI, or Papers With Code before using</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">!</span>
                <span>For <strong>niche/research topics</strong> (e.g., "detect rice blast disease"), AI may give shallow suggestions — consult research papers</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">!</span>
                <span><strong>Difficulty estimates</strong> are approximate — actual time depends on your experience and team size</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">!</span>
                <span>AI does <strong>not check feasibility</strong> — some suggestions may need hardware, APIs, or paid services</span>
              </li>
            </ul>
          </div>

        </div>

      </main>
    </div>
  )
}
