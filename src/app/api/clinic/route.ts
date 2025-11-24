import { NextRequest, NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';
import { requireRole } from '@/lib/auth-utils';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'DOCTOR', 'RECEPTIONIST']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);

    const clinic = await db.raw.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        description: true,
        settings: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (err) {
    console.error('Error fetching clinic:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN']);
    const clinicId = session.user.clinicId as string;
    const db = prismaScoped(clinicId);
    
    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type');
    let body: any = {};
    let logoData: { logo?: string } = {};

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      
      // Get the logo file if it exists
      const logoFile = formData.get('logo') as File | null;
      
      // Handle file upload if a new logo is provided
      if (logoFile && logoFile instanceof File) {
        // In a real app, you would upload the file to a storage service here
        // For now, we'll just store the file name
        logoData.logo = `/${Date.now()}-${logoFile.name}`;
      } else if (typeof logoFile === 'string') {
        // If it's a string, it's the existing logo URL
        logoData.logo = logoFile;
      }
      
      // Get the form data
      const formDataJson = formData.get('data');
      if (formDataJson && typeof formDataJson === 'string') {
        try {
          body = JSON.parse(formDataJson);
        } catch (e) {
          console.error('Error parsing form data:', e);
          return NextResponse.json(
            { error: 'Invalid form data' },
            { status: 400 }
          );
        }
      }
    } else {
      // Handle regular JSON request
      body = await req.json();
    }

    const ClinicUpdateSchema = z.object({
      name: z.string().min(1, 'Clinic name is required'),
      address: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().email('Invalid email').optional().nullable(),
      description: z.string().optional().nullable(),
      settings: z.record(z.any()).optional(),
    });

    const parsed = ClinicUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...parsed.data,
      settings: parsed.data.settings ? JSON.stringify(parsed.data.settings) : undefined,
    };

    // Add logo data if available
    if (logoData.logo !== undefined) {
      updateData.logo = logoData.logo;
    }

    const updatedClinic = await db.raw.clinic.update({
      where: { id: clinicId },
      data: updateData,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        description: true,
        settings: true,
      },
    });

    // Parse settings JSON string back to object
    const response = {
      ...updatedClinic,
      settings: updatedClinic.settings ? JSON.parse(updatedClinic.settings as string) : {},
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error updating clinic:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
