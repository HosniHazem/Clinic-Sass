import Link from 'next/link';
import dynamic from 'next/dynamic';

const InvoicePayment = dynamic(() => import('@/components/InvoicePayment'), { ssr: false });

export default function BillingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice {id}</h1>
        <p className="text-muted-foreground">Placeholder invoice detail</p>
      </div>
      <div className="flex gap-2">
        <Link href={`/dashboard/billing/${id}/edit`} className="link">Edit</Link>
        <Link href="/dashboard/billing" className="link">Back to billing</Link>
      </div>
      <div className="mt-6">
        <InvoicePayment invoiceId={id} />
      </div>
    </div>
  );
}
