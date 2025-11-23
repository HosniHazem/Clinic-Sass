"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ItemSchema = z.object({ description: z.string().min(1), quantity: z.number().int().min(1), unitPrice: z.number().nonnegative() });
const InvoiceSchema = z.object({ patientId: z.string().min(1), items: z.array(ItemSchema).min(1), tax: z.number().min(0).optional(), notes: z.string().optional().nullable() });

export default function NewBillingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ patientId: '', notes: '' });
  const [patients, setPatients] = useState<any[]>([]);
  const [items, setItems] = useState([{ description: '', quantity: '1', unitPrice: '0.00' }]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/patients');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPatients(data || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const parsedItems = items.map((it) => ({ description: it.description, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) }));
      const payload = { patientId: form.patientId, items: parsedItems, tax: 0, notes: form.notes };
      const parsed = InvoiceSchema.safeParse(payload);
      if (!parsed.success) {
        const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Validation failed';
        throw new Error(first);
      }
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create invoice');
      toast({ title: 'Created', description: 'Invoice created' });
      router.push('/dashboard/billing');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  function updateItem(i: number, key: string, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  function addItem() {
    setItems((p) => [...p, { description: '', quantity: '1', unitPrice: '0.00' }]);
  }

  function removeItem(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Create Invoice</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="patientId">Patient</Label>
          <Select value={form.patientId} onValueChange={(val) => setForm((p) => ({ ...p, patientId: val }))}>
            <SelectTrigger>
              <SelectValue placeholder={patients.length ? 'Select patient' : 'Loading...'} />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.user?.firstName || p.user?.email ? `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.user?.email : p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Items</Label>
          <div className="space-y-2 mt-2">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Input placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <Input type="number" step="0.01" placeholder="Unit price" value={it.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} />
                </div>
                <div className="col-span-1">
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-600">×</button>
                </div>
              </div>
            ))}
            <div>
              <button type="button" onClick={addItem} className="text-blue-600">+ Add item</button>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Create'}</Button>
        </div>
      </form>
    </div>
  );
}
