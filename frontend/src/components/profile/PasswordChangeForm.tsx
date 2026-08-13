import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useUserStore } from '@/stores/useUserStore'
import { Button } from '../ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      .max(50, 'Mật khẩu mới tối đa 50 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .superRefine(({ currentPassword, newPassword, confirmPassword }, context) => {
    if (newPassword === currentPassword) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
      })
    }
    if (newPassword !== confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Mật khẩu xác nhận không khớp',
      })
    }
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export default function PasswordChangeForm() {
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
          Đổi mật khẩu
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Các phiên đăng nhập trên thiết bị khác sẽ bị thu hồi sau khi đổi mật khẩu.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Field data-invalid={Boolean(errors.currentPassword)}>
          <FieldLabel htmlFor="current-password">Mật khẩu hiện tại</FieldLabel>
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
            <FieldLabel htmlFor="new-password">Mật khẩu mới</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              {...register('newPassword')}
            />
            <FieldDescription>Từ 6 đến 50 ký tự.</FieldDescription>
            <FieldError errors={[errors.newPassword]} />
          </Field>

          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor="confirm-password">Xác nhận mật khẩu mới</FieldLabel>
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
            {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </Button>
        </div>
      </form>
    </section>
  )
}
