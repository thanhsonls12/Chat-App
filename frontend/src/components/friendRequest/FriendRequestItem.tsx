import type { FriendRequest } from '@/types/user'
import UserAvatar from '../chat/UserAvatar'

interface RequestItemProps {
  requestInfo: FriendRequest
  actions: React.ReactNode
  type: 'sent' | 'received'
}
export default function FriendRequestItem({
  actions,
  requestInfo,
  type,
}: RequestItemProps) {
  if (!requestInfo) return
  const info = type === 'sent' ? requestInfo.to : requestInfo.from
  if (!info) return

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          type="sidebar"
          name={info.displayName}
          avatarUrl={info.avatarUrl}
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{info.displayName}</p>
          <p className="truncate text-sm text-muted-foreground">
            @{info.username}
          </p>
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">{actions}</div>
    </div>
  )
}
