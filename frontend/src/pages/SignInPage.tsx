import SigninForm from '@/components/auth/signin-form'

export default function SignInPage() {
  return (
    <div className="absolute inset-0 z-0 flex h-svh flex-col items-center justify-center overflow-hidden bg-muted bg-gradient-purple p-4 md:p-6">
      <div className="max-h-full w-full max-w-sm md:max-w-4xl">
        <SigninForm />
      </div>
    </div>
  )
}
