-- Migration: Convert Multi-Tenant to Single-Tenant Store
-- This migration converts the database from multi-tenant to single-tenant architecture

BEGIN;

-- Step 1: Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  whatsapp_phone TEXT,
  delivery_options TEXT[] DEFAULT ARRAY['collection', 'pudo'],
  pudo_collection_address JSONB,
  pudo_preferred_locker TEXT,
  about_story TEXT,
  about_values JSONB,
  about_stats JSONB,
  about_images JSONB,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  store_hours JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Migrate data from first tenant to store_settings (if tenants exist)
-- This assumes you want to preserve data from the first active tenant
INSERT INTO store_settings (
  name, description, address, hero_title, hero_subtitle, hero_image_url,
  whatsapp_phone, delivery_options, pudo_collection_address, pudo_preferred_locker,
  about_story, about_values, about_stats, about_images,
  contact_email, contact_phone, contact_address, store_hours
)
SELECT 
  name, description, address, hero_title, hero_subtitle, hero_image_url,
  whatsapp_phone, delivery_options, pudo_collection_address, pudo_preferred_locker,
  about_story, about_values, about_stats, about_images,
  contact_email, contact_phone, contact_address, store_hours
FROM tenants
WHERE is_active = true
ORDER BY id
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 3: Remove tenantId foreign key constraints and columns
-- First, drop foreign key constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_id_tenants_id_fk;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tenant_id_tenants_id_fk;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tenant_id_tenants_id_fk;

-- Step 4: Remove tenantId columns
ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE orders DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;

-- Step 5: Drop tenants table
DROP TABLE IF EXISTS tenants CASCADE;

-- Step 6: Update user roles - remove tenant_owner role
-- Convert any remaining tenant_owner users to platform_admin role
-- In single-tenant setup, store owners should have platform_admin access
UPDATE users SET role = 'platform_admin' WHERE role = 'tenant_owner';

COMMIT;

-- Note: After running this migration, you should:
-- 1. Update your application code to use store_settings instead of tenants
-- 2. Test all functionality to ensure everything works correctly
-- 3. Verify that all products, orders, and users are accessible without tenant filtering

