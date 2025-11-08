import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Toaster } from '@/components/ui/sonner'

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/login" className="[&.active]:font-bold">
        Login
      </Link>{" "}
      <Link to="/register" className="[&.active]:font-bold">
        Register
      </Link>{" "}
      <Link to="/verify" className="[&.active]:font-bold">
        Verify Email
      </Link>{" "}
      <Link to="/forgot-password" className="[&.active]:font-bold">
        Forgot Password
      </Link>{" "}
      <Link to="/reset-password" className="[&.active]:font-bold">
        Reset Password
      </Link>{" "}
    </div>
    <hr />
    <Outlet />
    <Toaster richColors />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRoute({ component: RootLayout })