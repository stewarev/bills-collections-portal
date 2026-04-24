import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Uses service role key to bypass RLS during seeding
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Clear existing data (safe to re-run)
    await supabase.from('call_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('grain_history').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('gms_contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('gms_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('compliance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // --- CONTACTS ---
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .insert([
        {
          name: 'Randy Schaefer',
          company_name: 'Schaefer Farms',
          billing_entity_type: 'Company',
          phone: '519-555-0142',
          email: 'randy@schaeferfarms.ca',
          address: '4821 County Rd 12, Dashwood, ON',
          customer_type: 'Elevator Delivered',
          segment_tier: 'Gold',
          outreach_status: 'Active',
          tags: ['Build Relationship'],
          bid_sheet: 'Elevator List',
          truck_size: 'Semi',
          dryer_bin: '50,000 bu bin, natural air dryer',
          birthday: '1968-03-15',
          business_start_date: '2009-04-01',
          financial_year_end: '2024-12-31',
          personal_notes: 'Wife Linda, two sons (Tyler & Brett) farming with him. Coaches minor hockey. Passionate about soybeans.',
          business_notes: 'Driver: Tyler. Prefers morning deliveries. Uses third-party trucker in October.',
          communication_preference: 'Call',
          status: 'Active',
          last_contacted_at: '2025-03-24',
        },
        {
          name: 'Dale Vandenberg',
          company_name: 'Vandenberg Grain',
          numbered_company_name: '1234567 Ontario Inc.',
          billing_entity_type: 'Numbered Company',
          phone: '519-555-0287',
          email: 'dale.vandenberg@gmail.com',
          address: '7103 Huron Rd, Clinton, ON',
          customer_type: 'Off-farm',
          segment_tier: 'Gold',
          outreach_status: 'Active',
          tags: [],
          bid_sheet: 'Off-farm List',
          truck_size: 'Tandem',
          dryer_bin: 'Commercial dryer, 80,000 bu storage',
          birthday: '1972-07-22',
          business_start_date: '2014-08-01',
          financial_year_end: '2025-03-31',
          personal_notes: 'Very market-savvy, follows CME daily. Likes to talk numbers.',
          business_notes: 'Always price-compare. Usually holds corn until Feb/Mar. Soybeans move quickly post-harvest.',
          communication_preference: 'Call',
          status: 'Active',
          last_contacted_at: '2025-03-30',
        },
        {
          name: 'Brenda Horst',
          company_name: 'Horst Family Farm',
          billing_entity_type: 'Individual',
          phone: '519-555-0331',
          address: '2209 Perth Line 86, Listowel, ON',
          customer_type: 'Elevator Delivered',
          segment_tier: 'Silver',
          outreach_status: 'Attempting',
          tags: ['At Risk'],
          bid_sheet: 'Elevator List',
          truck_size: 'Single axle',
          dryer_bin: 'No on-farm storage',
          birthday: '1964-11-03',
          business_start_date: '2017-01-01',
          financial_year_end: '2024-12-31',
          personal_notes: 'Husband passed two years ago. Runs farm with help from neighbour. Appreciates patience.',
          business_notes: 'Moves grain quickly after harvest — no storage. Wheat and soybeans only.',
          communication_preference: 'Call',
          status: 'Active',
          last_contacted_at: '2025-02-10',
        },
        {
          name: 'Kevin Tremblay',
          company_name: 'K&J Tremblay Farms',
          billing_entity_type: 'Company',
          phone: '519-555-0419',
          email: 'ktremblay@hotmail.com',
          address: '890 Dungannon Rd, Goderich, ON',
          customer_type: 'Off-farm',
          segment_tier: 'Silver',
          outreach_status: 'Active',
          tags: ['Build Relationship', 'New Customer'],
          bid_sheet: 'Off-farm List',
          truck_size: 'Semi',
          dryer_bin: 'Propane dryer, 35,000 bu',
          birthday: '1985-05-18',
          business_start_date: '2023-09-01',
          financial_year_end: '2024-12-31',
          personal_notes: 'New customer — referred by Dale Vandenberg. Young, ambitious. Looking to grow acreage.',
          business_notes: 'Corn-heavy operation. Interested in HTA contracts.',
          communication_preference: 'Text',
          status: 'Active',
          last_contacted_at: '2025-03-15',
        },
        {
          name: 'Glen Neufeld',
          billing_entity_type: 'Individual',
          phone: '519-555-0562',
          email: 'gneufeld@wightmantel.net',
          address: '556 Cranbrook Rd, Seaforth, ON',
          customer_type: 'Elevator Delivered',
          segment_tier: 'Bronze',
          outreach_status: 'Active',
          tags: [],
          bid_sheet: 'Elevator List',
          truck_size: 'Tandem',
          dryer_bin: 'Small bin, max 15,000 bu',
          birthday: '1955-09-27',
          business_start_date: '2011-05-01',
          financial_year_end: '2024-12-31',
          personal_notes: 'Retiring in 2–3 years. Son not taking over farm — watch for land sale.',
          business_notes: 'Predictable, small operation. Wheat and soybeans.',
          communication_preference: 'Call',
          status: 'Active',
          last_contacted_at: '2025-02-28',
        },
        {
          name: 'Murray Hutcheson',
          company_name: 'Hutcheson Brothers',
          billing_entity_type: 'Company',
          phone: '519-555-0673',
          email: 'mhutcheson@hutchesonbros.ca',
          address: '1347 Londesboro Rd, Londesboro, ON',
          customer_type: 'Off-farm',
          segment_tier: 'Gold',
          outreach_status: 'Not Responding',
          tags: ['At Risk'],
          bid_sheet: 'Both',
          truck_size: 'Semi',
          dryer_bin: 'Large commercial facility, 200,000 bu+',
          birthday: '1962-01-30',
          business_start_date: '2006-01-01',
          financial_year_end: '2024-12-31',
          personal_notes: "Old-school. Doesn't like texts. Needs to hear Willie's voice.",
          business_notes: 'Large corn and soybean operation. Has been diverting volume to competitor. Priority to win back.',
          communication_preference: 'Call',
          status: 'Active',
          last_contacted_at: '2025-01-20',
        },
        {
          name: 'Joanne Wiebenga',
          company_name: 'Sunrise Acres',
          billing_entity_type: 'Company',
          phone: '519-555-0711',
          email: 'joanne@sunriseacres.ca',
          address: '3318 Grey Rd 10, Wingham, ON',
          customer_type: 'Elevator Delivered',
          segment_tier: 'Harvest Only',
          outreach_status: 'No Contact Needed',
          tags: [],
          bid_sheet: 'Elevator List',
          truck_size: 'Single axle',
          personal_notes: 'Only delivers wheat during harvest. No interest in pricing calls off-season.',
          business_notes: 'Pure wheat operation. Contact in July-August only.',
          communication_preference: 'Email',
          status: 'Active',
          last_contacted_at: '2024-08-12',
        },
        {
          name: 'Tyler Bauman',
          billing_entity_type: 'Individual',
          phone: '519-555-0834',
          email: 'tbauman@gmail.com',
          address: 'RR2 Blyth, ON',
          customer_type: 'Potential',
          tags: ['New Customer'],
          bid_sheet: 'Neither',
          communication_preference: 'Text',
          status: 'Prospect',
          lead_source: 'Farm Show 2025',
          prospect_notes: '400 acres, mixed corn/soy. Father-in-law farms next concession — warm intro possible.',
        },
      ])
      .select()

    if (contactsError) throw new Error(`Contacts: ${contactsError.message}`)

    // Map names to IDs for foreign keys
    const byName = (name: string) => contacts!.find((c) => c.name === name)!.id

    // --- CALL LOG ---
    const { error: callError } = await supabase.from('call_log').insert([
      {
        contact_id: byName('Randy Schaefer'),
        date: '2025-03-24T10:30:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: 'Discussed March corn pricing — Randy is holding 8,000 bu waiting for $6.20. Talked about summer wheat prospects. Family doing well.',
        next_action_note: 'Call back when corn crosses $6.10 to revisit',
        next_action_date: '2025-04-15', follow_up_complete: false,
      },
      {
        contact_id: byName('Randy Schaefer'),
        date: '2025-03-10T14:15:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: 'Corn market update, discussed HTA options for new crop. Randy interested in 25% hedge.',
        next_action_note: 'Follow up on HTA decision',
        next_action_date: '2025-03-24', follow_up_complete: true,
      },
      {
        contact_id: byName('Dale Vandenberg'),
        date: '2025-03-30T09:00:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: 'Dale moved 5,000 bu soybeans today. Happy with basis. Corn still sitting — expects rally in April.',
        follow_up_complete: false,
      },
      {
        contact_id: byName('Brenda Horst'),
        date: '2025-02-10T11:00:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'No Answer', staff_member: 'Willie',
        next_action_note: 'Try again next week',
        next_action_date: '2025-02-18', follow_up_complete: false,
      },
      {
        contact_id: byName('Brenda Horst'),
        date: '2025-01-28T15:30:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'Left Voicemail', staff_member: 'Willie',
        summary: 'Left message about soybean pricing window closing.',
        next_action_note: 'Call back',
        next_action_date: '2025-02-10', follow_up_complete: true,
      },
      {
        contact_id: byName('Murray Hutcheson'),
        date: '2025-01-20T10:00:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'No Answer', staff_member: 'Willie',
        follow_up_complete: false,
      },
      {
        contact_id: byName('Murray Hutcheson'),
        date: '2025-01-08T14:00:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'No Answer', staff_member: 'Willie',
        next_action_note: 'Try again',
        next_action_date: '2025-01-20', follow_up_complete: true,
      },
      {
        contact_id: byName('Kevin Tremblay'),
        date: '2025-03-15T16:00:00Z',
        interaction_type: 'Text', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: "Texted Kevin about corn basis. He replied — watching $5.90 target. Will move 3,000 bu at that level.",
        next_action_note: 'Alert when corn hits $5.90 basis',
        next_action_date: '2025-04-01', follow_up_complete: false,
      },
      {
        contact_id: byName('Glen Neufeld'),
        date: '2025-02-28T10:30:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: 'Touched base with Glen. Grain mostly moved. Thinking about winter wheat next year.',
        follow_up_complete: false,
      },
      {
        contact_id: byName('Dale Vandenberg'),
        date: '2025-04-14T09:30:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: 'Quick check-in on soybean market.',
        follow_up_complete: false,
      },
      {
        contact_id: byName('Randy Schaefer'),
        date: '2025-04-14T11:00:00Z',
        interaction_type: 'Call', direction: 'Outbound', outcome: 'No Answer', staff_member: 'Willie',
        next_action_note: 'Try again', next_action_date: '2025-04-15', follow_up_complete: false,
      },
      {
        contact_id: byName('Kevin Tremblay'),
        date: '2025-04-15T08:15:00Z',
        interaction_type: 'Text', direction: 'Outbound', outcome: 'Connected', staff_member: 'Willie',
        summary: "Corn basis update sent. Kevin confirmed he's watching.",
        follow_up_complete: false,
      },
    ])
    if (callError) throw new Error(`Call log: ${callError.message}`)

    // --- GRAIN HISTORY ---
    const { error: grainError } = await supabase.from('grain_history').insert([
      { contact_id: byName('Randy Schaefer'), crop_year: '2025/26', crop_type: 'Corn', total_acres: 320, delivery_intent: 'All to HF', notes: 'Intends to deliver all corn here again. Watching new crop basis.', is_planned: true },
      { contact_id: byName('Randy Schaefer'), crop_year: '2025/26', crop_type: 'Soybeans', total_acres: 180, delivery_intent: 'Split', notes: 'May split soybeans with local crusher. Follow up on basis.', is_planned: true },
      { contact_id: byName('Randy Schaefer'), crop_year: '2024/25', crop_type: 'Corn', total_acres: 310, hf_volume_bushels: 42000, delivery_intent: 'All to HF', is_planned: false },
      { contact_id: byName('Randy Schaefer'), crop_year: '2024/25', crop_type: 'Soybeans', total_acres: 165, hf_volume_bushels: 9500, delivery_intent: 'Split', notes: 'Moved other half to Winchester', is_planned: false },
      { contact_id: byName('Randy Schaefer'), crop_year: '2023/24', crop_type: 'Corn', total_acres: 295, hf_volume_bushels: 38000, delivery_intent: 'All to HF', is_planned: false },
      { contact_id: byName('Dale Vandenberg'), crop_year: '2025/26', crop_type: 'Corn', total_acres: 550, delivery_intent: 'Unknown', notes: "Dale hasn't committed yet. Likely off-farm storage then truck to us.", is_planned: true },
      { contact_id: byName('Dale Vandenberg'), crop_year: '2024/25', crop_type: 'Corn', total_acres: 530, hf_volume_bushels: 62000, delivery_intent: 'Split', notes: 'Split 50/50 with Centralia Co-op', is_planned: false },
    ])
    if (grainError) throw new Error(`Grain history: ${grainError.message}`)

    // --- GMS CONTRACTS ---
    const { error: gmsError } = await supabase.from('gms_contracts').insert([
      { contact_id: byName('Randy Schaefer'), crop: 'Corn', crop_year: '2024/25', contracted_bushels: 10000, delivered_bushels: 4200, remaining_bushels: 5800, price_per_bushel: 5.85, contract_date: '2024-09-15', delivery_deadline: '2025-05-31' },
      { contact_id: byName('Randy Schaefer'), crop: 'Soybeans', crop_year: '2024/25', contracted_bushels: 3500, delivered_bushels: 3500, remaining_bushels: 0, price_per_bushel: 13.20, contract_date: '2024-10-01', delivery_deadline: '2025-01-31' },
      { contact_id: byName('Dale Vandenberg'), crop: 'Soybeans', crop_year: '2024/25', contracted_bushels: 8000, delivered_bushels: 5000, remaining_bushels: 3000, price_per_bushel: 13.45, contract_date: '2024-10-15', delivery_deadline: '2025-03-31' },
      { contact_id: byName('Dale Vandenberg'), crop: 'Corn', crop_year: '2024/25', contracted_bushels: 15000, delivered_bushels: 0, remaining_bushels: 15000, contract_date: '2025-01-10', delivery_deadline: '2025-06-30' },
    ])
    if (gmsError) throw new Error(`GMS contracts: ${gmsError.message}`)

    // --- GMS TICKETS ---
    const { error: ticketError } = await supabase.from('gms_tickets').insert([
      { contact_id: byName('Randy Schaefer'), ticket_number: 'T-24891', date: '2025-03-10', crop: 'Corn', bushels: 1200 },
      { contact_id: byName('Randy Schaefer'), ticket_number: 'T-24756', date: '2025-02-20', crop: 'Corn', bushels: 1500 },
      { contact_id: byName('Randy Schaefer'), ticket_number: 'T-24601', date: '2025-01-15', crop: 'Corn', bushels: 1500, notes: 'Damp load, docked 2pts' },
      { contact_id: byName('Dale Vandenberg'), ticket_number: 'T-24950', date: '2025-03-30', crop: 'Soybeans', bushels: 2200 },
      { contact_id: byName('Dale Vandenberg'), ticket_number: 'T-24823', date: '2025-03-01', crop: 'Soybeans', bushels: 2800 },
    ])
    if (ticketError) throw new Error(`GMS tickets: ${ticketError.message}`)

    // --- COMPLIANCE ---
    const { error: compError } = await supabase.from('compliance_records').insert([
      { contact_id: byName('Randy Schaefer'), form_type: 'Clean Fuel Reg', year: 2025, signed: true, signed_date: '2025-01-15' },
      { contact_id: byName('Randy Schaefer'), form_type: 'Grain Declaration', year: 2025, signed: true, signed_date: '2025-01-15' },
      { contact_id: byName('Dale Vandenberg'), form_type: 'Clean Fuel Reg', year: 2025, signed: false, notes: 'Awaiting Dale — sent twice' },
      { contact_id: byName('Dale Vandenberg'), form_type: 'Grain Declaration', year: 2025, signed: true, signed_date: '2025-02-01' },
      { contact_id: byName('Brenda Horst'), form_type: 'Clean Fuel Reg', year: 2025, signed: false },
      { contact_id: byName('Brenda Horst'), form_type: 'Grain Declaration', year: 2025, signed: false },
    ])
    if (compError) throw new Error(`Compliance: ${compError.message}`)

    return NextResponse.json({
      success: true,
      message: `Seeded ${contacts!.length} contacts + call logs, grain history, GMS contracts, compliance records`,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
