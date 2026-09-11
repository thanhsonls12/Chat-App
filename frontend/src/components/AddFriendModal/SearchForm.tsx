import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { IFormValues } from '../chat/AddFriendModal'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { DialogClose, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Search } from 'lucide-react'
import { useI18n } from '@/i18n'

interface SearchFormProps {
  register: UseFormRegister<IFormValues>
  errors: FieldErrors<IFormValues>
  loading: boolean
  usernameValue: string
  isFound: boolean | null
  searchedUsername: string
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export default function SearchForm({
  errors,
  isFound,
  loading,
  onSubmit,
  onCancel,
  register,
  searchedUsername,
  usernameValue,
}: SearchFormProps) {
  const { t } = useI18n()
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-semibold">
          {t('searchByUsername')}
        </Label>
        <Input
          id="username"
          placeholder={t('searchUsernamePlaceholder')}
          className="glass border-border/50 focus:border-primary/50 transition-smooth"
          {...register('username', {
            required: t('usernameRequired'),
            minLength: {
              value: 3,
              message: t('usernameMin'),
            },
            maxLength: {
              value: 50,
              message: t('usernameMax'),
            },
          })}
        />
        {errors.username && (
          <p className="error-message">{errors.username.message}</p>
        )}
        {isFound === false && (
          <span className="error-message">
            {t('notFound')}
            <span className="font-semibold"> @{searchedUsername}</span>
          </span>
        )}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass hover:text-destructive"
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={loading || !usernameValue.trim()}
          className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
        >
          {loading ? (
            <span>{t('searching')}</span>
          ) : (
            <>
              <Search className="size-4 mr-2" />
              {t('search')}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
