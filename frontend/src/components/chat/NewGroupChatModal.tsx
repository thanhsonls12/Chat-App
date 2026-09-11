import { useFriendStore } from '@/stores/useFriendStore'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { User, UserPlus } from 'lucide-react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import type { Friend } from '@/types/user'
import InviteSuggestionList from '../newGroupChat/InviteSuggestionList'
import SelectedUsersList from '../newGroupChat/SelectedUsersList'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'
import { useChatStore } from '@/stores/useChatStore'

export default function NewGroupChatModal() {
  const { t } = useI18n()
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')
  const { friends, getFriends } = useFriendStore()
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([])
  const { createConversation, loading } = useChatStore()
  const handleGetFriends = async () => {
    await getFriends()
  }

  const handleSelectFriend = (friend: Friend) => {
    setInvitedUsers((current) =>
      current.some((user) => user._id === friend._id)
        ? current
        : [...current, friend]
    )
    setSearch('')
  }

  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers((current) =>
      current.filter((user) => user._id !== friend._id)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault()
      if (invitedUsers.length === 0) {
        toast.warning(t('inviteAtLeastOne'))
        return
      }
      await createConversation(
        'group',
        groupName,
        invitedUsers.map((u) => u._id)
      )
      setSearch('')
      setInvitedUsers([])
      setGroupName('')
    } catch {
      toast.error(t('createGroupFailed'))
    }
  }

  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !invitedUsers.some((u) => u._id === friend._id)
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          onClick={handleGetFriends}
          className="flex z-10 justify-center items-center size-5 rounded-full hover:bg-sidebar-accent transition cursor-pointer"
        >
          <User className="size-4" />
          <span className="sr-only">{t('createGroup')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle className="capitalize">{t('newGroupChat')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-semibold ">
              {t('groupName')}
            </Label>
            <Input
              id="groupName"
              placeholder={t('groupNamePlaceholder')}
              className="glass border-border/50 focus:border-primary/50 transition-smooth"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite" className="text-sm font-semibold">
              {t('inviteMembers')}
            </Label>
            <Input
              id="invite"
              placeholder={t('searchDisplayName')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && filteredFriends.length > 0 && (
              <InviteSuggestionList
                filteredFriends={filteredFriends}
                onSelect={handleSelectFriend}
              />
            )}

            <SelectedUsersList
              invitedUsers={invitedUsers}
              onRemove={handleRemoveFriend}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
            >
              {loading ? (
                <span>{t('creating')}</span>
              ) : (
                <>
                  <UserPlus className="size-4 mr-2" />
                  {t('createGroup')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
