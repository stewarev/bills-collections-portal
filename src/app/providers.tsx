'use client'

import { SessionProvider } from 'next-auth/react'
import { DevUserSwitcher } from '@/components/shared/dev-user-switcher'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <DevUserSwitcher />
    </SessionProvider>
  )
}
