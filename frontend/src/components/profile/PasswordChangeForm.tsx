import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMemo } from 'react'

import { useUserStore } from '@/stores/useUserStore'
import { Button } from '../ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { useI18n } from '@/i18n'

export default function PasswordChangeForm() {
  const { t } = useI18n()
  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t('currentPasswordRequired')),
          newPassword: z
            .string()
            .min(6, t('newPasswordMin'))
            .max(50, t('newPasswordMax')),
          confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
        })
        .superRefine(({ currentPassword, newPassword, confirmPassword }, context) => {
          if (newPassword === currentPassword) {
            context.addIssue({
              code: 'custom',
              path: ['newPassword'],
              message: t('passwordMustDiffer'),
            })
          }
          if (newPassword !== confirmPassword) {
            context.addIssue({
              code: 'custom',
              path: ['confirmPassword'],
              message: t('passwordMismatch'),
            })
          }
        }),
    [t]
  )
  type PasswordFormValues = z.infer<typeof passwordSchema>
  const { changePassword, changingPassword } = useUserStore()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async ({ currentPassword, newPassword }: PasswordFormValues) => {
    await changePassword({ currentPassword, newPassword })
    reset()
  }

  return (
    <section className="mt-8 border-t pt-6">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <KeyRound className="size-4" />
          {t('changePassword')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('passwordSessionNotice')}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field data-invalid={Boolean(errors.currentPassword)}>
          <FieldLabel htmlFor="current-password">{t('currentPassword')}</FieldLabel>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            {...register('currentPassword')}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.newPassword)}>
            <FieldLabel htmlFor="new-password">{t('newPassword')}</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              {...register('newPassword')}
            />
            <FieldDescription>{t('passwordRange')}</FieldDescription>
            <FieldError errors={[errors.newPassword]} />
          </Field>

          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor="confirm-password">{t('confirmPassword')}</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={changingPassword}>
            {changingPassword && <LoaderCircle className="animate-spin" />}
            {changingPassword ? t('changingPassword') : t('changePassword')}
          </Button>
        </div>
      </form>
    </section>
  )
}
