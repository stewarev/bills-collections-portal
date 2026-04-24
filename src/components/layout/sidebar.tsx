'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { buildUserInfo } from '@/lib/auth/user-roles'
import {
  LayoutDashboard,
  Users,
  Phone,
  FileText,
  DollarSign,
  BarChart3,
  CalendarDays,
  Settings2,
  Database,
  Sliders,
  GitBranch,
  ScrollText,
  Handshake,
} from 'lucide-react'

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/promises', label: 'Promises', icon: Handshake },
  { href: '/collection-log', label: 'Collection Log', icon: Phone },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

const adminNavItems = [
  { href: '/calendar', label: 'AR Calendar', icon: CalendarDays },
  { href: '/settings/netsuite', label: 'NetSuite', icon: Database },
  { href: '/settings/linear', label: 'Linear', icon: GitBranch },
  { href: '/settings/users', label: 'User Management', icon: Users },
  { href: '/settings/segments', label: 'Segments', icon: Sliders },
  { href: '/settings/sync-logs', label: 'Sync Logs', icon: ScrollText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [devUser, setDevUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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

  return (
    <aside className="w-60 min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-400" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">Bills Collections</p>
            <p className="text-slate-400 text-xs">AR Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main Nav */}
        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="px-3 py-4 mt-4 border-t border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase">Admin</p>
            </div>
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Logged in as</p>
        <p className="text-xs text-slate-600">User (to be connected)</p>
      </div>
    </aside>
  )
}
