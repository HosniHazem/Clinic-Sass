import Link from 'next/link';
import { getSessionServer } from '@/lib/auth-utils';
import { prismaScoped } from '@/lib/prisma-scoped';
import PayInvoiceClient from '@/components/portal/PayInvoiceClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function PortalInvoicesPage() {
  const session = await getSessionServer();
  if (!session?.user) return <div className="p-6">Unauthorized</div>;

  const clinicId = session.user.clinicId as string;
  const db = prismaScoped(clinicId);

  const patients = await db.patient.findMany({ where: { userId: session.user.id } });
  const patient = patients?.[0];
  if (!patient) return <div className="p-6">No patient record found</div>;

  const invoices = await db.invoice.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Invoices</h1>
          <p className="text-muted-foreground">Pay or view invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {invoices.length === 0 && <div className="p-4 text-muted-foreground">No invoices found</div>}
        {invoices.map((inv: any) => (
          <Card key={inv.id}>
            <CardHeader>
              <CardTitle>{inv.invoiceNumber || inv.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div><strong>Total:</strong> ${inv.total?.toFixed(2) ?? '0.00'}</div>
                  <div className="text-sm text-muted-foreground">Status: {inv.status}</div>
                </div>
                <div>
                  <Link href={`/portal/invoices/${inv.id}`}>
                    <button className="inline-flex items-center rounded-md border px-3 py-1 text-sm mr-2">View</button>
                  </Link>
                  {inv.status !== 'PAID' && (
                    // render client pay component
                    <div className="inline-block align-middle">
                      <PayInvoiceClient invoiceId={inv.id} amount={inv.total || 0} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
