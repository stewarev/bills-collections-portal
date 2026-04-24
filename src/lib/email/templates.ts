/**
 * Email templates for promise-to-pay workflow
 * These generate HTML email content for different notifications
 */

interface EmailTemplateParams {
  repName: string
  customerName: string
  invoiceNumber: string
  amount?: number
  promisedDate?: string
  expiryDate?: string
  notes?: string
  rejectionReason?: string
  appUrl?: string
}

/**
 * Email to admin: Rep requests promise-to-pay approval
 */
export function promiseRequestTemplate({
  repName,
  customerName,
  invoiceNumber,
  amount = 0,
  promisedDate = new Date().toISOString(),
  expiryDate = new Date().toISOString(),
  notes,
  appUrl = 'https://collections.gobolt.com',
}: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h2 { margin: 0; }
      .content { background-color: #f9fafb; padding: 20px; }
      .details { background-color: white; padding: 15px; border-left: 4px solid #0066cc; margin: 15px 0; }
      .detail-row { margin: 10px 0; }
      .label { font-weight: 600; color: #666; font-size: 0.9em; text-transform: uppercase; }
      .value { color: #333; font-size: 1.1em; }
      .button { display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 0.9em; color: #666; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Promise-to-Pay Request</h2>
        <p>From: ${repName}</p>
      </div>

      <div class="content">
        <p>Hi Christine,</p>
        <p><strong>${repName}</strong> has requested approval for a promise-to-pay from <strong>${customerName}</strong>.</p>

        <div class="details">
          <div class="detail-row">
            <div class="label">Invoice</div>
            <div class="value">${invoiceNumber}</div>
          </div>
          <div class="detail-row">
            <div class="label">Amount</div>
            <div class="value">$${(amount / 1000).toFixed(1)}K</div>
          </div>
          <div class="detail-row">
            <div class="label">Promised Payment Date</div>
            <div class="value">${new Date(promisedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
          <div class="detail-row">
            <div class="label">Promise Expires</div>
            <div class="value">${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
          ${notes ? `
          <div class="detail-row">
            <div class="label">Notes</div>
            <div class="value">${notes}</div>
          </div>
          ` : ''}
        </div>

        <p>Please review and approve or reject this request in the Collections Portal.</p>
        <a href="${appUrl}/promise-to-pay/pending" class="button">Review Request</a>
      </div>

      <div class="footer">
        <p>Bills Collections Portal • ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

/**
 * Email to rep: Admin approves promise-to-pay
 */
export function promiseApprovedTemplate({
  repName,
  customerName,
  invoiceNumber,
  amount = 0,
  expiryDate = new Date().toISOString(),
  appUrl = 'https://collections.gobolt.com',
}: EmailTemplateParams): string {
  const daysUntil = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h2 { margin: 0; }
      .content { background-color: #f9fafb; padding: 20px; }
      .details { background-color: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
      .detail-row { margin: 10px 0; }
      .label { font-weight: 600; color: #666; font-size: 0.9em; text-transform: uppercase; }
      .value { color: #333; font-size: 1.1em; }
      .alert { background-color: #fef3c7; border: 1px solid #fcd34d; padding: 12px; border-radius: 6px; margin-top: 15px; }
      .alert p { margin: 5px 0; }
      .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 0.9em; color: #666; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>✓ Promise Approved</h2>
      </div>

      <div class="content">
        <p>Hi ${repName},</p>
        <p>Great news! Your promise-to-pay request for <strong>${customerName}</strong> has been approved by the admin.</p>

        <div class="details">
          <div class="detail-row">
            <div class="label">Invoice</div>
            <div class="value">${invoiceNumber}</div>
          </div>
          <div class="detail-row">
            <div class="label">Amount</div>
            <div class="value">$${(amount / 1000).toFixed(1)}K</div>
          </div>
          <div class="detail-row">
            <div class="label">Promise Expires</div>
            <div class="value">${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} (${daysUntil} days)</div>
          </div>
        </div>

        <div class="alert">
          <p><strong>⏰ Reminder:</strong> Follow up with the customer before the expiry date to confirm payment or negotiate a new promise if needed.</p>
        </div>

        <a href="${appUrl}/customers" class="button">View Your Customers</a>
      </div>

      <div class="footer">
        <p>Bills Collections Portal • ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

/**
 * Email to rep: Admin rejects promise-to-pay
 */
export function promiseRejectedTemplate({
  repName,
  customerName,
  invoiceNumber,
  rejectionReason,
  appUrl = 'https://collections.gobolt.com',
}: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h2 { margin: 0; }
      .content { background-color: #f9fafb; padding: 20px; }
      .details { background-color: white; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
      .detail-row { margin: 10px 0; }
      .label { font-weight: 600; color: #666; font-size: 0.9em; text-transform: uppercase; }
      .value { color: #333; font-size: 1.1em; }
      .reason { background-color: #fee2e2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; margin-top: 15px; }
      .reason p { margin: 5px 0; }
      .button { display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 0.9em; color: #666; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Promise-to-Pay Rejected</h2>
      </div>

      <div class="content">
        <p>Hi ${repName},</p>
        <p>Your promise-to-pay request for <strong>${customerName}</strong> has been rejected.</p>

        <div class="details">
          <div class="detail-row">
            <div class="label">Invoice</div>
            <div class="value">${invoiceNumber}</div>
          </div>
        </div>

        <div class="reason">
          <p><strong>Reason:</strong></p>
          <p>${rejectionReason || 'No reason provided'}</p>
        </div>

        <p>Please contact the admin to discuss next steps or try submitting a revised promise with updated terms.</p>
        <a href="${appUrl}/customers" class="button">Back to Customers</a>
      </div>

      <div class="footer">
        <p>Bills Collections Portal • ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

/**
 * Email to rep: Promise is about to expire
 */
export function promiseExpiringTemplate({
  repName,
  customerName,
  invoiceNumber,
  expiryDate = new Date().toISOString(),
  appUrl = 'https://collections.gobolt.com',
}: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h2 { margin: 0; }
      .content { background-color: #f9fafb; padding: 20px; }
      .details { background-color: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
      .detail-row { margin: 10px 0; }
      .label { font-weight: 600; color: #666; font-size: 0.9em; text-transform: uppercase; }
      .value { color: #333; font-size: 1.1em; }
      .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 0.9em; color: #666; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>⏰ Promise Expiring Soon</h2>
      </div>

      <div class="content">
        <p>Hi ${repName},</p>
        <p>A promise-to-pay for <strong>${customerName}</strong> is about to expire.</p>

        <div class="details">
          <div class="detail-row">
            <div class="label">Invoice</div>
            <div class="value">${invoiceNumber}</div>
          </div>
          <div class="detail-row">
            <div class="label">Expires</div>
            <div class="value">${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>

        <p>Please follow up with the customer to confirm payment or negotiate a new promise.</p>
        <a href="${appUrl}/customers" class="button">View Customer</a>
      </div>

      <div class="footer">
        <p>Bills Collections Portal • ${new Date().getFullYear()}</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}
