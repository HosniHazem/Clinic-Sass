"use client";

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function Inner({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoiceId }) });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || 'Failed to create payment');
        if (mounted) setClientSecret(body.clientSecret || null);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Payment setup failed', variant: 'destructive' });
      }
    })();
    return () => { mounted = false };
  }, [invoiceId, toast]);

  const handlePay = async () => {
    if (!stripe || !elements || !clientSecret) {
      toast({ title: 'Error', description: 'Payment not ready', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      } as any);

      if (error) throw error;

      // Inform server to mark payment complete
      const confirmRes = await fetch('/api/payments/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId: paymentIntent.id }) });
      const confirmBody = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmBody?.error || 'Failed to confirm payment');

      toast({ title: 'Payment successful', description: 'Your invoice has been paid' });
      // reload page to update invoice status
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Payment error', description: err.message || 'Payment failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 border rounded">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      <div>
        <Button onClick={handlePay} disabled={!clientSecret || loading}>{loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}</Button>
      </div>
    </div>
  );
}

export default function PayInvoiceClient(props: { invoiceId: string; amount: number }) {
  return (
    <Elements stripe={stripePromise}>
      <Inner {...props} />
    </Elements>
  );
}
