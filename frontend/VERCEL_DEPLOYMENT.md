# Vercel Deployment Guide for Frontend

## Prerequisites
- Vercel account (free tier works)
- GitHub repository connected

## Deployment Methods

### Method 1: Vercel CLI (Recommended for testing)
```bash
# Install Vercel CLI globally
npm i -g vercel

# From the frontend directory
cd 6_Agent_Deployment/frontend

# Deploy to Vercel
vercel

# Follow prompts:
# - Link to existing project or create new
# - Confirm directory
# - Override settings if needed
```

### Method 2: GitHub Integration (Recommended for production)

1. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select `6_Agent_Deployment/frontend` as root directory

2. **Configure Build Settings**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

3. **Set Environment Variables**
   Required variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://api.bizwizardai.com
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Method 3: Direct Import

```bash
# From the frontend directory
cd 6_Agent_Deployment/frontend

# Build the project
npm install
npm run build

# Deploy to Vercel with production settings
vercel --prod
```

## Environment Variables Configuration

In Vercel Dashboard → Settings → Environment Variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.bizwizardai.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Override API endpoints
NEXT_PUBLIC_AGENT_API_URL=https://api.bizwizardai.com
```

## Custom Domain Setup

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., `app.bizwizardai.com`)
3. Configure DNS:
   - CNAME record: `app` → `cname.vercel-dns.com`
   - Or A record pointing to Vercel's IPs

## Automatic Deployments

With GitHub integration:
- Push to `main` branch → Production deployment
- Pull requests → Preview deployments

## Build Optimization

The `next.config.js` is already configured for optimal builds:
- Standalone output
- SWC minification
- React strict mode

## Advantages of Vercel for Next.js

1. **Zero Configuration** - Automatic optimization
2. **Edge Functions** - Global CDN deployment
3. **Preview Deployments** - Every PR gets a preview URL
4. **Analytics** - Built-in Web Vitals monitoring
5. **Image Optimization** - Automatic next/image optimization
6. **ISR Support** - Incremental Static Regeneration

## Troubleshooting

### Build Failures
- Check environment variables are set
- Ensure all dependencies are in package.json
- Review build logs in Vercel dashboard

### Runtime Errors
- Verify API_URL points to correct backend
- Check CORS settings on backend API
- Ensure Supabase credentials are correct

### Performance Issues
- Enable Vercel Analytics
- Check bundle size with `next build`
- Use Vercel's Speed Insights

## Cost Considerations

Free tier includes:
- 100GB bandwidth/month
- Unlimited deployments
- SSL certificates
- Preview deployments

Pro features ($20/month):
- Team collaboration
- Password protection
- Advanced analytics
- Priority support

## Monitoring

Enable in Vercel Dashboard:
- Web Analytics (free)
- Speed Insights (free tier available)
- Log drains for debugging

## Alternative: Keep Frontend on Render

If you prefer to keep everything on Render:
- Update render.yaml to use Node.js runtime (already done)
- Ensure proper health checks
- Configure domains in Render dashboard

Vercel is recommended for Next.js apps due to native optimization and superior DX.