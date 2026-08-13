import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { User } from '@/types/user'
import { useSocketStore } from '@/stores/useSocketStore'
import { useUserStore } from '@/stores/useUserStore'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import UserAvatar from '../chat/UserAvatar'
import AvatarUploader from './AvatarUploader'
import PasswordChangeForm from './PasswordChangeForm'

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Tên hiển thị không được để trống')
    .max(100, 'Tên hiển thị tối đa 100 ký tự'),
  bio: z.string().trim().max(500, 'Giới thiệu tối đa 500 ký tự'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?[0-9\s().-]{7,20}$/.test(value),
      'Số điện thoại không hợp lệ'
    ),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileCardProps {
  user: User
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const onlineUsers = useSocketStore((state) => state.onlineUsers)
  const { updateProfile, updatingProfile } = useUserStore()
  const isOnline = onlineUsers.includes(user._id)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio ?? '',
      phone: user.phone ?? '',
    },
  })

  useEffect(() => {
    reset({
      displayName: user.displayName,
      bio: user.bio ?? '',
      phone: user.phone ?? '',
    })
  }, [reset, user])

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfile(values)
    reset(values)
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 sm:h-36">
        <div className="absolute -bottom-12 left-5 flex items-end gap-4 sm:left-8">
          <div className="relative">
            <UserAvatar
              type="profile"
              name={user.displayName}
              avatarUrl={user.avatarUrl}
              className="ring-4 ring-background shadow-lg"
            />
            <AvatarUploader />
          </div>
          <Badge
            className={cn(
              'mb-2 flex items-center gap-1.5',
              isOnline
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                isOnline ? 'animate-pulse bg-green-500' : 'bg-slate-500'
              )}
            />
            {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
          </Badge>
        </div>
      </div>

      <CardContent className="px-5 pb-5 pt-16 sm:px-8 sm:pb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{user.displayName}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="profile-username">Tên đăng nhập</FieldLabel>
              <Input id="profile-username" value={user.username} disabled />
              <FieldDescription>Không thể thay đổi tên đăng nhập.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" type="email" value={user.email} disabled />
              <FieldDescription>Email đang liên kết với tài khoản.</FieldDescription>
            </Field>
          </div>

          <Field data-invalid={Boolean(errors.displayName)}>
            <FieldLabel htmlFor="profile-display-name">Tên hiển thị</FieldLabel>
            <Input
              id="profile-display-name"
              maxLength={100}
              aria-invalid={Boolean(errors.displayName)}
              {...register('displayName')}
            />
            <FieldError errors={[errors.displayName]} />
          </Field>

          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel htmlFor="profile-phone">Số điện thoại</FieldLabel>
            <Input
              id="profile-phone"
              type="tel"
              maxLength={20}
              placeholder="Ví dụ: +84 912 345 678"
              aria-invalid={Boolean(errors.phone)}
              {...register('phone')}
            />
            <FieldError errors={[errors.phone]} />
          </Field>

          <Field data-invalid={Boolean(errors.bio)}>
            <FieldLabel htmlFor="profile-bio">Giới thiệu</FieldLabel>
            <Textarea
              id="profile-bio"
              rows={4}
              maxLength={500}
              placeholder="Chia sẻ đôi chút về bạn..."
              aria-invalid={Boolean(errors.bio)}
              {...register('bio')}
            />
            <FieldDescription>Tối đa 500 ký tự.</FieldDescription>
            <FieldError errors={[errors.bio]} />
          </Field>

          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={!isDirty || updatingProfile}>
              {updatingProfile ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
        <PasswordChangeForm />
      </CardContent>
    </Card>
  )
}
