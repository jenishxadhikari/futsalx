import { createFileRoute } from '@tanstack/react-router'

import { VerifyEmailForm } from '@/features/auth/components/verify-email-form'

export const Route = createFileRoute('/(auth)/verify')({
  component: RouteComponent,
})

function RouteComponent() {
  return <VerifyEmailForm />
}
