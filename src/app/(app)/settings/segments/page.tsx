'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Segment {
  id: string
  name: string
  cadence_days_first_touch: number | null
  cadence_days_second_touch: number | null
  cadence_days_third_touch: number | null
  escalation_enabled: boolean
  auto_charge_credit_card: boolean
  description: string | null
}

const MOCK_SEGMENTS: Segment[] = [
  {
    id: '1',
    name: 'Bronze',
    cadence_days_first_touch: 15,
    cadence_days_second_touch: 30,
    cadence_days_third_touch: 60,
    escalation_enabled: false,
    auto_charge_credit_card: false,
    description: 'Low priority customers, standard terms',
  },
  {
    id: '2',
    name: 'Silver',
    cadence_days_first_touch: 10,
    cadence_days_second_touch: 20,
    cadence_days_third_touch: 45,
    escalation_enabled: true,
    auto_charge_credit_card: false,
    description: 'Medium priority customers, escalate if unpaid',
  },
  {
    id: '3',
    name: 'Regular',
    cadence_days_first_touch: 7,
    cadence_days_second_touch: 14,
    cadence_days_third_touch: 30,
    escalation_enabled: true,
    auto_charge_credit_card: false,
    description: 'Standard customers',
  },
  {
    id: '4',
    name: 'Hyper-care',
    cadence_days_first_touch: 3,
    cadence_days_second_touch: 7,
    cadence_days_third_touch: 14,
    escalation_enabled: true,
    auto_charge_credit_card: false,
    description: 'High value or at-risk customers, frequent contact',
  },
  {
    id: '5',
    name: 'Finance Action',
    cadence_days_first_touch: 1,
    cadence_days_second_touch: 2,
    cadence_days_third_touch: 5,
    escalation_enabled: true,
    auto_charge_credit_card: true,
    description: 'Requires immediate action, may auto-charge',
  },
]

export default function SegmentsSettingsPage() {
  const [segments, setSegments] = useState<Segment[]>(MOCK_SEGMENTS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)

  const handleEdit = (segment: Segment) => {
    setEditingId(segment.id)
    setEditingSegment({ ...segment })
  }

  const handleSave = () => {
    if (editingSegment) {
      // TODO: Implement API call to save segment
      setSegments(
        segments.map(s => (s.id === editingSegment.id ? editingSegment : s))
      )
      setEditingId(null)
      setEditingSegment(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingSegment(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Segment Settings</h1>
        <p className="text-slate-600 mt-1">
          Configure collection cadences and rules for each customer segment
        </p>
      </div>

      {/* Segments List */}
      <div className="space-y-4">
        {segments.map(segment => (
          <Card
            key={segment.id}
            className={`p-6 ${editingId === segment.id ? 'border-blue-400 border-2' : ''}`}
          >
            {editingId === segment.id && editingSegment ? (
              // Edit Mode
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">{segment.name}</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      First Touch (days)
                    </label>
                    <input
                      type="number"
                      value={editingSegment.cadence_days_first_touch || ''}
                      onChange={(e) =>
                        setEditingSegment({
                          ...editingSegment,
                          cadence_days_first_touch: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Second Touch (days)
                    </label>
                    <input
                      type="number"
                      value={editingSegment.cadence_days_second_touch || ''}
                      onChange={(e) =>
                        setEditingSegment({
                          ...editingSegment,
                          cadence_days_second_touch: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Third Touch (days)
                    </label>
                    <input
                      type="number"
                      value={editingSegment.cadence_days_third_touch || ''}
                      onChange={(e) =>
                        setEditingSegment({
                          ...editingSegment,
                          cadence_days_third_touch: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingSegment.escalation_enabled}
                      onChange={(e) =>
                        setEditingSegment({
                          ...editingSegment,
                          escalation_enabled: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      Enable escalation for unpaid invoices
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingSegment.auto_charge_credit_card}
                      onChange={(e) =>
                        setEditingSegment({
                          ...editingSegment,
                          auto_charge_credit_card: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      Auto-charge credit card on file (Finance Action only)
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{segment.name}</h3>
                    <p className="text-sm text-slate-600">{segment.description}</p>
                  </div>
                  <Button
                    onClick={() => handleEdit(segment)}
                    variant="outline"
                    className="text-sm"
                  >
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-sm">
                    <span className="text-slate-600">First touch:</span>
                    <span className="font-medium ml-1">{segment.cadence_days_first_touch} days</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-600">Second touch:</span>
                    <span className="font-medium ml-1">{segment.cadence_days_second_touch} days</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-600">Third touch:</span>
                    <span className="font-medium ml-1">{segment.cadence_days_third_touch} days</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-2 text-xs">
                  {segment.escalation_enabled && (
                    <span className="text-purple-600 font-medium">✓ Escalation enabled</span>
                  )}
                  {segment.auto_charge_credit_card && (
                    <span className="text-orange-600 font-medium">⚠ Auto-charge enabled</span>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
