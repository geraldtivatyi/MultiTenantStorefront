-- Migration: Fix Store Owner Role
-- This migration fixes users who were incorrectly converted from tenant_owner to customer
-- during the single-tenant conversion. Store owners should have platform_admin role.

BEGIN;

-- Convert tenant_owner users to platform_admin (if they were incorrectly set to customer)
-- This handles cases where the migration was run before the fix
UPDATE users 
SET role = 'platform_admin' 
WHERE role = 'tenant_owner';

-- If you have a specific user who should be the store owner, you can update them directly:
-- UPDATE users SET role = 'platform_admin' WHERE email = 'your-store-owner-email@example.com';

-- Alternative: Convert the first user (typically the original store owner) to platform_admin
-- if no platform_admin exists yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'platform_admin') THEN
    UPDATE users 
    SET role = 'platform_admin' 
    WHERE id = (SELECT id FROM users ORDER BY id ASC LIMIT 1);
  END IF;
END $$;

COMMIT;

