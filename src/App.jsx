import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import DriverApp from './pages/DriverApp'
import AdminApp from './pages/AdminApp'

function Inner() {
  const { session, driver, loading } = useAuth()

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">🚛</div>
        <div className="splash-spinner" />
      </div>
    )
  }

  if (!session) return <Login />
  if (!driver)  return <Login />
  if (driver.is_admin) return <AdminApp />
  return <DriverApp />
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
