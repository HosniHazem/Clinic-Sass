import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

// GET - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const user = await db.raw.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);
    const body = await req.json();

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, ...updateData } = parsed.data;
    const updatePayload: any = { ...updateData };

    // Handle password change if both current and new passwords are provided
    if (currentPassword && newPassword) {
      // In a real app, you would verify the current password first
      // This is a simplified example
      const user = await db.raw.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // TODO: Verify current password matches
      // if (!verifyPassword(currentPassword, user.password)) {
      //   return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      // }

      // In a real app, you would hash the new password
      // updatePayload.password = await hashPassword(newPassword);
    } else if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      return NextResponse.json(
        { error: 'Both current and new password are required to change password' },
        { status: 400 }
      );
    }

    const updatedUser = await db.raw.user.update({
      where: { id: session.user.id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
