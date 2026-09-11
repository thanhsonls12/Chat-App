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
import { LoaderCircle } from 'lucide-react'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { signUp } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useI18n()
  const signUpSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(1, t('firstNameRequired')),
        lastName: z.string().min(1, t('lastNameRequired')),
        username: z.string().min(3, t('usernameMin')),
        email: z.email(t('emailInvalid')),
        password: z.string().min(6, t('passwordMin')),
      }),
    [t]
  )
  type SignUpFormValue = z.infer<typeof signUpSchema>
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValue>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpFormValue) => {
    const { firstName, lastName, username, email, password } = data

    await signUp(username, password, email, firstName, lastName)

    navigate('/signin')
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
                <h1 className="text-xl font-bold">{t('signUpTitle')}</h1>
                <p className="text-muted-foreground text-balance">
                  {t('signUpWelcome')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="block text-sm">
                    {t('lastName')}
                  </Label>
                  <Input type="text" id="lastName" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="error-message">{errors.lastName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="block text-sm">
                    {t('firstName')}
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="error-message">{errors.firstName.message}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="username" className="block text-sm">
                    {t('username')}
                  </Label>
                  <Input type="text" id="username" {...register('username')} />
                  {errors.username && (
                    <p className="error-message">{errors.username.message}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm">
                    {t('email')}
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="example@gmail.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="error-message">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm">
                    {t('password')}
                  </Label>
                  <Input
                    type="password"
                    id="password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="error-message">{errors.password.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="animate-spin" />}
                {isSubmitting ? t('signingUp') : t('createAccount')}
              </Button>
              <div className="text-center text-sm ">
                {t('haveAccount')}{' '}
                <a
                  href="/signin"
                  className="underline underline-offset-4 text-primary"
                >
                  {t('signIn')}
                </a>
              </div>
              <div className="text-balance px-2 text-center text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
                {t('continueNotice')}{' '}
                <span className="font-medium">{t('terms')}</span> {t('and')}{' '}
                <span className="font-medium">{t('privacy')}</span> {t('ourSuffix')}
              </div>
            </div>
          </form>
          <div className="relative hidden min-w-0 overflow-hidden bg-muted md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
