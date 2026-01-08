
-- 12. Create SMS Logs table
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
    status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users based on store_id" ON "public"."sms_logs"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (store_id IN (
    SELECT store_id FROM employees WHERE user_id = auth.uid()
    UNION
    SELECT id FROM stores WHERE owner_id = auth.uid()
));

CREATE POLICY "Enable insert access for authenticated users" ON "public"."sms_logs"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);
