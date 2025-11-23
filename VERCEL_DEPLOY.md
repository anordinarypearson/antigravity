# Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy the project:**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Choose your account
- Link to existing project? **No** (first time)
- What's your project's name? **scholarsage** (or your preferred name)
- In which directory is your code located? **./** (default)
- Want to override the settings? **No** (it will auto-detect Next.js)

4. **Set environment variables:**
```bash
vercel env add SAMBANOVA_API_KEY
vercel env add SAMBANOVA_BASE_URL
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... add all other env vars from .env.local
```

5. **Deploy to production:**
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "Add New" → "Project"
4. Import your Git repository (GitHub/GitLab/Bitbucket)
5. Configure:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: **./**
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add Environment Variables:
   - `SAMBANOVA_API_KEY`
   - `SAMBANOVA_BASE_URL`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
7. Click "Deploy"

## Post-Deployment

Your app will be available at: `https://your-project-name.vercel.app`

### Continuous Deployment
- Every push to your main branch will auto-deploy to production
- Pull requests will get preview deployments

### Custom Domain (Optional)
1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

**Build fails?**
- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

**Runtime errors?**
- Check Vercel function logs
- Verify API keys are correct
- Ensure serverless function timeout limits are adequate

## Monitoring

Access your deployment logs at:
```
https://vercel.com/your-username/your-project/deployments
```

---

**Need help?** Check [Vercel Documentation](https://vercel.com/docs)
