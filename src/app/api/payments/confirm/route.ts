import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, runWithSessionClinic } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });

    const updated = await runWithSessionClinic(async (tx: any) => {
      const payment = await tx.payment.findFirst({ where: { stripePaymentIntentId: paymentIntentId, clinicId } });
      if (!payment) return null;

      await tx.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } });
      // mark invoice as paid
      await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'PAID' } });

      return { paymentId: payment.id, invoiceId: payment.invoiceId };
    });

    if (!updated) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json({ success: true, ...updated });
  } catch (err: any) {
    console.error('Failed to confirm payment:', err);
    return NextResponse.json({ error: err.message || 'Failed to confirm' }, { status: 500 });
  }
}
