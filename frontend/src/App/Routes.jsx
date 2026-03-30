// app/Routes.jsx - Route definitions (used as reference; routing handled in App.jsx)

import Landing from '../Pages/Landing'
import AuthPage from '../Pages/user/AuthPage'
import Profile from '../Pages/user/Profile'
import Dashboard from '../Pages/dashboard/Dashboard'

export const publicRoutes = [
  { path: '/', element: <Landing /> },
  { path: '/auth', element: <AuthPage /> },
]

export const protectedRoutes = [
  { path: '/profile', element: <Profile /> },
  { path: '/dashboard', element: <Dashboard /> },
]