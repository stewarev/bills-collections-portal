import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

/**
 * POST /api/integrations/linear
 * Save or update Linear integration configuration
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

    const { apiKey, workspaceId } = await request.json()

    // Validate required fields
    if (!apiKey || !workspaceId) {
      return NextResponse.json(
        { error: 'API Key and Workspace ID are required' },
        { status: 400 }
      )
    }

    // Store in environment or database
    // For Phase 1: Log to console (Phase 2: store encrypted in Supabase)
    console.log('Linear config updated:', {
      workspaceId,
      timestamp: new Date().toISOString(),
    })

    // TODO: Phase 2 - Store encrypted credentials in Supabase integrations table
    // const { data, error } = await supabase
    //   .from('integrations')
    //   .upsert({
    //     type: 'linear',
    //     config: { workspaceId },
    //     credentials: encrypt(apiKey),
    //     updated_at: new Date(),
    //   })

    return NextResponse.json(
      {
        success: true,
        message: 'Linear configuration saved',
        config: { workspaceId },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Linear config error:', error)
    return NextResponse.json(
      { error: 'Failed to save Linear configuration' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/integrations/linear
 * Fetch current Linear configuration (excludes sensitive data)
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
          workspaceId: null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Linear fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Linear configuration' },
      { status: 500 }
    )
  }
}
