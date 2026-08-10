import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'

export default function Logout() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/signin')
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <Button onClick={handleLogout} variant="completeGhost">
      <LogOut className="text-destructive" />
      Log Out
    </Button>
  )
}
