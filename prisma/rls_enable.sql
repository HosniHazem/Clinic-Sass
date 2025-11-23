-- Row Level Security (RLS) policies for MedFlow multi-tenant enforcement
-- IMPORTANT: After applying these policies, your application must set
-- the session setting `medflow.current_clinic` to the active clinic id
-- for the current DB session before executing queries. Example:
--   SELECT set_config('medflow.current_clinic', 'clinic-id', true);

-- Enable RLS and add policy for tables with clinic_id
DO $$
BEGIN
  -- List of tables to enable RLS on
  PERFORM 1;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Ensure this script runs in a DB migration context.';
END$$;

-- Enable RLS and create policy for each tenant-owned table
-- Users table: allow access only to rows belonging to the clinic
ALTER TABLE IF EXISTS clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

-- Generic tenant isolation policy using session variable medflow.current_clinic
-- Note: this policy expects the application to set the session variable
-- with: SELECT set_config('medflow.current_clinic', '<clinicId>', true);

CREATE POLICY tenant_isolation_on_users ON users
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_patients ON patients
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_doctors ON doctors
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_services ON services
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_appointments ON appointments
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_consultations ON consultations
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_prescriptions ON prescriptions
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_invoices ON invoices
  USING (clinic_id = current_setting('medflow.current_clinic', true));

CREATE POLICY tenant_isolation_on_payments ON payments
  USING (clinic_id = current_setting('medflow.current_clinic', true));

-- Allow superuser-like DB roles (optional) to bypass RLS if needed
-- CREATE POLICY admin_bypass ON users USING (current_user = 'db_admin');

-- End of RLS script
