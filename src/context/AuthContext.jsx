import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { findDriverByEmail } from '../lib/clickup'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]     = useState(undefined) // undefined = loading
  const [driver, setDriver]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadDriver(data.session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadDriver(session.user)
      else { setDriver(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadDriver(user) {
    setLoading(true)
    setAuthError(null)

    // Check our drivers table first
    const { data: existing } = await supabase
      .from('drivers')
      .select('*, driver_stats(*)')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Sync truck/trailer ClickUp IDs if not yet stored (runs once after deploy)
      if (!existing.truck_clickup_id) {
        const cd = await findDriverByEmail(user.email)
        if (cd) {
          const updates = {
            truck_clickup_id:   cd.truckTaskId   ?? null,
            trailer_clickup_id: cd.trailerTaskId ?? null,
          }
          await supabase.from('drivers').update(updates).eq('id', existing.id)
          Object.assign(existing, updates)
        }
      }
      setDriver(existing)
      setLoading(false)
      return
    }

    // Not in our table yet — look up in ClickUp by email
    const clickupDriver = await findDriverByEmail(user.email)
    if (!clickupDriver) {
      setAuthError('Your email is not registered as a driver. Contact dispatch.')
      setLoading(false)
      return
    }

    // Create driver record
    const { data: newDriver, error } = await supabase
      .from('drivers')
      .insert({
        user_id:            user.id,
        company_id:         clickupDriver.company,
        clickup_task_id:    clickupDriver.id,
        name:               clickupDriver.name,
        email:              user.email,
        is_admin:           false,
        truck_clickup_id:   clickupDriver.truckTaskId   ?? null,
        trailer_clickup_id: clickupDriver.trailerTaskId ?? null,
      })
      .select()
      .single()

    if (error || !newDriver) {
      setAuthError('Failed to register driver profile. Try again or contact dispatch.')
      setLoading(false)
      return
    }

    // Create initial stats row
    await supabase.from('driver_stats').insert({ driver_id: newDriver.id })
    setDriver({ ...newDriver, driver_stats: [{ total_points: 0, current_streak: 0, longest_streak: 0, modules_completed: 0 }] })
    setLoading(false)
  }

  async function signIn(email, password) {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    return null
  }

  async function signUp(email, password) {
    setAuthError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    return null
  }

  async function signOut() {
    await supabase.auth.signOut()
    setDriver(null)
  }

  async function refreshDriver() {
    if (!session?.user) return
    // Silent refresh — don't toggle loading state (avoids flash)
    const { data: existing } = await supabase
      .from('drivers')
      .select('*, driver_stats(*)')
      .eq('user_id', session.user.id)
      .single()
    if (existing) setDriver(existing)
  }

  const stats = driver?.driver_stats?.[0] ?? { total_points: 0, current_streak: 0, longest_streak: 0, modules_completed: 0 }

  return (
    <AuthContext.Provider value={{ session, driver, stats, loading, authError, signIn, signUp, signOut, refreshDriver }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
