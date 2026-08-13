import { UserPlus } from 'lucide-react'
import { Button } from '../ui/button'
import { DialogFooter } from '../ui/dialog'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { IFormValues } from '../chat/AddFriendModal'

interface SendRequestProps {
  register: UseFormRegister<IFormValues>
  errors: FieldErrors<IFormValues>
  loading: boolean
  searchedUsername: string
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export default function SendFriendRequestForm({
  errors,
  loading,
  onBack,
  register,
  searchedUsername,
  onSubmit,
}: SendRequestProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <span className="success-message">
          Tìm Thấy <span className="font-semibold">@{searchedUsername}</span>
        </span>
        <div className="space-y-4">
          <Label htmlFor="message" className="text-sm font-semibold">
            Giới Thiệu
          </Label>
          <Textarea
            id="message"
            rows={3}
            placeholder="Chào bạn, có thể kết bạn được không!"
            className="glass border-border/50 focus:border-primary/50 transition-smooth resize-none"
            {...register('message', {
              maxLength: {
                value: 300,
                message: 'Lời giới thiệu chỉ được tối đa 300 ký tự',
              },
            })}
          />
          {errors.message && (
            <p className="error-message">{errors.message.message}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass hover:text-destructive"
            onClick={onBack}
          >
            Quay Lại
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
          >
            {loading ? (
              <span>Đang Gửi...</span>
            ) : (
              <>
                <UserPlus className="size-4 mr-2" /> Kết Bạn
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </form>
  )
}
