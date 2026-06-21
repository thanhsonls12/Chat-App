import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router'

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
  return <Button onClick={handleLogout}>Logout</Button>
}
