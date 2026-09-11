import { Video } from 'lucide-react'
import { Button } from '../ui/button'
import { useCallStore } from '@/stores/useCallStore'
import type { Conversation } from '@/types/chat'
import { useI18n } from '@/i18n'

export default function CallButton({
  conversation,
}: {
  conversation: Conversation
}) {
  const { startCall, status } = useCallStore()
  const { t } = useI18n()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-sidebar-accent"
      disabled={status !== 'idle'}
      onClick={() => void startCall(conversation)}
    >
      <Video className="size-4" />
      <span className="sr-only">{t('videoCall')}</span>
    </Button>
  )
}
