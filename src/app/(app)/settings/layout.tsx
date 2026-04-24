'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { buildUserInfo } from '@/lib/auth/user-roles'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const settingsNav = [
  { href: '/settings/netsuite', label: 'NetSuite' },
  { href: '/settings/linear', label: 'Linear' },
  { href: '/settings/users', label: 'User Management' },
  { href: '/settings/segments', label: 'Segments' },
  { href: '/settings/sync-logs', label: 'Sync Logs' },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [devUser, setDevUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  // Load dev user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('devUser')
    if (saved) {
      try {
        setDevUser(JSON.parse(saved))
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Detect admin role
  useEffect(() => {
    const email = devUser?.email || session?.user?.email
    const name = devUser?.name || session?.user?.name
    const userInfo = buildUserInfo(email, name, email || '')
    setIsAdmin(userInfo.role === 'admin')
  }, [devUser, session])

  // Redirect non-admins
  if (!isAdmin && devUser) {
    redirect('/dashboard')
  }

  return (
    <div className="flex gap-6 p-6">
      {/* Sidebar Nav */}
      <div className="w-48 flex-shrink-0">
        <div className="bg-white p-4 rounded-lg border sticky top-6">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Settings</p>
          <nav className="space-y-1">
            {settingsNav.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}
