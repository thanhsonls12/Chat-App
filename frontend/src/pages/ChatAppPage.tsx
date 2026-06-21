import Logout from '@/components/auth/Logout'
import { useAuthStore } from '@/stores/useAuthStore'

export default function ChatAppPage() {
  const user = useAuthStore((state) => state.user)
  return (
    <div>
      {user?.username}
      {<Logout />}
    </div>
  )
}
