import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

    const pw = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!pw || pw.used || pw.expiresAt < new Date()) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({ where: { id: pw.userId }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { id: pw.id }, data: { used: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Password accept failed', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
