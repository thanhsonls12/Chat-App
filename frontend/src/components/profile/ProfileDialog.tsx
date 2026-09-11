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
import { useI18n } from '@/i18n'

interface ProfileDialogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export default function ProfileDialog({ open, setOpen }: ProfileDialogProps) {
  const { user } = useAuthStore()
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="px-5 pt-5 sm:px-8">
          <DialogTitle>{t('profileTitle')}</DialogTitle>
          <DialogDescription>{t('profileDescription')}</DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {user ? (
            <ProfileCard user={user} />
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              {t('profileLoadFailed')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
