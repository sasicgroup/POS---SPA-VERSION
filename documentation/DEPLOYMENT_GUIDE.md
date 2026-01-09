# Deployment Guide - Store Management SPA

## ✅ Build Status: SUCCESS

Your Store Management System has been successfully built as a **Single Page Application (SPA)**.

### Build Output
- **Location**: `/out` directory
- **Total Files**: 181 static files
- **Size**: Optimized for production
- **Pages Generated**: 17 routes

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Netlify
1. Drag and drop the `/out` folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or use Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=out
```

### Option 3: GitHub Pages
1. Push your code to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose the branch with `/out` folder
5. Or use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

### Option 4: AWS S3 + CloudFront
```bash
# Install AWS CLI
aws s3 sync out/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 5: Any Static Host
Simply upload the contents of the `/out` folder to:
- Firebase Hosting
- Cloudflare Pages
- Render
- Railway
- DigitalOcean App Platform

## Environment Variables for Production

Before deploying to a new Supabase instance, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_new_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_supabase_anon_key
```

Then rebuild:
```bash
npm run build
```

## Testing the Build Locally

You can test the production build locally:

```bash
# Option 1: Using serve
npx serve out

# Option 2: Using http-server
npx http-server out

# Option 3: Using Python
cd out
python -m http.server 8000
```

Then visit `http://localhost:8000` (or the port shown)

## Post-Deployment Checklist

- [ ] Update Supabase credentials
- [ ] Run database migrations on new Supabase project
- [ ] Test login functionality
- [ ] Verify all pages load correctly
- [ ] Test POS/Sales functionality
- [ ] Check payment integrations (Hubtel, Paystack)
- [ ] Verify data fetching works
- [ ] Test on mobile devices

## Database Setup

Your new Supabase project needs these tables. Run the migrations:

1. Go to your Supabase project → SQL Editor
2. Run `database_setup.sql` (This merged file contains all necessary table definitions, migrations, and fixes in the correct order)

## Custom Domain (Optional)

Most hosting providers allow custom domains:

1. **Vercel**: Settings → Domains → Add Domain
2. **Netlify**: Site Settings → Domain Management
3. **GitHub Pages**: Settings → Pages → Custom Domain
4. **Cloudflare Pages**: Custom Domains tab

## Performance Tips

### Enable Caching
Add these headers to your hosting provider:

```
Cache-Control: public, max-age=31536000, immutable  # For /_next/static/*
Cache-Control: public, max-age=3600                  # For HTML files
```

### Enable Compression
Most hosts enable this by default, but verify:
- Gzip or Brotli compression
- Minification (already done by Next.js)

### CDN
Use a CDN for global distribution:
- Vercel has built-in CDN
- Netlify has built-in CDN
- CloudFront for AWS S3
- Cloudflare for any host

## Monitoring & Analytics

Consider adding:
- Google Analytics
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics (if using Vercel)

## Rollback Strategy

Keep your previous builds:
```bash
# Before new deployment
cp -r out out-backup-$(date +%Y%m%d)
```

## Support & Troubleshooting

### Common Issues

**Issue**: White screen after deployment
- **Fix**: Check browser console for errors
- **Fix**: Verify Supabase credentials are correct
- **Fix**: Ensure all environment variables are set

**Issue**: 404 on refresh
- **Fix**: Configure your host for SPA routing (redirect all to index.html)

**Issue**: API calls failing
- **Fix**: Check CORS settings in Supabase
- **Fix**: Verify Supabase URL is correct

## Next Steps

1. **Provide New Credentials**: Share your new Supabase and GitHub details
2. **Update Environment Variables**: Update `.env.local` with new values
3. **Rebuild**: Run `npm run build` with new credentials
4. **Deploy**: Choose a deployment option above
5. **Test**: Thoroughly test all functionality

---

**Ready to Deploy!** 🚀

The `/out` folder contains your complete, production-ready SPA.
