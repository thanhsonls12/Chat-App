import { useCallStore } from '@/stores/useCallStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import UserAvatar from '../chat/UserAvatar'
import { Phone, PhoneOff } from 'lucide-react'
import { useI18n } from '@/i18n'

export default function IncomingCallDialog() {
  const { status, peer, acceptCall, rejectCall } = useCallStore()
  const { t } = useI18n()
  const open = status === 'incoming'

  if (!open || !peer) return null

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[360px] border-none"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('incomingVideoCall')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <UserAvatar
            type="profile"
            name={peer.displayName}
            avatarUrl={peer.avatarUrl}
          />
          <p className="text-lg font-semibold">{peer.displayName}</p>
          <p className="text-sm text-muted-foreground motion-safe:animate-pulse">
            {t('callingYou')}
          </p>
        </div>
        <div className="flex justify-center gap-8 pb-2">
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full size-14 bg-red-600 text-white transition-transform duration-150 hover:bg-red-700 active:scale-95 motion-reduce:transition-none"
            onClick={rejectCall}
          >
            <PhoneOff className="size-6" />
          </Button>
          <Button
            size="icon"
            className="rounded-full size-14 bg-green-600 text-white transition-transform duration-150 hover:bg-green-700 active:scale-95 motion-reduce:transition-none"
            onClick={() => void acceptCall()}
          >
            <Phone className="size-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
