import { prisma } from './prisma';

/**
 * Set the Postgres session variable used by RLS policies.
 *
 * Note: This executes a SQL `select set_config(...)` on the current connection.
 * Due to connection pooling this may not always affect subsequent queries
 * executed on a different pooled connection. For reliable RLS enforcement
 * ensure this is run on the same connection (e.g. inside a transaction) or
 * configure the DB connection to set the parameter on connect.
 */
export async function setCurrentClinic(clinicId: string | undefined | null) {
  if (!clinicId) return;
  try {
    // set_config returns the previous value; we don't need it here
    await prisma.$executeRawUnsafe(`select set_config('medflow.current_clinic', '${clinicId}', true);`);
  } catch (err) {
    console.warn('Failed to set DB session clinic id for RLS:', err);
  }
}

/**
 * Run a callback inside a Prisma transaction where the session variable
 * `medflow.current_clinic` is set on the same connection. This increases
 * the chance RLS policies will see the clinic id for the transaction.
 *
 * Usage:
 *   await runWithClinicTransaction('clinic-id', async (tx) => {
 *     await tx.invoice.create({...});
 *   });
 */
export async function runWithClinicTransaction<T>(clinicId: string, cb: (tx: any) => Promise<T>): Promise<T> {
  if (!clinicId) throw new Error('clinicId required for runWithClinicTransaction');
  return prisma.$transaction(async (tx) => {
    try {
      await tx.$executeRawUnsafe(`select set_config('medflow.current_clinic', '${clinicId}', true);`);
    } catch (err) {
      console.warn('Failed to set session clinic in transaction', err);
    }
    return cb(tx);
  });
}
