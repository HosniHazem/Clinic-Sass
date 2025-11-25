"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string | null;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/services').then((r) => r.json()).then((data) => setServices(data || [])).catch((e) => toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' })).finally(() => setLoading(false));
  }, [toast]);

  async function handleDelete(id: string) {
    if (!confirm('Delete service?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Delete failed');
      setServices((s) => s.filter((x) => x.id !== id));
      toast({ title: 'Deleted', description: 'Service removed' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Available clinic services</p>
        </div>
        <div>
          <Link href="/dashboard/services/new"><Button>Create service</Button></Link>
        </div>
      </div>

      <div>
        {loading ? (
          <p>Loading…</p>
        ) : services.length === 0 ? (
          <p>No services yet.</p>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-muted-foreground">${s.price.toFixed(2)} • {s.duration}m</div>
                  {s.description && <div className="text-sm mt-1">{s.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/services/${s.id}/edit`} className="link">Edit</Link>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
