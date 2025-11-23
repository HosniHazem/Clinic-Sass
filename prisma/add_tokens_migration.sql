-- Migration: add tokens tables for password reset and invites
-- Run with: `psql $DATABASE_URL -f prisma/add_tokens_migration.sql` or use Prisma migrate

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  clinic_id TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_clinic ON password_reset_tokens(clinic_id);

CREATE TABLE IF NOT EXISTS invite_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  clinic_id TEXT NOT NULL,
  invited_by TEXT,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_email ON invite_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invite_clinic ON invite_tokens(clinic_id);
