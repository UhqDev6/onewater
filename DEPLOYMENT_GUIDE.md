# Deployment Guide - Vercel

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com with GitHub)
- Your project pushed to GitHub repository

## Step 1: Prepare Your Project

### 1.1 Test Production Build Locally
```bash
# Build the project
npm run build

# Test production server
npm run start
```

Visit `http://localhost:3000` and verify everything works.

### 1.2 Generate Secure Token
```bash
# Generate a random secure token (macOS/Linux)
openssl rand -base64 32
```

Copy the output. You'll need this for `REVALIDATE_TOKEN`.

### 1.3 Verify Environment Variables
Check your `.env.local` file has all required variables:

```env
# Required for Vercel deployment
NSW_BEACHWATCH_API_URL=https://beachwatch.nsw.gov.au/arcgis/rest/services/map/BeachwatchRatings/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson

# Optional - customize if needed
API_CACHE_DURATION=3600
API_TIMEOUT=10000
API_RETRY_COUNT=3
API_RETRY_BACKOFF=1000

# Generate with: openssl rand -base64 32
REVALIDATE_TOKEN=your-secure-token-here
```

### 1.4 Commit and Push to GitHub
```bash
# Add all changes
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Push to GitHub
git push origin main
```

## Step 2: Deploy to Vercel

### 2.1 Import Project
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js settings ✅

### 2.2 Configure Environment Variables
Before clicking "Deploy", add these environment variables:

| Name | Value |
|------|-------|
| `NSW_BEACHWATCH_API_URL` | `https://beachwatch.nsw.gov.au/arcgis/rest/services/map/BeachwatchRatings/MapServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson` |
| `API_CACHE_DURATION` | `3600` |
| `API_TIMEOUT` | `10000` |
| `API_RETRY_COUNT` | `3` |
| `API_RETRY_BACKOFF` | `1000` |
| `REVALIDATE_TOKEN` | `<your-generated-token>` |

**Important**: Click "Add" after each variable!

### 2.3 Deploy Settings (Auto-detected)
Vercel automatically sets:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

Leave these as default. Click **"Deploy"**.

### 2.4 Wait for Deployment
- Initial build takes 2-3 minutes
- Watch the build logs in real-time
- Vercel will show a success screen with your URL

## Step 3: Test Your Deployment

### 3.1 Visit Your App
Your app is now live at: `https://your-project-name.vercel.app`

Test these pages:
- ✅ Landing page: `/`
- ✅ Dashboard: `/dashboard`
- ✅ About: `/about`
- ✅ Data Sources: `/data-sources`

### 3.2 Test API Endpoints
```bash
# Test NSW Beachwatch proxy
curl https://your-project-name.vercel.app/api/nsw-beachwatch

# Test cache revalidation (use your token)
curl -X POST https://your-project-name.vercel.app/api/revalidate \
  -H "Authorization: Bearer YOUR_REVALIDATE_TOKEN"
```

### 3.3 Check Map Functionality
1. Go to Dashboard
2. Verify 245 beach markers appear
3. Click a marker → check popup shows data
4. Test filters (Good/Fair/Poor/Bad)
5. Switch to Grid view

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your domain (e.g., `onewater.com`)
3. Vercel provides DNS records

### 4.2 Update DNS
Add these records at your domain registrar:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record (www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wait 5-60 minutes** for DNS propagation.

### 4.3 Automatic HTTPS
Vercel automatically provisions SSL certificate (Let's Encrypt).

## Step 5: Ongoing Maintenance

### 5.1 Automatic Deployments
Every `git push` to `main` branch triggers:
- Automatic build
- Automatic deployment
- Zero downtime

### 5.2 Preview Deployments
Every Pull Request gets:
- Unique preview URL
- Independent environment
- Test before merging

### 5.3 Monitor Performance
Vercel Dashboard shows:
- Request count
- Error rate
- Build history
- Analytics (upgrade to Pro for detailed metrics)

### 5.4 Manual Cache Revalidation
When NSW data updates urgently:

```bash
curl -X POST https://your-project-name.vercel.app/api/revalidate \
  -H "Authorization: Bearer YOUR_REVALIDATE_TOKEN"
```

This clears ISR cache for `/dashboard` and `/`.

### 5.5 Rollback if Needed
In Vercel dashboard:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

Instant rollback in seconds.

## Step 6: Performance Optimization

### 6.1 Verify Edge Caching
Check response headers:

```bash
curl -I https://your-project-name.vercel.app/api/nsw-beachwatch
```

Look for:
- `x-vercel-cache: HIT` (cached)
- `x-response-time: XXms` (your performance logging)

### 6.2 Enable Analytics (Optional)
Upgrade to Vercel Pro ($20/month) for:
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Detailed performance insights
- 1TB bandwidth (vs 100GB free)

### 6.3 Monitor NSW API
If NSW API goes down:
- Your retry logic attempts 3 times
- Returns 503 Service Unavailable
- Logs error details (check Vercel logs)

## Troubleshooting

### Build Fails
**Check:**
1. `npm run build` works locally?
2. All dependencies in `package.json`?
3. TypeScript errors? Run `npm run type-check`

**Solution:** Check build logs in Vercel dashboard.

### Environment Variables Not Working
**Check:**
1. All variables added in Vercel dashboard?
2. No typos in variable names?
3. Click "Redeploy" after adding variables

**Solution:** Vercel → Settings → Environment Variables → verify all exist.

### Map Not Loading
**Check:**
1. Browser console for errors
2. `/api/nsw-beachwatch` returns data?
3. Leaflet CSS loading? (should auto-load)

**Solution:** Test API endpoint separately with curl.

### 404 on Custom Routes
**Check:**
1. App Router structure correct?
2. Files named `page.tsx`?
3. Vercel detected Next.js correctly?

**Solution:** Should auto-detect, check vercel.json not overriding routes.

## Security Checklist

Before going live:
- ✅ REVALIDATE_TOKEN is random (32+ characters)
- ✅ No sensitive data in client-side code
- ✅ .env.local is gitignored (never commit secrets)
- ✅ API routes return appropriate status codes
- ✅ Zod validation on all external data
- ✅ CORS headers configured (if using from other domains)

## Cost Estimate

**Vercel Free Tier Limits:**
- 100GB bandwidth/month
- Unlimited API requests
- Unlimited deployments
- 100 GB-hours serverless function execution

**Your App Usage:**
- NSW API response: ~500KB (gzipped)
- Dashboard page: ~200KB
- Estimate: **~20,000 visits/month** on free tier

**When to Upgrade to Pro ($20/month):**
- > 100GB bandwidth
- Need advanced analytics
- Priority support
- Remove Vercel branding

## Next Steps After Deployment

1. **Share your URL**: `https://your-project-name.vercel.app`
2. **Monitor for 24 hours**: Check Vercel dashboard for errors
3. **Test on mobile**: Verify responsive design
4. **Add to README**: Document live URL
5. **Consider custom domain**: More professional
6. **Set up monitoring**: Integrate Sentry (optional)

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Community**: https://vercel.com/community
- **Your project GitHub issues**: For bug reports

---

## Quick Reference Commands

```bash
# Local testing
npm run build && npm run start

# Generate token
openssl rand -base64 32

# Test production API
curl https://your-app.vercel.app/api/nsw-beachwatch

# Revalidate cache
curl -X POST https://your-app.vercel.app/api/revalidate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check deployment status
vercel ls

# Pull environment variables
vercel env pull
```

---

**Your app is now production-ready! 🚀**

Any issues? Check Vercel logs first: Dashboard → Deployments → Click deployment → View Function Logs
