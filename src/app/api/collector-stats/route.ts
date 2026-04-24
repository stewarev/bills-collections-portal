import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCollectionActions } from '@/lib/db/collection-actions'
import { fetchPromiseRequests } from '@/lib/db/promise-to-pay'
import { REPS } from '@/lib/netsuite/client'

export interface RepCollectorStats {
  repId: string
  repName: string
  thisWeek: {
    actionsTotal: number
    emails: number
    calls: number
    escalations: number
    promisesObtained: number
    connected: number        // successful call connections
  }
  allTime: {
    promisesObtained: number
    promisesKept: number     // approved + non-expired (proxy for kept)
    promisesExpired: number
  }
}

function getWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysToMonday)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart.toISOString().split('T')[0]
}

/**
 * GET /api/collector-stats
 * Returns per-rep collection activity stats for this week
 * Used on the admin dashboard rep workload section
 */
export async function GET(request: NextRequest) {
  try {
    const weekStart = getWeekStart()
    const today = new Date().toISOString().split('T')[0]

    const [allActions, allPromises] = await Promise.all([
      fetchAllCollectionActions(),
      fetchPromiseRequests(),
    ])

    // This week's actions only
    const weekActions = allActions.filter((a) => a.date >= weekStart)

    // Build per-rep stats
    const statsByRep = new Map<string, RepCollectorStats>()

    // Initialise all known reps
    for (const rep of REPS) {
      statsByRep.set(rep.id, {
        repId: rep.id,
        repName: rep.name,
        thisWeek: {
          actionsTotal: 0,
          emails: 0,
          calls: 0,
          escalations: 0,
          promisesObtained: 0,
          connected: 0,
        },
        allTime: {
          promisesObtained: 0,
          promisesKept: 0,
          promisesExpired: 0,
        },
      })
    }

    // Tally this-week actions
    // Note: collection actions store staffMember name, not repId — map by name
    const repByName = new Map(REPS.map((r) => [r.name.toLowerCase(), r.id]))

    for (const action of weekActions) {
      const repId = repByName.get(action.staffMember.toLowerCase())
      if (!repId) continue
      const stats = statsByRep.get(repId)
      if (!stats) continue

      stats.thisWeek.actionsTotal++
      if (action.actionType === 'Email') stats.thisWeek.emails++
      if (action.actionType === 'Call') stats.thisWeek.calls++
      if (action.actionType === 'Escalate') stats.thisWeek.escalations++
      if (action.actionType === 'Promise-to-Pay') stats.thisWeek.promisesObtained++
      if (action.outcome === 'Connected') stats.thisWeek.connected++
    }

    // Tally all-time promise stats per rep
    for (const promise of allPromises) {
      const repId = promise.requestedByRepId
      const stats = statsByRep.get(repId)
      if (!stats) continue

      if (promise.status === 'approved' || promise.status === 'pending') {
        stats.allTime.promisesObtained++
      }
      // "Kept" proxy: approved and expiry still in future
      if (promise.status === 'approved' && promise.expiryDate >= today) {
        stats.allTime.promisesKept++
      }
      // Expired: approved but past expiry
      if (promise.status === 'approved' && promise.expiryDate < today) {
        stats.allTime.promisesExpired++
      }
    }

    const stats = Array.from(statsByRep.values())

    // Overall this-week totals
    const totals = stats.reduce(
      (acc, r) => ({
        actionsTotal: acc.actionsTotal + r.thisWeek.actionsTotal,
        emails: acc.emails + r.thisWeek.emails,
        calls: acc.calls + r.thisWeek.calls,
        escalations: acc.escalations + r.thisWeek.escalations,
        promisesObtained: acc.promisesObtained + r.thisWeek.promisesObtained,
      }),
      { actionsTotal: 0, emails: 0, calls: 0, escalations: 0, promisesObtained: 0 }
    )

    return NextResponse.json({ stats, totals, weekStart }, { status: 200 })
  } catch (error) {
    console.error('[COLLECTOR-STATS] Error:', error)
    return NextResponse.json({ error: 'Failed to compute collector stats' }, { status: 500 })
  }
}
