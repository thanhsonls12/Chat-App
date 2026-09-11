import { useFriendStore } from '@/stores/useFriendStore'
import FriendRequestItem from './FriendRequestItem'
import { useI18n } from '@/i18n'

export default function SentRequests() {
  const { t } = useI18n()
  const { sentList } = useFriendStore()
  if (!sentList || sentList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('noSentRequests')}
      </p>
    )
  }
  return (
    <div className="mt-4 max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
      {sentList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          type="sent"
          actions={
            <p className="text-sm text-muted-foreground">{t('awaitingReply')}</p>
          }
        />
      ))}
    </div>
  )
}
