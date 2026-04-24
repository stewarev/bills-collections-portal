import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

/**
 * POST /api/integrations/netsuite
 * Save or update NetSuite integration configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@gobolt.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { apiToken, accountId, syncSchedule } = await request.json()

    // Validate required fields
    if (!apiToken || !accountId) {
      return NextResponse.json(
        { error: 'API Token and Account ID are required' },
        { status: 400 }
      )
    }

    // Store in environment or database
    // For Phase 1: Log to console (Phase 2: store encrypted in Supabase)
    console.log('NetSuite config updated:', {
      accountId,
      syncSchedule,
      timestamp: new Date().toISOString(),
    })

    // TODO: Phase 2 - Store encrypted credentials in Supabase integrations table
    // const { data, error } = await supabase
    //   .from('integrations')
    //   .upsert({
    //     type: 'netsuite',
    //     config: { accountId, syncSchedule },
    //     credentials: encrypt(apiToken),
    //     updated_at: new Date(),
    //   })

    return NextResponse.json(
      {
        success: true,
        message: 'NetSuite configuration saved',
        config: { accountId, syncSchedule },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('NetSuite config error:', error)
    return NextResponse.json(
      { error: 'Failed to save NetSuite configuration' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/integrations/netsuite
 * Fetch current NetSuite configuration (excludes sensitive data)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@gobolt.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // TODO: Phase 2 - Fetch from Supabase integrations table
    return NextResponse.json(
      {
        configured: false,
        config: {
          syncSchedule: 'daily',
        },
        lastSync: null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('NetSuite fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NetSuite configuration' },
      { status: 500 }
    )
  }
}
