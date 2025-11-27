import { NextResponse } from 'next/server';
import { prismaScoped } from '@/lib/prisma-scoped';

export async function GET() {
  try {
    // Check database connection
    const db = prismaScoped('health-check');
    await db.raw.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
