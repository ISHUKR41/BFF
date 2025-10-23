# Vercel Deployment Guide

## Prerequisites
- A Vercel account (sign up at https://vercel.com)
- PostgreSQL database (use Neon, Supabase, or Vercel Postgres)
- GitHub repository (optional, but recommended)

## Step 1: Prepare Your Database

### Option A: Using Neon (Recommended)
1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)
4. Save it for later - you'll need it as `DATABASE_URL`

### Option B: Using Vercel Postgres
1. In your Vercel dashboard, go to Storage
2. Create a new Postgres database
3. Copy the connection string
4. It will automatically be added to your environment variables

## Step 2: Deploy to Vercel

### Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the framework

3. **Configure Environment Variables**
   Click on "Environment Variables" and add:
   
   ```
   DATABASE_URL=postgresql://your_connection_string_here
   SESSION_SECRET=your-secure-random-string-here
   NODE_ENV=production
   ```

   **Generate a secure SESSION_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts and when asked about environment variables, add:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV=production`

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Initialize Database Schema

After your first deployment:

1. **Using Vercel Dashboard**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Verify `DATABASE_URL` is set

2. **Push Database Schema**
   
   You have two options:

   **Option A: Local Push (Recommended)**
   ```bash
   # Set the DATABASE_URL locally
   export DATABASE_URL="your_production_database_url"
   
   # Push schema to production database
   npm run db:push -- --force
   ```

   **Option B: Via Vercel CLI**
   ```bash
   vercel env pull .env.production
   npm run db:push -- --force
   ```

## Step 4: Create Admin Account

After deploying, the application will automatically create a default admin account:

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change the default password immediately after first login!**

To create a new admin or change password, you'll need to access your database and update the `admins` table directly.

## Step 5: Verify Deployment

1. **Visit your deployed site**
   - Your site will be available at `https://your-project-name.vercel.app`

2. **Test the following:**
   - Home page loads correctly
   - BGMI tournament page works
   - Free Fire tournament page works
   - Admin login works
   - Forms can be submitted
   - Dark mode toggle works

3. **Check Common Issues:**
   - If you see "Database not found" errors, verify DATABASE_URL is set correctly
   - If forms don't submit, check browser console for errors
   - If images don't load, verify the build completed successfully

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click on "Settings" → "Domains"
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

## Environment Variables Reference

### Required Variables
```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-64-character-random-string
NODE_ENV=production
```

### Optional Variables
```env
# If using custom admin credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

## Troubleshooting

### Build Fails
1. Check the build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Make sure TypeScript compiles locally: `npm run check`

### Database Connection Fails
1. Verify DATABASE_URL is correct
2. Check if your database allows connections from Vercel's IP ranges
3. Ensure SSL is enabled in connection string if required

### Forms Not Working
1. Check browser console for errors
2. Verify API routes are working: visit `/api/tournaments`
3. Check if CORS is blocking requests

### Images Not Loading
1. Verify images exist in `attached_assets/generated_images/`
2. Check if Vite build includes all assets
3. Clear browser cache and reload

## Production Best Practices

1. **Security**
   - Change default admin password immediately
   - Use strong SESSION_SECRET (at least 32 characters)
   - Enable HTTPS (Vercel does this automatically)

2. **Database**
   - Backup your database regularly
   - Monitor connection limits
   - Use connection pooling for high traffic

3. **Monitoring**
   - Check Vercel Analytics for performance
   - Monitor error logs in Vercel dashboard
   - Set up alerts for critical errors

4. **Updates**
   - Test changes locally before deploying
   - Use Vercel's preview deployments for testing
   - Keep dependencies updated

## Updating Your Deployment

1. **Make changes locally**
   ```bash
   git add .
   git commit -m "Update description"
   git push origin main
   ```

2. **Vercel auto-deploys** from main branch
   - Every push to main triggers a new deployment
   - Preview deployments are created for pull requests

3. **Manual deployment via CLI**
   ```bash
   vercel --prod
   ```

## Getting Help

- Vercel Documentation: https://vercel.com/docs
- Neon Documentation: https://neon.tech/docs
- GitHub Issues: Create an issue in your repository

## Success Checklist

- [ ] Database created and connection string obtained
- [ ] Environment variables configured in Vercel
- [ ] Code deployed successfully
- [ ] Database schema pushed
- [ ] Admin login works
- [ ] Tournament registration works for both games
- [ ] Admin dashboard displays registrations
- [ ] Dark mode works
- [ ] All pages load without errors
- [ ] Default admin password changed

---

**Congratulations! Your tournament website is now live! 🎉**

Your users can now:
- Register for BGMI and Free Fire tournaments
- See real-time slot availability
- Submit payment proofs
- View tournament rules and prizes

Admin can:
- Review and approve registrations
- Manage tournaments
- View analytics
- Export data to Excel
