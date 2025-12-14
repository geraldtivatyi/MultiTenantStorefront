-- Migration: Add Pudo shipment tracking fields to orders table
-- This migration adds fields to track Pudo shipments and their tracking references

BEGIN;

-- Add Pudo shipment tracking fields to orders table
ALTER TABLE "orders" 
  ADD COLUMN IF NOT EXISTS "pudo_shipment_id" integer,
  ADD COLUMN IF NOT EXISTS "pudo_tracking_reference" text;

COMMENT ON COLUMN "orders"."pudo_shipment_id" IS 'Pudo shipment ID after creation';
COMMENT ON COLUMN "orders"."pudo_tracking_reference" IS 'Pudo tracking reference for customer tracking';

COMMIT;

