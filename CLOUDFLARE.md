# Deploying to Cloudflare Pages

This guide will help you deploy Twister Blitz to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account
2. A GitHub/GitLab repository with your code
3. An OpenAI API key

## Deployment Steps

### 1. Push Your Code to Git

Make sure your code is pushed to a Git repository (GitHub, GitLab, etc.).

### 2. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect your Git repository
4. Configure the build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (or your project root)

### 3. Set Environment Variables

In Cloudflare Pages settings, add these environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key
- `NODE_ENV` - Set to `production` for production builds

**Note**: Cloudflare Pages supports environment variables in the dashboard under your project's **Settings** → **Environment variables**.

### 4. Deploy

Cloudflare will automatically build and deploy your application. The build process will:
- Install dependencies
- Run `npm run build`
- Deploy to Cloudflare's edge network

## Important Notes

### Edge Runtime Compatibility

The API route (`/api/generate-twister`) is configured to use Edge Runtime, which is compatible with Cloudflare's infrastructure. It uses the `fetch` API directly instead of the OpenAI SDK to ensure compatibility.

### Environment Variables

- Environment variables set in Cloudflare Pages are available at build time and runtime
- Make sure to set `OPENAI_API_KEY` in the Cloudflare dashboard
- You can set different values for Production, Preview, and Branch deployments

### Build Configuration

The `next.config.ts` is configured with `output: 'standalone'` which works well with Cloudflare Pages. If you need static export, you can change this to `output: 'export'`, but note that API routes won't work with static export.

### Custom Domain

After deployment, you can:
1. Go to your project's **Custom domains** section
2. Add your custom domain
3. Cloudflare will automatically configure DNS

## Troubleshooting

### API Route Not Working

- Check that `OPENAI_API_KEY` is set in Cloudflare Pages environment variables
- Verify the API route is using Edge Runtime (it should be)
- Check Cloudflare Pages build logs for errors

### Build Failures

- Ensure all dependencies are listed in `package.json`
- Check that Node.js version is compatible (Cloudflare Pages uses Node.js 18+)
- Review build logs in Cloudflare dashboard

### Runtime Errors

- Check Cloudflare Pages Functions logs
- Verify environment variables are correctly set
- Ensure API routes are using Edge-compatible APIs only

## Alternative: Cloudflare Workers

If you need more control, you can also deploy API routes as Cloudflare Workers, but the current setup should work with Cloudflare Pages.

