export function inviteTemplate(inviteUrl: string, clinicName?: string, invitedBy?: string) {
  const clinic = clinicName || 'your clinic';
  const inviter = invitedBy ? ` by ${invitedBy}` : '';
  return `
    <div style="font-family:system-ui, -apple-system, Roboto, 'Segoe UI', Helvetica, Arial; color:#0f172a">
      <h2 style="color:#0f172a">You were invited to join ${clinic}</h2>
      <p>Click the button below to accept the invitation${inviter}.</p>
      <p style="margin:18px 0">
        <a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Accept Invite</a>
      </p>
      <p style="color:#64748b;font-size:13px">If you didn't expect this invitation, you can ignore this email.</p>
    </div>
  `;
}

export function resetPasswordTemplate(resetUrl: string) {
  return `
    <div style="font-family:system-ui, -apple-system, Roboto, 'Segoe UI', Helvetica, Arial; color:#0f172a">
      <h2 style="color:#0f172a">Reset your password</h2>
      <p>Use the button below to create a new password. This link expires in one hour.</p>
      <p style="margin:18px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#059669;color:#fff;border-radius:6px;text-decoration:none">Reset password</a>
      </p>
      <p style="color:#64748b;font-size:13px">If you didn't request a password reset, you can ignore this email.</p>
    </div>
  `;
}
