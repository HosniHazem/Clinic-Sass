import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { sendEmail } from '@/lib/email';
import { inviteTemplate } from '@/lib/email-templates';

export async function POST(req: Request) {
  try {
    const session = await requireRole(['ADMIN']);
    const { email, role } = await req.json();
    if (!email || !role) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

    const token = randomBytes(20).toString('hex');
    const expiresAt = addDays(new Date(), 7);

    await prisma.inviteToken.create({
      data: {
        token,
        email,
        role,
        clinicId: session.user.clinicId as string,
        invitedBy: session.user.id,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/invite/accept?token=${token}`;
    const html = inviteTemplate(inviteUrl, session.user.clinicId, session.user.email || session.user.id);
    await sendEmail(email, 'You were invited to MedFlow', html);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Invite create failed', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
