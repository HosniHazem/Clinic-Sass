import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { getDownloadUrl } from '@/lib/storage';
import { requireAuth, requireRole, runWithSessionClinic } from '@/lib/auth-utils';

export async function GET(req: Request) {
  const session = await requireAuth();
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const pres = await db.raw.prescription.findUnique({ where: { id }, include: { patient: true, doctor: true } });
    if (!pres) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (pres.pdfUrl) {
      try {
        pres.pdfUrl = await getDownloadUrl(pres.pdfUrl);
      } catch (err) {
        console.warn('Failed to get pdf url', err);
      }
    }

    return NextResponse.json(pres);
  } catch (err: any) {
    console.error('Failed to get prescription', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireRole(['DOCTOR', 'ADMIN']);
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json();
    const update: any = {};
    if (body.medications) update.medications = JSON.stringify(body.medications);
    if (typeof body.instructions !== 'undefined') update.instructions = body.instructions;

    const updated = await runWithSessionClinic(async (tx: any) => {
      return tx.prescription.update({ where: { id }, data: update });
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Failed to update prescription', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireRole(['DOCTOR', 'ADMIN']);
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    await runWithSessionClinic(async (tx: any) => {
      await tx.prescription.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete prescription', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
