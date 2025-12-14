BEGIN;

-- Add customer_phone column to orders table
ALTER TABLE "orders" 
  ADD COLUMN IF NOT EXISTS "customer_phone" text;

COMMENT ON COLUMN "orders"."customer_phone" IS 'Customer phone number for notifications';

COMMIT;

