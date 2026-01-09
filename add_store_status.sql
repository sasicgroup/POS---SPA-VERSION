-- Add status column to stores table for archive/hide functionality
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'hidden'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
