import { useAuthStore } from '@/stores/useAuthStore'
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'

export default function ProtectedRoute() {
  const { accessToken, loading, fetchMe, refresh } = useAuthStore()

  const [starting, setStarting] = useState(true)

  useEffect(() => {
    let ignore = false

    const init = async () => {
      if (!useAuthStore.getState().accessToken) {
        await refresh()
      }

      const auth = useAuthStore.getState()
      if (auth.accessToken && !auth.user) {
        await fetchMe()
      }

      if (!ignore) {
        setStarting(false)
      }
    }

    void init()

    return () => {
      ignore = true
    }
  }, [fetchMe, refresh])

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />
  }
  return <Outlet />
}
