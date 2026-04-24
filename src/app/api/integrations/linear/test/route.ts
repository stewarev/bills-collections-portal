import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

/**
 * POST /api/integrations/linear/test
 * Test Linear API connection
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

    if (!apiKey || !workspaceId) {
      return NextResponse.json(
        { error: 'API Key and Workspace ID are required' },
        { status: 400 }
      )
    }

    // Test Linear GraphQL API connection
    try {
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query {
              viewer {
                id
                email
              }
            }
          `,
        }),
      })

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            message: 'Linear API returned an error',
            error: `HTTP ${response.status}`,
          },
          { status: 400 }
        )
      }

      const data = await response.json()

      if (data.errors) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid API key or workspace ID',
            error: data.errors[0]?.message || 'Unknown error',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Linear connection successful',
          user: data.data?.viewer?.email,
        },
        { status: 200 }
      )
    } catch (apiError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to reach Linear API',
          error: apiError instanceof Error ? apiError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Linear test error:', error)
    return NextResponse.json(
      { error: 'Failed to test Linear connection' },
      { status: 500 }
    )
  }
}
