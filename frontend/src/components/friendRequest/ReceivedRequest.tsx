import { useFriendStore } from '@/stores/useFriendStore'
import FriendRequestItem from './FriendRequestItem'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'

export default function ReceivedRequest() {
  const { t } = useI18n()
  const { acceptRequest, declineRequest, loading, receivedList } =
    useFriendStore()
  if (!receivedList || receivedList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('noReceivedRequests')}
      </p>
    )
  }
  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId)
      toast.success(t('friendAccepted'))
    } catch (error) {
      console.error(error)
      toast.error(t('friendAcceptFailed'))
    }
  }

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId)
      toast.info(t('friendDeclined'))
    } catch (error) {
      console.error(error)
      toast.error(t('friendDeclineFailed'))
    }
  }
  return (
    <div className="mt-4 max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
      {receivedList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          actions={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAccept(req._id)}
                disabled={loading}
              >
                {t('accept')}
              </Button>
              <Button
                size="sm"
                variant="destructiveOutline"
                onClick={() => handleDecline(req._id)}
                disabled={loading}
              >
                {t('decline')}
              </Button>
            </div>
          }
          type="received"
        />
      ))}
    </div>
  )
}
