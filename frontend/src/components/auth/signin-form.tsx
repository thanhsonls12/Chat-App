import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router'
import { useI18n } from '@/i18n'
import { useMemo } from 'react'

export default function SigninForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { signIn } = useAuthStore()
  const navigate = useNavigate()
  const { t, language } = useI18n()

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(3, t('usernameMin')),
        password: z.string().min(6, t('passwordMin')),
      }),
    [t, language]
  )
  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ username, password }: Values) => {
    await signIn(username, password)
    navigate('/')
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden border-border p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-5 md:p-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
                </a>
                <h1 className="text-xl font-bold">{t('signInTitle')}</h1>
                <p className="text-muted-foreground text-balance">
                  {t('signInWelcome')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t('username')}</Label>
                <Input id="username" {...register('username')} />
                {errors.username && (
                  <p className="error-message">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  type="password"
                  id="password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="error-message">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {t('signIn')}
              </Button>
              <div className="text-center text-sm">
                {t('noAccount')}{' '}
                <a href="/signup" className="underline text-primary">
                  {t('signUp')}
                </a>
              </div>
              <div className="text-balance px-2 text-center text-sm text-muted-foreground">
                {t('continueNotice')}{' '}
                <a href="#" className="underline">
                  {t('terms')}
                </a>{' '}
                {t('and')}{' '}
                <a href="#" className="underline">
                  {t('privacy')}
                </a>
                .
              </div>
            </div>
          </form>
          <div className="relative hidden min-w-0 overflow-hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Chat"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
