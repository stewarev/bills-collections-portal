import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // TODO: Week 1 - Add logic to:
      // 1. Check if user exists in our users table
      // 2. Create user if they don't exist
      // 3. Verify email is from Google Workspace domain (optional security)

      // For now: allow all Google Workspace signins
      // In production, check email domain or user list
      if (!user.email) return false

      // TODO: Create/fetch user from Supabase users table
      // const { data: existingUser } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('email', user.email)
      //   .single()
      //
      // if (!existingUser) {
      //   await supabase.from('users').insert([{
      //     email: user.email,
      //     name: user.name,
      //     role: 'staff', // Default role, admin must be set manually
      //     is_active: true,
      //   }])
      // }

      return true
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`
    },
    async session({ session, user, token }) {
      // Ensure session has user data from token
      if (session.user && token.name) {
        session.user.name = token.name as string
      }
      if (session.user && token.email) {
        session.user.email = token.email as string
      }

      // TODO: Fetch role from Supabase users table
      // const { data: dbUser } = await supabase
      //   .from('users')
      //   .select('role, id')
      //   .eq('email', session.user.email)
      //   .single()
      //
      // if (dbUser) {
      //   session.user.role = dbUser.role
      //   session.user.id = dbUser.id
      // }

      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.name = user.name
        token.email = user.email
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
}
