import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireRole } from '@/lib/auth-utils';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['ADMIN']);
    const clinicId = (await requireRole(['ADMIN'])).user.clinicId as string;
    const db = prismaScoped(clinicId);
    const user = await db.raw.user.findUnique({ where: { id: params.id }, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, clinicId: true } });
    if (!user || user.clinicId !== clinicId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error('Failed to fetch staff', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['ADMIN']);
    const clinicId = (await requireRole(['ADMIN'])).user.clinicId as string;
    const db = prismaScoped(clinicId);
    const schema = z.object({ firstName: z.string().optional(), lastName: z.string().optional(), role: z.string().optional(), isActive: z.boolean().optional() });
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    const existing = await db.raw.user.findUnique({ where: { id: params.id } });
    if (!existing || existing.clinicId !== clinicId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await db.raw.user.update({ where: { id: params.id }, data: parsed.data as any, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Failed to update staff', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['ADMIN']);
    const clinicId = (await requireRole(['ADMIN'])).user.clinicId as string;
    const db = prismaScoped(clinicId);
    const existing = await db.raw.user.findUnique({ where: { id: params.id } });
    if (!existing || existing.clinicId !== clinicId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.raw.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete staff', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
