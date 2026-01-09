-- Query to check how many stores exist in the database
SELECT COUNT(*) as total_stores FROM public.stores;

-- Also show all stores with their details
SELECT id, name, location, created_at FROM public.stores ORDER BY created_at DESC;
