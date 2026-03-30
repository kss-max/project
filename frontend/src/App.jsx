import { Routes, Route } from 'react-router-dom'
import Landing from './Pages/Landing'
import AuthPage from './Pages/user/AuthPage'
import Profile from './Pages/user/Profile'
import Dashboard from './Pages/dashboard/Dashboard'
import Projects from './Pages/projects/Projects'
import AIIdeation from './Pages/ideation/AIIdeation'
import FindTeammates from './Pages/workspace/FindTeammates'
import WorkspaceHub from './Pages/workspace/WorkspaceHub'
import Invitations from './Pages/invitations/Invitations'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ai-ideation" element={<AIIdeation />} />
      <Route path="/workspace/:projectId/team" element={<FindTeammates />} />
      <Route path="/workspace/:projectId/hub" element={<WorkspaceHub />} />
      <Route path="/invitations" element={<Invitations />} />
    </Routes>
  )
}