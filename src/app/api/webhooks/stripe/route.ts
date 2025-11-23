import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { prismaScoped } from '@/lib/prisma-scoped';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-08-16' } as any);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const stripeId = pi.id;

        // Find the payment record globally, then scope updates to its clinic
        const existingPayment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: stripeId } });
        if (!existingPayment) {
          console.warn('Payment not found for intent:', stripeId);
          break;
        }

        const db = prismaScoped(existingPayment.clinicId);

        // mark payment completed
        await db.raw.payment.update({ where: { id: existingPayment.id }, data: { status: 'COMPLETED', paidAt: new Date() } });

        // recompute invoice status
        const invoice = await db.raw.invoice.findUnique({ where: { id: existingPayment.invoiceId } });
        if (invoice) {
          const payments = await db.raw.payment.findMany({ where: { invoiceId: invoice.id, status: 'COMPLETED' } });
          const paidSum = payments.reduce((s, p) => s + (p.amount || 0), 0);
          const newStatus = paidSum >= invoice.total ? 'PAID' : paidSum > 0 ? 'PARTIALLY_PAID' : invoice.status;
          await db.raw.invoice.update({ where: { id: invoice.id }, data: { status: newStatus } });
        }

        break;
      }

      case 'charge.refunded':
      case 'charge.dispute.closed': {
        // Map refund/dispute events to mark payment as refunded/failed
        const charge = event.data.object as Stripe.Charge;
        const pi = (charge.payment_intent as string) || null;
        if (!pi) break;
        const existingPayment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: pi } });
        if (!existingPayment) break;
        const db = prismaScoped(existingPayment.clinicId);
        await db.raw.payment.update({ where: { id: existingPayment.id }, data: { status: 'REFUNDED' } });
        // Optionally update invoice status if needed
        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (err) {
    console.error('Error handling webhook event:', err);
    return new NextResponse('Webhook handler error', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
