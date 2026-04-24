import { NextResponse } from 'next/server'

/**
 * Seed endpoint — Phase 1 uses mock data, no seeding needed.
 * Real Supabase seeding will be wired in Phase 2.
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Phase 1 uses mock data. No database seeding required.',
  })
}
