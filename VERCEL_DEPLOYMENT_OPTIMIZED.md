# Vercel Deployment Optimization Guide

This guide provides optimized deployment instructions for the BFF Gaming Tournament Platform on Vercel.

## Optimized Vercel Configuration

The `vercel.json` file has been optimized with the following improvements:

### 1. Memory and Performance Settings
```json
{
  "functions": {
    "server/index-improved.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### 2. Route Optimization
Routes are specifically configured to direct API calls to the correct endpoints:
- `/api/health` - Health check endpoint
- `/api/tournaments` - Tournament data endpoints
- `/api/registrations` - Registration endpoints
- `/api/admin` - Admin authentication and management
- `/api/activity-logs` - Activity logging endpoints

### 3. Build Configuration
```json
{
  "builds": [
    {
      "src": "server/index-improved.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["shared/**", "attached_assets/**", "drizzle.config.ts"],
        "memory": 1024,
        "maxLambdaSize": "50mb"
      }
    },
    {
      "src": "client/**",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ]
}
```

## Environment Variables Required

Set the following environment variables in your Vercel project settings:

1. `DATABASE_URL` - Your Neon PostgreSQL database connection string
2. `JWT_SECRET` - Secret key for JWT token generation
3. `JWT_EXPIRES_IN` - Token expiration time (e.g., "24h")
4. `SESSION_SECRET` - Secret for session management
5. `NODE_ENV` - Set to "production"
6. `FRONTEND_URL` - Your Vercel deployment URL

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel project settings
3. Configure the build command: `npm run build`
4. Configure the output directory: `dist`
5. Deploy!

## Performance Optimizations

1. **Serverless Function Memory**: Increased to 1024MB for better performance
2. **Lambda Size**: Set to 50MB to accommodate all dependencies
3. **Route Caching**: API routes are configured for optimal caching
4. **Static Assets**: Client-side assets are served from CDN

## Troubleshooting Common Issues

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set
- Verify database credentials and permissions
- Check if the database is accessible from Vercel

### Build Failures
- Check if all dependencies are properly listed in `package.json`
- Ensure the build script `npm run build` works locally
- Verify TypeScript compilation with `npm run check`

### Runtime Errors
- Check Vercel logs for detailed error messages
- Ensure environment variables are correctly set
- Verify file paths and imports in the codebase

## Best Practices

1. **Use Environment Variables**: Never hardcode sensitive information
2. **Monitor Function Duration**: Keep functions under the 30-second limit
3. **Optimize Database Queries**: Use indexes and efficient queries
4. **Implement Proper Error Handling**: Handle all possible error cases
5. **Use Caching**: Implement appropriate caching strategies for better performance

This optimized configuration ensures reliable and performant deployment of the BFF Gaming Tournament Platform on Vercel.