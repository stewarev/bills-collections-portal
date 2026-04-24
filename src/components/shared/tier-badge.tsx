import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SegmentTier } from '@/lib/types'
import { TIER_COLORS } from '@/lib/types'

const TIER_EMOJI: Record<SegmentTier, string> = {
  Gold: '🥇',
  Silver: '🥈',
  Bronze: '🥉',
  'Non-Podium': '⬜',
  'Harvest Only': '🌾',
}

interface TierBadgeProps {
  tier: SegmentTier | null
  className?: string
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  if (!tier) return null
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', TIER_COLORS[tier], className)}
    >
      {TIER_EMOJI[tier]} {tier}
    </Badge>
  )
}
