# Vercel Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Draftworx API credentials (see below)

## Step 1: Prepare Environment Variables

You'll need three environment variables from Draftworx Cloud:

### How to Get Your Credentials:

1. Open https://development.cloud.draftworx.com in your browser
2. Open DevTools (F12) → Network tab
3. Make any request (navigate around the app)
4. Click on any request and view the **Headers** section
5. Copy these values:
   - **Authorization header** → `Bearer YOUR_TOKEN_HERE` (copy just the token part)
   - **PracticeId header** → `YOUR_PRACTICE_ID_HERE` (UUID format)

### Required Environment Variables:

```env
DRAFTWORX_API_HOST=api.development.cloud.draftworx.com
DRAFTWORX_BEARER_TOKEN=your_bearer_token_from_devtools
DRAFTWORX_PRACTICE_ID=your_practice_id_from_devtools
```

**⚠️ Security Warning:** Never commit these values to Git! They provide full access to your Draftworx practice.

## Step 2: Push to GitHub

```bash
cd draftworx-chatgpt-app
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `spencergrantkyle/draftworxapi`
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `draftworx-chatgpt-app` (important!)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
5. Click **"Environment Variables"** and add:
   ```
   DRAFTWORX_API_HOST=api.development.cloud.draftworx.com
   DRAFTWORX_BEARER_TOKEN=<your_token>
   DRAFTWORX_PRACTICE_ID=<your_practice_id>
   ```
6. Click **"Deploy"**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project directory
cd draftworx-chatgpt-app
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: draftworxapi (or your choice)
# - Directory: ./ (current directory)

# Add environment variables
vercel env add DRAFTWORX_API_HOST
# Enter: api.development.cloud.draftworx.com

vercel env add DRAFTWORX_BEARER_TOKEN
# Paste your bearer token

vercel env add DRAFTWORX_PRACTICE_ID
# Paste your practice ID

# Deploy to production
vercel --prod
```

## Step 4: Verify Deployment

Once deployed, test your MCP endpoint:

```bash
# Replace YOUR_DEPLOYMENT_URL with your Vercel URL
curl -H "Accept: application/json, text/event-stream" \
  https://YOUR_DEPLOYMENT_URL.vercel.app/mcp
```

Expected response: JSON with MCP server metadata including available tools.

## Step 5: Connect to ChatGPT

1. Go to ChatGPT Settings → Connectors → **Create**
2. Add your MCP server URL:
   ```
   https://YOUR_DEPLOYMENT_URL.vercel.app/mcp
   ```
3. Test with prompts like:
   - "List all my Draftworx clients"
   - "Create a new client called 'Test Co' for 2025"
   - "Get a summary of all clients"

## Common Deployment Issues

### Issue: "Module not found" errors

**Solution:** Ensure you set the **Root Directory** to `draftworx-chatgpt-app` in Vercel project settings.

### Issue: "Environment variables not found"

**Symptoms:** API returns 401 or empty responses

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all three variables are set
3. Redeploy: Deployments → ⋯ menu → Redeploy

### Issue: "Server-Sent Events not working"

**Symptoms:** MCP endpoint returns 406 or connection fails

**Solution:** This is fixed by the `export const runtime = "nodejs"` in `app/mcp/route.ts`. Ensure this is present.

### Issue: Build fails with Turbopack errors

**Solution:** We've removed `--turbopack` from the production build. If issues persist:
```bash
# Locally test the build
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Issue: "Wrong Node version"

**Solution:** Vercel should auto-detect Node 18+ from `.nvmrc` and `package.json` engines field. If not, set explicitly in Vercel:
1. Project Settings → General → Node.js Version → 18.x

## Production Considerations

### Security

1. **Rotate tokens regularly** - Bearer tokens should be rotated periodically
2. **Use separate credentials** - Consider using a separate Draftworx account for production
3. **Enable Vercel Authentication** - Protect your MCP endpoint:
   ```json
   // vercel.json
   {
     "headers": [
       {
         "source": "/mcp",
         "headers": [
           {
             "key": "X-Robots-Tag",
             "value": "noindex"
           }
         ]
       }
     ]
   }
   ```

### Monitoring

Monitor your deployment:
- Vercel Dashboard → Your Project → **Analytics**
- View logs: Dashboard → Deployments → Your Deployment → **Function Logs**
- Set up alerts for errors

### Rate Limiting

The Draftworx API may have rate limits. Monitor usage:
```bash
# Check Vercel function logs for 429 errors
vercel logs YOUR_DEPLOYMENT_URL.vercel.app
```

## Updating Your Deployment

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys on push to main branch
# Or manually trigger: vercel --prod
```

## Rollback

If a deployment breaks:
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click ⋯ menu → **Promote to Production**

## Alternative: ngrok (Local Testing)

If you need to test locally before deploying:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Run your app locally
npm run dev

# In another terminal, expose to internet
ngrok http 3001

# Use the ngrok URL in ChatGPT
# Example: https://abc123.ngrok-free.app/mcp
```

**Note:** ngrok URLs expire when you close the session. Use Vercel for persistent deployments.

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **MCP Protocol:** https://modelcontextprotocol.io
- **Issues:** https://github.com/spencergrantkyle/draftworxapi/issues

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DRAFTWORX_API_HOST` | Draftworx API hostname (no https://) | `api.development.cloud.draftworx.com` |
| `DRAFTWORX_BEARER_TOKEN` | OAuth bearer token from DevTools | `DB571862B34E15550C88E80FA...` |
| `DRAFTWORX_PRACTICE_ID` | Practice UUID from DevTools | `514c4fbb-c84a-400a-8868-a29014d2beea` |

## Testing Checklist

Before marking deployment as complete:

- [ ] MCP endpoint returns valid JSON: `curl https://YOUR_URL.vercel.app/mcp`
- [ ] Environment variables are set in Vercel dashboard
- [ ] `list_clients` tool works in ChatGPT
- [ ] `create_client` tool works in ChatGPT
- [ ] No CORS errors in browser console
- [ ] Function logs show no errors in Vercel dashboard
- [ ] Bearer token is not exposed in client-side code
