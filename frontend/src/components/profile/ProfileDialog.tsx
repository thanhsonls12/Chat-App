import type { Dispatch, SetStateAction } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import ProfileCard from './ProfileCard'
import { useAuthStore } from '@/stores/useAuthStore'

interface ProfileDialogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export default function ProfileDialog({ open, setOpen }: ProfileDialogProps) {
  const { user } = useAuthStore()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="px-5 pt-5 sm:px-8">
          <DialogTitle>Thông tin cá nhân</DialogTitle>
          <DialogDescription>
            Xem và cập nhật thông tin hiển thị của tài khoản.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {user ? (
            <ProfileCard user={user} />
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Không thể tải thông tin người dùng.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
