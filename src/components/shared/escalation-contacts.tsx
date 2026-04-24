'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Phone, Edit2, Trash2, Plus } from 'lucide-react'

export interface EscalationContact {
  id: string
  customerId: string
  stage: 'Stage 1' | 'Stage 2' | 'Stage 3'
  name: string
  title: string
  email: string
  phone: string
  notes?: string
}

interface EscalationContactsProps {
  customerId: string
}

const stageColors: Record<string, { bg: string; badge: string }> = {
  'Stage 1': { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  'Stage 2': { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  'Stage 3': { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800' },
}

export function EscalationContacts({ customerId }: EscalationContactsProps) {
  const [contacts, setContacts] = useState<EscalationContact[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch(`/api/escalation/${customerId}`)
        if (response.ok) {
          const data = await response.json()
          setContacts(data)
        }
      } catch (error) {
        console.error('Failed to load escalation contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [customerId])

  const handleDelete = async (contactId: string) => {
    if (!confirm('Delete this escalation contact?')) return

    try {
      const response = await fetch(`/api/escalation/${customerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })

      if (response.ok) {
        setContacts(contacts.filter((c) => c.id !== contactId))
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  const contactsByStage = {
    'Stage 1': contacts.filter((c) => c.stage === 'Stage 1'),
    'Stage 2': contacts.filter((c) => c.stage === 'Stage 2'),
    'Stage 3': contacts.filter((c) => c.stage === 'Stage 3'),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900">Escalation Contacts</h3>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Contact
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <AddEscalationForm
            customerId={customerId}
            onSuccess={(newContact) => {
              setContacts([...contacts, newContact])
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      )}

      {Object.entries(contactsByStage).map(([stage, stageContacts]) => (
        <div key={stage} className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-xs font-semibold text-slate-600 uppercase">{stage}</h4>
            <Badge variant="outline" className={`text-xs ${stageColors[stage].badge}`}>
              {stageContacts.length}
            </Badge>
          </div>

          {stageContacts.length === 0 ? (
            <Card className={`p-4 text-center text-sm text-slate-400 border ${stageColors[stage].bg}`}>
              No contact assigned
            </Card>
          ) : (
            stageContacts.map((contact) => (
              <Card key={contact.id} className={`p-4 border ${stageColors[stage].bg}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{contact.name}</p>
                    <p className="text-xs text-slate-600 mb-2">{contact.title}</p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline truncate">
                          {contact.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                    {contact.notes && (
                      <p className="text-xs text-slate-500 italic mt-2">"{contact.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(contact.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(contact.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ))}
    </div>
  )
}

interface AddEscalationFormProps {
  customerId: string
  onSuccess: (contact: EscalationContact) => void
  onCancel: () => void
}

function AddEscalationForm({ customerId, onSuccess, onCancel }: AddEscalationFormProps) {
  const [formData, setFormData] = useState({
    stage: 'Stage 1' as const,
    name: '',
    title: '',
    email: '',
    phone: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/escalation/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newContact = await response.json()
        onSuccess(newContact)
        setFormData({ stage: 'Stage 1', name: '', title: '', email: '', phone: '', notes: '' })
      }
    } catch (error) {
      console.error('Failed to add contact:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">Stage</label>
          <select
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option>Stage 1</option>
            <option>Stage 2</option>
            <option>Stage 3</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Contact name"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Job title"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="email@company.com"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1">Phone</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 block mb-1">Notes (optional)</label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g., available Mon-Fri only"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Save Contact
        </Button>
      </div>
    </form>
  )
}
