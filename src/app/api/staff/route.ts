import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireRole } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const users = await db.raw.user.findMany({ where: { clinicId }, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true } });
    return NextResponse.json(users);
  } catch (err) {
    console.error('Failed to list staff', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // For creating staff we prefer using the invite flow already implemented
    const session = await requireRole(['ADMIN']);
    const { email, role } = await req.json();
    
    // Input validation
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' }, 
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      );
    }

    // Check if user already exists in the clinic
    const db = prismaScoped(session.user.clinicId as string);
    const existingUser = await db.raw.user.findFirst({
      where: { 
        email,
        clinicId: session.user.clinicId as string
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists in your clinic' },
        { status: 409 }
      );
    }

    // Delegate to existing invite route behavior
    const inviteUrl = new URL('/api/auth/invite', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    console.log('Sending invite request to:', inviteUrl.toString());
    
    const inviteRes = await fetch(inviteUrl.toString(), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      credentials: 'include',
      body: JSON.stringify({ email, role }),
    });
    
    const data = await inviteRes.json().catch(() => ({}));
    
    if (!inviteRes.ok) {
      console.error('Invite API error:', data);
      return NextResponse.json(
        { error: data?.error || 'Failed to send invitation' },
        { status: inviteRes.status || 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Invitation sent successfully',
      email 
    });
    
  } catch (err) {
    console.error('Failed to create staff invite:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
}
