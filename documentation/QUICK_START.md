# Quick Start: Update Credentials & Deploy

## Step 1: Update Supabase Credentials

### Option A: Using Environment Variables (Recommended)

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Option B: Update Hardcoded Values

Edit `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'https://your-new-project-id.supabase.co';
const supabaseKey = 'your-new-anon-key';
```

## Step 2: Setup Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run this file:
   - `database_setup.sql`

## Step 3: Rebuild

```bash
npm run build
```

This creates the `/out` folder with your production files.

## Step 4: Deploy

### Quick Deploy to Vercel
```bash
npx vercel --prod
```

### Quick Deploy to Netlify
```bash
npx netlify-cli deploy --prod --dir=out
```

### Manual Deploy
Upload the `/out` folder to any static hosting service.

## Step 5: Test

Visit your deployed URL and test:
- Login functionality
- Dashboard loads
- POS/Sales works
- Data fetches correctly

---

## GitHub Setup (Optional)

```bash
# Initialize git (if not already done)
git init

# Add your new remote
git remote add origin https://github.com/yourusername/your-repo.git

# Commit and push
git add .
git commit -m "SPA version ready for deployment"
git push -u origin main
```

---

**That's it!** Your SPA is ready to use. 🎉
