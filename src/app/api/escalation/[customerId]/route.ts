import {
  fetchEscalationContacts,
  addEscalationContact,
  updateEscalationContact,
  deleteEscalationContact,
} from '@/lib/netsuite/escalation'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const contacts = await fetchEscalationContacts(customerId)
    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Escalation contacts error:', error)
    return NextResponse.json({ error: 'Failed to fetch escalation contacts' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const body = await request.json()

    const newContact = await addEscalationContact(customerId, body)
    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error('Add escalation contact error:', error)
    return NextResponse.json({ error: 'Failed to add escalation contact' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const body = await request.json()
    const { contactId, ...updates } = body

    const updated = await updateEscalationContact(customerId, contactId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update escalation contact error:', error)
    return NextResponse.json({ error: 'Failed to update escalation contact' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const { contactId } = await request.json()

    const deleted = await deleteEscalationContact(customerId, contactId)
    if (!deleted) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete escalation contact error:', error)
    return NextResponse.json({ error: 'Failed to delete escalation contact' }, { status: 500 })
  }
}
