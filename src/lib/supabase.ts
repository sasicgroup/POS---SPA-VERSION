
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ilhpnqcwrldnxoevcxer.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XLuTJnV4fhs4sLwHL0PMiQ_X54SZ5XA';

export const supabase = createClient(supabaseUrl, supabaseKey);
