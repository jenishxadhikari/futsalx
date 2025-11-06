import { createFileRoute } from '@tanstack/react-router'

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'

export const Route = createFileRoute('/(auth)/reset-password')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ResetPasswordForm />
}
