import { useUserStore } from '@/stores/useUserStore'
import { useRef } from 'react'
import { Button } from '../ui/button'
import { Camera, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024

export default function AvatarUploader() {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateAvatarUrl, uploadingAvatar } = useUserStore()
  const handleClick = () => {
    fileInputRef.current?.click()
  }
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('chooseAvatarImage'))
      e.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(t('avatarTooLarge'))
      e.target.value = ''
      return
    }
    const formData = new FormData()
    formData.append('file', file)

    try {
      await updateAvatarUrl(formData)
    } finally {
      e.target.value = ''
    }
  }
  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        onClick={handleClick}
        disabled={uploadingAvatar}
        aria-label={t('changeAvatar')}
        className="absolute -bottom-2 -right-2 size-9 rounded-full shadow-md hover:scale-115 transition duration-300 hover:bg-background"
      >
        {uploadingAvatar ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
      </Button>
      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileInputRef}
        onChange={handleUpload}
      />
    </>
  )
}
