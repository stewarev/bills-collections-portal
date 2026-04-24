'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, Settings } from 'lucide-react'

interface DevUser {
  name: string
  email: string
  role: 'admin' | 'rep'
}

const DEV_USERS: DevUser[] = [
  { name: 'Christine', email: 'christine@gobolt.com', role: 'admin' },
  { name: 'Sajjad', email: 'sajjad@gobolt.com', role: 'rep' },
  { name: 'Yuliia', email: 'yuliia@gobolt.com', role: 'rep' },
  { name: 'Baz', email: 'baz@gobolt.com', role: 'rep' },
  { name: 'Rakshita', email: 'rakshita@gobolt.com', role: 'rep' },
]

export function DevUserSwitcher() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<DevUser | null>(null)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Check if we're in development mode
    const devMode = process.env.NODE_ENV === 'development'
    setIsDev(devMode)

    // Load saved dev user from localStorage
    if (devMode) {
      const savedUser = localStorage.getItem('devUser')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as DevUser
          setCurrentUser(user)
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [])

  const handleSwitchUser = (user: DevUser) => {
    setCurrentUser(user)
    localStorage.setItem('devUser', JSON.stringify(user))
    setIsOpen(false)

    // Show confirmation
    alert(`Switched to ${user.name} (${user.role})`)

    // Reload page to apply new role
    window.location.reload()
  }

  // Only show in development mode
  if (!isDev) {
    return null
  }

  // In dev mode, show switcher even without session (useful for testing before Google OAuth)

  const displayName = currentUser?.name || session?.user?.name || 'Unknown'
  const role = currentUser?.role || 'unknown'

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg text-sm font-medium text-yellow-900 hover:bg-yellow-200 transition-colors"
          title="Dev Mode: Switch user for testing"
        >
          <Settings className="h-4 w-4" />
          <span>{displayName} ({role})</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {isOpen && (
          <Card className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-white border-2 border-yellow-400">
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase">Switch User (Dev)</p>
              {DEV_USERS.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleSwitchUser(user)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    currentUser?.email === user.email
                      ? 'bg-yellow-100 text-yellow-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.role}</div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
