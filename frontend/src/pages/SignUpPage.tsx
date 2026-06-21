import { SignupForm } from '@/components/auth/signup-form'

export default function SignUpPage() {
  return (
    <div className="absolute inset-0 z-0 flex h-svh flex-col items-center justify-center overflow-hidden bg-muted bg-gradient-purple p-4 md:p-6">
      <div className="max-h-full w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
