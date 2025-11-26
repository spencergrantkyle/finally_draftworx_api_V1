# Deployment Fixes Applied

## Summary

I've identified and fixed several critical issues preventing your Vercel deployment. The app should now deploy successfully.

## Issues Found & Fixed

### 1. ✅ Missing Vercel Runtime Configuration

**Problem:** The MCP route handler was using Vercel's Edge runtime by default, which doesn't support Server-Sent Events (SSE) properly.

**Fix:** Added explicit runtime configuration to [app/mcp/route.ts](app/mcp/route.ts:1-3):
```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

**Why:** This forces Next.js to use the Node.js runtime and prevents static optimization, which is required for MCP protocol's streaming responses.

---

### 2. ✅ Turbopack in Production Build

**Problem:** `package.json` build script included `--turbopack` flag, which can cause issues on Vercel's build infrastructure.

**Fix:** Removed Turbopack from production build in [package.json](package.json:10):
```json
"build": "next build"  // was: "next build --turbopack"
```

**Why:** Turbopack is experimental and best used only in development. Production builds should use the stable Webpack compiler.

---

### 3. ✅ Missing Node Version Lock

**Problem:** No explicit Node.js version requirement, risking deployment on incompatible runtimes.

**Fix:** Added two safeguards:

**File: [.nvmrc](.nvmrc)**
```
18
```

**File: [package.json](package.json:5-7)**
```json
"engines": {
  "node": ">=18.0.0"
}
```

**Why:** MCP protocol requires Node.js 18+. This ensures Vercel uses a compatible runtime.

---

### 4. ✅ Added Vercel Configuration

**Problem:** No Vercel-specific configuration to guide deployment.

**Fix:** Created [vercel.json](vercel.json):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**Why:** Explicitly tells Vercel how to build and deploy the app.

---

### 5. ✅ Simplified Next.js Config

**Problem:** Unnecessary turbopack configuration causing warnings.

**Fix:** Simplified [next.config.ts](next.config.ts):
```typescript
const nextConfig: NextConfig = {
  assetPrefix: baseURL,
};
```

**Why:** Removed deprecated `experimental.turbo` config that was triggering build warnings.

---

## Files Changed

- `app/mcp/route.ts` - Added runtime configuration
- `package.json` - Removed --turbopack flag, added engines
- `next.config.ts` - Simplified configuration
- `.nvmrc` - Created (specifies Node 18)
- `vercel.json` - Created (deployment config)

## New Documentation

Created comprehensive deployment guides:

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete Vercel deployment guide
   - Step-by-step Vercel setup
   - Environment variables configuration
   - Troubleshooting common issues
   - Security best practices

2. **[NGROK_SETUP.md](NGROK_SETUP.md)** - Alternative local testing guide
   - Quick ngrok setup for local testing
   - When to use ngrok vs Vercel
   - Troubleshooting tips

## Next Steps

### Option A: Deploy to Vercel (Recommended)

1. **Set Environment Variables** in Vercel Dashboard:
   ```
   DRAFTWORX_API_HOST=api.development.cloud.draftworx.com
   DRAFTWORX_BEARER_TOKEN=<your_token_from_devtools>
   DRAFTWORX_PRACTICE_ID=<your_practice_id>
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repo: `spencergrantkyle/draftworxapi`
   - Set **Root Directory:** `draftworx-chatgpt-app`
   - Deploy!

3. **Test the deployment:**
   ```bash
   curl -H "Accept: application/json, text/event-stream" \
     https://YOUR_DEPLOYMENT.vercel.app/mcp
   ```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Option B: Test Locally with ngrok (Quick Testing)

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **In another terminal, start ngrok:**
   ```bash
   brew install ngrok  # if not installed
   ngrok http 3001
   ```

3. **Use the ngrok URL** in ChatGPT:
   ```
   https://abc123.ngrok-free.app/mcp
   ```

See [NGROK_SETUP.md](NGROK_SETUP.md) for detailed instructions.

## Testing Checklist

Before deploying to production:

- [x] Runtime configuration added to MCP route
- [x] Turbopack removed from production build
- [x] Node version locked to 18+
- [x] Vercel configuration added
- [ ] Environment variables set in Vercel dashboard
- [ ] Test MCP endpoint returns valid JSON
- [ ] Test in ChatGPT with sample prompts

## Deployment Test Commands

After deploying, run these tests:

```bash
# Replace YOUR_URL with your Vercel deployment URL

# 1. Test MCP endpoint
curl https://YOUR_URL.vercel.app/mcp

# 2. Test with correct headers
curl -H "Accept: application/json, text/event-stream" \
  https://YOUR_URL.vercel.app/mcp

# 3. Test root page
curl https://YOUR_URL.vercel.app/

# Expected: All should return 200 OK
```

## Common Issues & Solutions

### Issue: "Environment variables not found"

**Symptom:** API returns 401 or empty data

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all three variables
3. Redeploy (Deployments → ⋯ → Redeploy)

### Issue: "Module not found" errors

**Symptom:** Build fails with import errors

**Solution:** Ensure **Root Directory** is set to `draftworx-chatgpt-app` in Vercel project settings

### Issue: Still getting runtime errors

**Symptom:** Deployment succeeds but MCP endpoint fails

**Debug:**
1. Check Vercel function logs: Dashboard → Deployments → Your Deployment → Function Logs
2. Look for Node.js version (should be 18+)
3. Verify runtime is "nodejs" not "edge"

## GitHub Repository Structure

For successful Vercel deployment, your GitHub repo should match:

```
spencergrantkyle/draftworxapi/
└── draftworx-chatgpt-app/     ← Set this as Root Directory in Vercel
    ├── app/
    │   ├── mcp/
    │   │   └── route.ts        ← MCP server endpoint
    │   ├── layout.tsx
    │   └── page.tsx
    ├── lib/
    │   └── draftworx-api.ts    ← API client
    ├── .env.local              ← DO NOT COMMIT (gitignored)
    ├── .nvmrc                  ← Node version
    ├── package.json
    ├── next.config.ts
    ├── vercel.json             ← Vercel config
    └── README.md
```

**Important:** Vercel needs to know to build from the `draftworx-chatgpt-app` subdirectory!

## Security Notes

⚠️ **Never commit these files:**
- `.env.local` (contains your bearer token)
- `node_modules/`
- `.next/`

✅ **Safe to commit:**
- `env.example` (template without real values)
- All the fixes applied above

## Support

If you encounter issues:

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
2. Review Vercel function logs
3. Test locally with ngrok first
4. Verify environment variables are set correctly

## What Changed vs Original

| Aspect | Before | After |
|--------|--------|-------|
| MCP Runtime | Edge (default) | Node.js (explicit) |
| Build Command | `next build --turbopack` | `next build` |
| Node Version | Unspecified | ≥18 (locked) |
| Vercel Config | None | `vercel.json` |
| Documentation | Basic README | Full deployment guides |
| Route Optimization | Static | Force dynamic |

---

**All fixes are applied and ready for deployment!** 🚀

Choose your deployment method:
- **Vercel** (recommended): See [DEPLOYMENT.md](DEPLOYMENT.md)
- **ngrok** (quick test): See [NGROK_SETUP.md](NGROK_SETUP.md)
