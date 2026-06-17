import { useAuth } from './auth/AuthProvider'
import Login from './screens/Login'
import Collection from './screens/Collection'

export default function App() {
  const { session, loading } = useAuth()
  if (loading) return <div className="loading">Loading…</div>
  if (!session) return <Login />
  return <Collection />
}
