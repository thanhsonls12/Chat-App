import { Badge } from '../ui/badge'

export default function UnreadCountBadge({
  unreadCount,
}: {
  unreadCount: number
}) {
  return (
    <div className="pulse-ring absolute z-20 -top-1 -right-1">
      <Badge className="size-5 text-xs bg-gradient-chat border border-background">
        {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
    </div>
  )
}
