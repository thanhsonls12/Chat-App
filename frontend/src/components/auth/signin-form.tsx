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

const signInSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type SignInFormValue = z.infer<typeof signInSchema>

export default function SigninForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { signIn } = useAuthStore()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValue>({
    resolver: zodResolver(signInSchema),
  })
  const onSubmit = async (data: SignInFormValue) => {
    const { username, password } = data
    await signIn(username, password)
    navigate('/')
  }
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden border-border p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-5 md:p-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              {/* Logo */}
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
                </a>
                <h1 className="text-xl font-bold">Đăng nhập Chat</h1>
                <p className="text-muted-foreground text-balance">
                  Chào mừng bạn! Hãy đăng nhập để bắt đầu
                </p>
              </div>

              {/* Email & Password */}
              <div className="flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="username" className="block text-sm">
                    Tên đăng nhập
                  </Label>
                  <Input type="text" id="username" {...register('username')} />
                  {errors.username && (
                    <p className="error-message">{errors.username.message}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm">
                    Mật khẩu
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
                Đăng nhập
              </Button>
              <div className="text-center text-sm ">
                Chưa có tài khoản?{' '}
                <a
                  href="/signup"
                  className="underline underline-offset-4 text-primary"
                >
                  Đăng ký
                </a>
              </div>
              <div className="text-balance px-2 text-center text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary">
                Bằng cách tiếp tục, bạn đồng ý với{' '}
                <a href="#">Điều khoản dịch vụ</a> và{' '}
                <a href="#">Chính sách bảo mật</a> của chúng tôi.
              </div>
            </div>
          </form>
          <div className="relative hidden min-w-0 overflow-hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
