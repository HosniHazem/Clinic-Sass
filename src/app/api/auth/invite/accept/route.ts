import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { runWithClinicTransaction } from '@/lib/db-rls';

export async function POST(req: Request) {
  try {
    const { token, firstName, lastName, password } = await req.json();
    if (!token || !firstName || !lastName || !password) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

    const invite = await prisma.inviteToken.findUnique({ where: { token } });
    if (!invite || invite.used || invite.expiresAt < new Date()) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    // Create user inside a transaction where clinic session var is set
    const user = await runWithClinicTransaction(invite.clinicId, async (tx: any) => {
      const u = await tx.user.create({
        data: {
          email: invite.email,
          password: hashed,
          firstName,
          lastName,
          role: invite.role,
          clinicId: invite.clinicId,
          isActive: true,
          emailVerified: false,
        },
      });
      return u;
    });

    await prisma.inviteToken.update({ where: { id: invite.id }, data: { used: true } });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error('Invite accept failed', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
