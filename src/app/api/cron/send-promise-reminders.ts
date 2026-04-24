/**
 * Cron Job: Send promise-to-pay expiry reminders
 *
 * Runs daily at 9:00 AM UTC (configurable via vercel.json)
 * Sends reminder emails to reps for promises expiring in 3 days
 *
 * Vercel Cron Syntax in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-promise-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchPromiseRequests, daysUntilPromiseExpires } from '@/lib/db/promise-to-pay'
import { sendPromiseExpiringNotification } from '@/lib/email/send'

export const runtime = 'nodejs'

interface CronResponse {
  success: boolean
  message: string
  remindersCount: number
  errors: string[]
}

export async function GET(request: NextRequest): Promise<NextResponse<CronResponse>> {
  try {
    // Verify the request is from Vercel's cron service
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - invalid cron secret',
          remindersCount: 0,
          errors: ['Missing or invalid authorization header'],
        },
        { status: 401 }
      )
    }

    console.log('🕐 Starting promise expiry reminder job...')

    // Fetch all approved promises
    const promises = await fetchPromiseRequests('approved')
    const remindersToSend: Array<{
      invoiceId: string
      repName: string
      repEmail: string
      customerName: string
      invoiceNumber: string
      expiryDate: string
    }> = []
    const errors: string[] = []

    // Filter for promises expiring in 3 days
    for (const promise of promises) {
      const daysUntil = daysUntilPromiseExpires(promise)

      // Send reminder if expiring in exactly 3 days (with 1 day tolerance for timing)
      // In production, you'd have a `reminder_sent_at` timestamp to prevent duplicates
      if (daysUntil === 3 || (daysUntil === 2 && new Date().getHours() < 10)) {
        remindersToSend.push({
          invoiceId: promise.invoiceId,
          repName: promise.requestedBy,
          repEmail: 'rep@gobolt.com', // TODO: Get actual rep email from database
          customerName: promise.customerName,
          invoiceNumber: promise.invoiceNumber,
          expiryDate: promise.expiryDate,
        })
      }
    }

    console.log(`📧 Found ${remindersToSend.length} promises expiring in 3 days`)

    // Send reminder emails
    for (const reminder of remindersToSend) {
      try {
        console.log(`  Sending reminder for ${reminder.invoiceNumber} (${reminder.repName})`)

        const result = await sendPromiseExpiringNotification(reminder.repEmail, {
          repName: reminder.repName,
          customerName: reminder.customerName,
          invoiceNumber: reminder.invoiceNumber,
          expiryDate: reminder.expiryDate,
        })

        if (!result.success) {
          errors.push(
            `Failed to send reminder for ${reminder.invoiceNumber}: ${result.error}`
          )
        } else {
          console.log(`  ✓ Reminder sent for ${reminder.invoiceNumber}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to send reminder for ${reminder.invoiceNumber}: ${errorMsg}`)
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const successCount = remindersToSend.length - errors.length

    const response: CronResponse = {
      success: errors.length === 0,
      message: `Cron job completed. Sent ${successCount}/${remindersToSend.length} reminders.`,
      remindersCount: successCount,
      errors,
    }

    console.log(`✅ Promise expiry reminder job completed`)
    console.log(
      `   Sent: ${successCount}/${remindersToSend.length} reminders`,
      errors.length > 0 ? `| Errors: ${errors.length}` : ''
    )

    return NextResponse.json(response)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('❌ Promise expiry reminder job failed:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        message: 'Cron job failed',
        remindersCount: 0,
        errors: [errorMsg],
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler for manual trigger (testing only)
 * Usage: curl -X POST http://localhost:3000/api/cron/send-promise-reminders \
 *   -H "Authorization: Bearer test-secret"
 */
export async function POST(request: NextRequest): Promise<NextResponse<CronResponse>> {
  // In development, allow POST requests without auth for testing
  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          remindersCount: 0,
          errors: ['Invalid authorization'],
        },
        { status: 401 }
      )
    }
  }

  // Call the GET handler
  return GET(request)
}
