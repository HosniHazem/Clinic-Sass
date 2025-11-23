"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const res = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement) as any,
      },
    });

    setLoading(false);
    if (res.error) {
      setError(res.error.message || 'Payment failed');
    } else if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
      // Successful payment — you may refresh data or redirect
      window.location.reload();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded"><CardElement options={{ hidePostalCode: true }} /></div>
      {error && <div className="text-red-600">{error}</div>}
      <button disabled={!stripe || loading} className="btn primary">
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}

export default function InvoicePayment({ invoiceId }: { invoiceId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createPayment = async () => {
    setLoading(true);
    const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoiceId }) });
    const data = await res.json();
    setLoading(false);
    if (data?.clientSecret) setClientSecret(data.clientSecret);
    else alert(data?.error || 'Failed to create payment');
  };

  return (
    <div>
      {!clientSecret ? (
        <div>
          <button onClick={createPayment} className="btn">
            {loading ? 'Creating...' : 'Pay Invoice'}
          </button>
        </div>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </div>
  );
}
