'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  serviceId?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Patient {
  id: string;
  user: User;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  items: string | InvoiceItem[];
  notes?: string;
  createdAt: string;
  patient: Patient;
  subtotal: number;
  tax: number;
  total: number;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export default function ViewInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${id}`);
        if (!response.ok) throw new Error('Failed to fetch invoice');
        const data = await response.json();
        setInvoice(data);
        setFormData({
          status: data.status,
          notes: data.notes || '',
        });
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoice',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add a type guard to check if invoice exists and has patient data
  const getPatientName = () => {
    if (!invoice?.patient?.user) return 'N/A';
    return `${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`;
  };

  const getPatientContact = () => {
    if (!invoice?.patient?.user) return 'N/A';
    return invoice.patient.user.email || invoice.patient.user.phone || 'N/A';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update invoice');
      
      const updatedInvoice = await response.json();
      setInvoice(updatedInvoice);
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Loading Invoice...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Invoice Not Found</h1>
            <p className="text-muted-foreground mt-2">The requested invoice could not be found.</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/billing')}>
              Back to Invoices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusVariant = ({
    PAID: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  } as Record<string, string>)[invoice?.status as string] || 'bg-gray-100 text-gray-800';

  // Parse items safely
  const parseItems = (items: string | InvoiceItem[]): InvoiceItem[] => {
    try {
      if (!items) return [];
      return typeof items === 'string' ? JSON.parse(items) : items;
    } catch (error) {
      console.error('Error parsing items:', error);
      return [];
    }
  };

  // Get items with proper typing
  const items: InvoiceItem[] = invoice ? parseItems(invoice.items) : [];
  
  // Get invoice total with fallback to 0
  const getInvoiceTotal = () => {
    if (!invoice) return 0;
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };
  
  const total = invoice?.total || getInvoiceTotal();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">
            Issued on {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Invoice #{invoice.invoiceNumber}</CardDescription>
            </div>
            <Badge className={statusVariant}>
              {invoice.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bill To</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-900">
                    {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
                  </p>
                  {invoice.patient?.user?.email && (
                    <p className="text-sm text-gray-500">{invoice.patient.user.email}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm text-gray-500">Invoice #</div>
                  <div className="text-sm font-medium">{invoice.invoiceNumber}</div>
                  
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="text-sm">
                    {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                  </div>
                  
                  <div className="text-sm text-gray-500">Status</div>
                  <div>
                    <Badge className={statusVariant}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        {item.serviceId && (
                          <div className="text-gray-500">Service ID: {item.serviceId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      Subtotal
                    </th>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      ${invoice.subtotal?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                  {invoice.tax > 0 && (
                    <tr>
                      <th colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                        Tax
                      </th>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        ${invoice.tax?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Total
                    </th>
                    <td className="px-6 py-3 text-right text-base font-bold text-gray-900">
                      ${invoice.total?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {!isEditing && invoice.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1 text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button asChild>
            <Link href="/dashboard/billing">Back to Invoices</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
