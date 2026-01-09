-- COMPLETE DATABASE SETUP SCRIPT
-- This script merges all previous migration files into a single execution flow.
-- Run this in your Supabase SQL Editor to set up the entire database.

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Base Tables
create table if not exists public.stores (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    location text,
    currency text default 'GHS',
    tax_settings jsonb default '{"enabled": true, "type": "percentage", "value": 12.5}'::jsonb,
    receipt_prefix text DEFAULT 'TRX',
    receipt_suffix text DEFAULT '',
    role_permissions jsonb,
    payment_settings jsonb DEFAULT '{
        "default_provider": "hubtel",
        "hubtel": { "enabled": false, "api_id": "", "api_key": "" },
        "paystack": { "enabled": false, "public_key": "", "secret_key": "" }
    }'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.employees (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete cascade,
    name text not null,
    role text check (role in ('owner', 'manager', 'staff', 'associate')), -- 'associate' included for legacy support, will be migrated
    pin text not null,
    email text,
    phone text,
    username text unique,
    salary numeric default 0,
    avatar text,
    avatar_url text, -- alias for avatar
    shift_start time,
    shift_end time,
    work_days text[] DEFAULT '{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}',
    failed_attempts int DEFAULT 0,
    is_locked boolean DEFAULT false,
    otp_enabled boolean DEFAULT true,
    otp_code text,
    otp_expiry timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete cascade,
    name text not null,
    category text not null,
    price numeric not null,
    cost_price numeric DEFAULT 0,
    stock integer default 0,
    status text DEFAULT 'In Stock',
    sku text,
    barcode text,
    expiry_date date,
    image text,
    video text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.customers (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete cascade,
    name text not null,
    phone text,
    email text,
    total_spent numeric default 0,
    points integer default 0,
    total_visits int DEFAULT 0,
    last_visit timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.sales (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete cascade,
    employee_id uuid references public.employees(id),
    customer_id uuid references public.customers(id),
    total_amount numeric not null,
    tax_amount numeric default 0,
    discount_amount numeric default 0,
    payment_method text not null,
    status text default 'completed',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.sale_items (
    id uuid default uuid_generate_v4() primary key,
    sale_id uuid references public.sales(id) on delete cascade,
    product_id uuid references public.products(id),
    quantity integer not null,
    price_at_sale numeric not null,
    subtotal numeric not null
);

create table if not exists public.payroll_runs (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete cascade,
    month text not null,
    total_amount numeric not null,
    employees_paid_count integer not null,
    status text default 'Completed',
    run_date timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.app_settings (
    store_id uuid references public.stores(id) primary key,
    sms_config jsonb,
    whatsapp_config jsonb
);

-- 3. Create Additional Tables (from migrations.sql)

create table if not exists public.employee_access (
    id uuid default uuid_generate_v4() primary key,
    employee_id uuid references public.employees(id) on delete cascade,
    store_id uuid references public.stores(id) on delete cascade,
    role text check (role in ('owner', 'manager', 'staff')), 
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(employee_id, store_id)
);

create table if not exists public.expenses (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete cascade,
    category text not null,
    amount numeric not null,
    description text,
    date date default CURRENT_DATE,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.activity_logs (
    id uuid default uuid_generate_v4() primary key,
    store_id uuid references public.stores(id) on delete set null,
    user_id uuid references public.employees(id) on delete set null,
    action text not null,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loyalty_programs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    points_per_currency numeric DEFAULT 1,
    redemption_rate numeric DEFAULT 0.05,
    min_points_to_redeem int DEFAULT 100,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    points int NOT NULL,
    type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    min_points int DEFAULT 0,
    benefits text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, name)
);

CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
    status TEXT NOT NULL DEFAULT 'sent'
);

-- 4. Apply Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON public.notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_loyalty_logs_customer_id ON public.loyalty_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_store_id ON public.sms_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at DESC);

-- 5. Data Backfills / Logic
-- Ensure initial store exists if table is empty
INSERT INTO public.stores (name, location)
SELECT 'My Awesome Store', 'Accra, Ghana'
WHERE NOT EXISTS (SELECT 1 FROM public.stores);

-- Migrate 'associate' roles to 'staff'
UPDATE public.employees SET role = 'staff' WHERE role = 'associate';

-- Backfill Employee Access
insert into public.employee_access (employee_id, store_id, role)
select id, store_id, role from public.employees
where role != 'associate' -- Assuming they are already converted or handled
on conflict do nothing;

-- 6. RLS Policies
-- Enable RLS on all tables
alter table public.stores enable row level security;
alter table public.employees enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.customers enable row level security;
alter table public.sale_items enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.app_settings enable row level security;
alter table public.sms_logs enable row level security;

-- Public Access Policies (For simplicity/prototype, matching previous schema)
-- WARNING: In production, you should restrict these based on auth.uid()
create policy "Public Access" on public.stores for all using (true);
create policy "Public Access" on public.employees for all using (true);
create policy "Public Access" on public.products for all using (true);
create policy "Public Access" on public.customers for all using (true);
create policy "Public Access" on public.sales for all using (true);
create policy "Public Access" on public.sale_items for all using (true);
create policy "Public Access" on public.payroll_runs for all using (true);
create policy "Public Access" on public.app_settings for all using (true);

-- Specific policy for sms_logs from the fix
CREATE POLICY "Allow public access to sms_logs" ON "public"."sms_logs"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- End of Setup
