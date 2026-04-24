/**
 * User Role Detection
 *
 * Determines if a user is an admin or AR rep based on their email or name
 */

import { REPS } from '@/lib/netsuite/client'

export const ADMIN_EMAILS = ['christine@gobolt.com', 'evan@gobolt.com']
export const ADMIN_NAMES = ['Christine']

export interface UserInfo {
  id: string
  email: string
  name: string
  role: 'admin' | 'rep'
  repId?: string
}

export function getUserRole(email?: string | null, name?: string | null): 'admin' | 'rep' {
  if (!email && !name) return 'rep'

  // Check if admin by email
  if (email && ADMIN_EMAILS.some((adminEmail) => email.toLowerCase().includes(adminEmail.split('@')[0]))) {
    return 'admin'
  }

  // Check if admin by name
  if (name && ADMIN_NAMES.some((adminName) => name.includes(adminName))) {
    return 'admin'
  }

  return 'rep'
}

export function getRepIdFromName(name?: string | null): string | undefined {
  if (!name) return undefined
  const rep = REPS.find((r) => r.name.toLowerCase() === name.toLowerCase())
  return rep?.id
}

export function buildUserInfo(email?: string | null, name?: string | null, id?: string): UserInfo {
  const role = getUserRole(email, name)
  const repId = role === 'rep' ? getRepIdFromName(name) : undefined

  return {
    id: id || '',
    email: email || '',
    name: name || '',
    role,
    repId,
  }
}
