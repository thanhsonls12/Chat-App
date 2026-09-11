import { useFriendStore } from '@/stores/useFriendStore'
import { Card } from '../ui/card'
import { Dialog, DialogTrigger } from '../ui/dialog'
import { MessageCircle } from 'lucide-react'
import FriendListModal from '../createNewChat/FriendListModal'
import { useI18n } from '@/i18n'
import { useState } from 'react'

export default function CreateNewChat() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { getFriends } = useFriendStore()
  const handleGetFriends = async () => {
    await getFriends()
  }
  return (
    <div className="flex gap-2">
      <Card
        className="flex-1 p-3 glass hover:shadow-soft transition-smooth cursor-pointer group/card"
        onClick={handleGetFriends}
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <div className="flex items-center gap-4">
              <div className="size-8 bg-gradient-chat rounded-full flex items-center justify-center group-hover/card:scale-110 var(--transition-bounce)">
                <MessageCircle className="size-4 text-white" />
              </div>
              <span className="text-sm font-medium capitalize">
                {t('newMessage')}
              </span>
            </div>
          </DialogTrigger>
          <FriendListModal onConversationCreated={() => setOpen(false)} />
        </Dialog>
      </Card>
    </div>
  )
}
