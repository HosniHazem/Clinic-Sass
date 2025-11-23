"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type Staff = { id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch('/api/staff').then((r) => r.json()).then((data) => setStaff(data || [])).catch(() => toast({ title: 'Error', description: 'Failed to load staff', variant: 'destructive' })).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Remove staff user?')) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Delete failed');
      setStaff((s) => s.filter((x) => x.id !== id));
      toast({ title: 'Removed', description: 'Staff removed' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground">Clinic staff and users</p>
        </div>
        <div>
          <Link href="/dashboard/staff/new"><Button>Add staff</Button></Link>
        </div>
      </div>

      <div>
        {loading ? <p>Loading…</p> : staff.length === 0 ? <p>No staff members yet.</p> : (
          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{s.firstName} {s.lastName}</div>
                  <div className="text-sm text-muted-foreground">{s.email} • {s.role}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/staff/${s.id}/edit`} className="link">Edit</Link>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
