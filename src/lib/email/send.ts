/**
 * Email sending service
 * Phase 1: Stub implementation (logs to console)
 * Phase 2: Integration with Resend or SendGrid
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

/**
 * Send an email
 * Phase 1: Stub - logs to console only
 * In production, this will integrate with Resend or SendGrid
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'noreply@collections.gobolt.com',
  replyTo,
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Phase 1: Log to console for debugging
    console.log('📧 Email would be sent:')
    console.log(`   To: ${to}`)
    console.log(`   From: ${from}`)
    if (replyTo) console.log(`   Reply-To: ${replyTo}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   HTML length: ${html.length} characters`)
    console.log('---')

    // TODO: Phase 2 - Integrate with email service
    // Example with Resend (uncomment when ready):
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // const response = await resend.emails.send({
    //   from,
    //   to,
    //   subject,
    //   html,
    //   reply_to: replyTo,
    // });
    // return { success: response.data ? true : false, error: response.error?.message };

    // For now, simulate successful send
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Email send error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send promise-to-pay request notification to admin
 */
export async function sendPromiseRequestNotification(
  adminEmail: string,
  params: {
    repName: string
    customerName: string
    invoiceNumber: string
    amount: number
    promisedDate: string
    expiryDate: string
    notes?: string
  }
) {
  const { promiseRequestTemplate } = await import('./templates')

  return sendEmail({
    to: adminEmail,
    subject: `[Action Required] Promise-to-Pay Request from ${params.repName} for ${params.customerName}`,
    html: promiseRequestTemplate({
      ...params,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    }),
    replyTo: process.env.ADMIN_REPLY_EMAIL,
  })
}

/**
 * Send promise approved notification to rep
 */
export async function sendPromiseApprovedNotification(
  repEmail: string,
  params: {
    repName: string
    customerName: string
    invoiceNumber: string
    amount: number
    expiryDate: string
  }
) {
  const { promiseApprovedTemplate } = await import('./templates')

  return sendEmail({
    to: repEmail,
    subject: `✓ Promise Approved: ${params.customerName} - ${params.invoiceNumber}`,
    html: promiseApprovedTemplate({
      ...params,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    }),
  })
}

/**
 * Send promise rejected notification to rep
 */
export async function sendPromiseRejectedNotification(
  repEmail: string,
  params: {
    repName: string
    customerName: string
    invoiceNumber: string
    rejectionReason: string
  }
) {
  const { promiseRejectedTemplate } = await import('./templates')

  return sendEmail({
    to: repEmail,
    subject: `Promise Rejected: ${params.customerName} - ${params.invoiceNumber}`,
    html: promiseRejectedTemplate({
      ...params,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    }),
  })
}

/**
 * Send promise expiring soon notification to rep
 */
export async function sendPromiseExpiringNotification(
  repEmail: string,
  params: {
    repName: string
    customerName: string
    invoiceNumber: string
    expiryDate: string
  }
) {
  const { promiseExpiringTemplate } = await import('./templates')

  return sendEmail({
    to: repEmail,
    subject: `⏰ Follow Up Needed: Promise Expiring for ${params.customerName}`,
    html: promiseExpiringTemplate({
      ...params,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    }),
  })
}
