import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth, runWithSessionClinic } from '@/lib/auth-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-08-16' } as any);

export async function POST(req: Request) {
  const session = await requireAuth();
  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });

    // Use a transaction for DB work so RLS sees clinic setting
    const invoice = await runWithSessionClinic(async (tx: any) => {
      const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!inv || inv.clinicId !== clinicId) return null;
      return inv;
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const amount = Math.round((invoice.total || 0) * 100);

    const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'usd', metadata: { invoiceId, clinicId } });

    const payment = await runWithSessionClinic(async (tx: any) => {
      return tx.payment.create({
        data: {
          clinicId,
          invoiceId,
          amount: invoice.total,
          paymentMethod: 'STRIPE',
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
        },
      });
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, payment });
  } catch (error) {
    console.error('Failed to create payment intent', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
