'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, User, Shield } from 'lucide-react'

const DEMO_USERS = [
  { name: 'Christine', email: 'christine@gobolt.com', role: 'Admin', icon: Shield },
  { name: 'Sajjad', email: 'sajjad@gobolt.com', role: 'AR Rep', icon: User },
  { name: 'Yuliia', email: 'yuliia@gobolt.com', role: 'AR Rep', icon: User },
  { name: 'Baz', email: 'baz@gobolt.com', role: 'AR Rep', icon: User },
  { name: 'Rakshita', email: 'rakshita@gobolt.com', role: 'AR Rep', icon: User },
]

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function LoginPage() {
  const router = useRouter()

  function demoLogin(user: typeof DEMO_USERS[number]) {
    localStorage.setItem('devUser', JSON.stringify({ name: user.name, email: user.email }))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold">Bills Collections</h1>
          </div>
          <div>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>AR Collections & Performance Portal</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full"
          >
            Sign in with Google Workspace
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Sign in with your GoBolt Google Workspace account
          </p>

          {isDemoMode && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-400">or continue as demo user</span>
                </div>
              </div>

              <div className="space-y-2">
                {DEMO_USERS.map((user) => {
                  const Icon = user.icon
                  return (
                    <button
                      key={user.name}
                      onClick={() => demoLogin(user)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className={`p-1.5 rounded-full ${user.role === 'Admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        <Icon className={`h-3.5 w-3.5 ${user.role === 'Admin' ? 'text-purple-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Demo mode — no data is saved
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
