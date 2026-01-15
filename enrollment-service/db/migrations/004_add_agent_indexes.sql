-- Migration: Add indexes for faster agent lookups during lazy sync
-- Created: 2026-01-05
-- Description: Improves performance when checking if agent exists during enrollment creation

-- Add partial index for faster agent lookups (excluding deleted agents)
-- This improves performance when checking if agent exists during enrollment creation
CREATE INDEX IF NOT EXISTS idx_agents_id_active
ON agents(id)
WHERE deleted_at IS NULL;

-- Add index on license_number for potential future lookups
CREATE INDEX IF NOT EXISTS idx_agents_license_active
ON agents(license_number)
WHERE deleted_at IS NULL;

-- Add comment to document the purpose
COMMENT ON INDEX idx_agents_id_active IS 'Fast lookups for agent existence checks during enrollment creation';
COMMENT ON INDEX idx_agents_license_active IS 'Fast lookups by license number for agent verification';
