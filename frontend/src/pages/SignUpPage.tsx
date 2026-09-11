import { SignupForm } from '@/components/auth/signup-form'

export default function SignUpPage() {
  return (
    <div className="absolute inset-0 z-0 flex min-h-svh flex-col items-center overflow-y-auto bg-muted bg-gradient-purple p-4 md:p-6">
      <div className="my-auto w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
