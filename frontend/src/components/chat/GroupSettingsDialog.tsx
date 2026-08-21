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
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Check, LogOut, Pencil, Settings, UserMinus, UserPlus, X } from 'lucide-react'
import type { Conversation } from '@/types/chat'
import type { Friend } from '@/types/user'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore'
import { useFriendStore } from '@/stores/useFriendStore'
import UserAvatar from './UserAvatar'
import InviteSuggestionList from '../newGroupChat/InviteSuggestionList'
import SelectedUsersList from '../newGroupChat/SelectedUsersList'
import { toast } from 'sonner'

export default function GroupSettingsDialog({
  conversation,
}: {
  conversation: Conversation
}) {
  const { user } = useAuthStore()
  const { friends, getFriends } = useFriendStore()
  const { addGroupMembers, removeGroupMember, leaveGroup, updateGroup } =
    useChatStore()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(conversation.group.name ?? '')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [search, setSearch] = useState('')
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([])
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [busy, setBusy] = useState(false)

  const conversationId = conversation._id
  const isAdmin = conversation.group.createdBy === user?._id

  const handleOpenChange = (open: boolean) => {
    if (open) void getFriends()
    if (!open) {
      setEditingName(false)
      setShowAddPanel(false)
      setSearch('')
      setInvitedUsers([])
      setConfirmingLeave(false)
    }
  }

  const handleSaveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === conversation.group.name) {
      setEditingName(false)
      return
    }
    try {
      setBusy(true)
      await updateGroup(conversationId, trimmed)
      setEditingName(false)
    } catch {
      toast.error('Không thể đổi tên nhóm. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddMembers = async () => {
    if (invitedUsers.length === 0) return
    try {
      setBusy(true)
      await addGroupMembers(
        conversationId,
        invitedUsers.map((u) => u._id)
      )
      setInvitedUsers([])
      setSearch('')
      setShowAddPanel(false)
      toast.success('Đã thêm thành viên vào nhóm')
    } catch {
      toast.error('Không thể thêm thành viên. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const handleKick = async (memberId: string) => {
    try {
      setBusy(true)
      await removeGroupMember(conversationId, memberId)
    } catch {
      toast.error('Không thể xoá thành viên. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    try {
      setBusy(true)
      await leaveGroup(conversationId)
      toast.success('Bạn đã rời khỏi nhóm')
    } catch {
      toast.error('Không thể rời nhóm. Vui lòng thử lại.')
      setBusy(false)
    }
  }

  const selectFriend = (friend: Friend) => {
    setInvitedUsers((current) =>
      current.some((u) => u._id === friend._id) ? current : [...current, friend]
    )
    setSearch('')
  }

  const removeInvited = (friend: Friend) => {
    setInvitedUsers((current) => current.filter((u) => u._id !== friend._id))
  }

  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName.toLowerCase().includes(search.toLowerCase()) &&
      !conversation.participants.some((p) => p._id === friend._id) &&
      !invitedUsers.some((u) => u._id === friend._id)
  )

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-sidebar-accent"
        >
          <Settings className="size-4" />
          <span className="sr-only">Cài đặt nhóm</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] border-none">
        <DialogHeader>
          <DialogTitle>Thông tin nhóm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Tên nhóm</label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  onClick={handleSaveName}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setNameValue(conversation.group.name ?? '')
                    setEditingName(false)
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-medium">{conversation.group.name}</span>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setNameValue(conversation.group.name ?? '')
                      setEditingName(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">
                Thành viên ({conversation.participants.length})
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddPanel((v) => !v)}
              >
                <UserPlus className="size-4 mr-1" />
                Thêm
              </Button>
            </div>

            {showAddPanel && (
              <div className="space-y-2 rounded-lg border p-2">
                <Input
                  placeholder="Tìm bạn bè theo tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <InviteSuggestionList
                    filteredFriends={filteredFriends}
                    onSelect={selectFriend}
                  />
                )}
                <SelectedUsersList
                  invitedUsers={invitedUsers}
                  onRemove={removeInvited}
                />
                {invitedUsers.length > 0 && (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={busy}
                    onClick={handleAddMembers}
                  >
                    Thêm {invitedUsers.length} thành viên
                  </Button>
                )}
              </div>
            )}

            <div className="max-h-[240px] overflow-y-auto divide-y">
              {conversation.participants.map((member) => {
                const memberIsAdmin =
                  conversation.group.createdBy === member._id
                const canKick =
                  isAdmin && member._id !== user?._id && !memberIsAdmin
                return (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 py-2"
                  >
                    <UserAvatar
                      type="chat"
                      name={member.displayName}
                      avatarUrl={member.avatarUrl}
                    />
                    <span className="flex-1 font-medium truncate">
                      {member.displayName}
                      {member._id === user?._id && ' (Bạn)'}
                    </span>
                    {memberIsAdmin && <Badge variant="secondary">Admin</Badge>}
                    {canKick && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => handleKick(member._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          {confirmingLeave ? (
            <div className="flex w-full gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={busy}
                onClick={handleLeave}
              >
                Xác nhận rời nhóm
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmingLeave(false)}
              >
                Huỷ
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setConfirmingLeave(true)}
            >
              <LogOut className="size-4 mr-2" />
              Rời nhóm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
