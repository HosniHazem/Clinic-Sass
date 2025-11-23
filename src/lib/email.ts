import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not configured — email sending will be disabled');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Email not sent: SENDGRID_API_KEY not configured');
    return;
  }

  const msg = {
    to,
    from: process.env.EMAIL_FROM || 'noreply@medflow.com',
    subject,
    text: text || stripHtml(html),
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent to', to);
  } catch (error: any) {
    console.error('Failed to send email:', error);
    if (error.response) {
      console.error('Error response body:', error.response.body);
    }
    throw error;
  }
}

// Helper function to strip HTML tags for text version
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

// Export for backward compatibility
export const emailTransporter = {
  sendMail: sendEmail
};
