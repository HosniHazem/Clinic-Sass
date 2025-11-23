import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { resetPasswordTemplate } from '@/lib/email-templates';
import { addHours } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: true });

    // find user (do not reveal existence)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true });

    const token = randomBytes(24).toString('hex');
    const expiresAt = addHours(new Date(), 1);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        clinicId: user.clinicId,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/password-reset/accept?token=${token}`;
    const html = resetPasswordTemplate(resetUrl);
    await sendEmail(email, 'Reset your MedFlow password', html);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Password reset request failed', err);
    return NextResponse.json({ ok: true });
  }
}
