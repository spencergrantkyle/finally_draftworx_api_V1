# ngrok Setup for Local Testing

If you're having issues with Vercel deployment or need to test locally before deploying, ngrok provides a quick alternative.

## What is ngrok?

ngrok creates a secure tunnel from a public URL to your local development server. Perfect for:
- Testing webhooks and integrations locally
- Demoing your app before deployment
- Debugging issues that only occur with external access

## Quick Setup

### 1. Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Windows:**
```bash
choco install ngrok
```

**Linux:**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**Or download from:** https://ngrok.com/download

### 2. Create ngrok Account (Optional but Recommended)

1. Sign up at https://dashboard.ngrok.com/signup
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

**Benefits of signing up:**
- Custom subdomains
- Longer session times
- Better rate limits
- Reserved domains (paid plans)

### 3. Start Your App

```bash
cd draftworx-chatgpt-app
npm run dev
```

Your app runs on http://localhost:3001

### 4. Start ngrok Tunnel

In a **separate terminal:**

```bash
ngrok http 3001
```

You'll see output like:

```
ngrok

Session Status                online
Account                       your@email.com (Plan: Free)
Version                       3.5.0
Region                        United States (us)
Latency                       23ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 5. Use Your Public URL

Your MCP endpoint is now available at:
```
https://abc123.ngrok-free.app/mcp
```

**Test it:**
```bash
curl -H "Accept: application/json, text/event-stream" \
  https://abc123.ngrok-free.app/mcp
```

### 6. Connect to ChatGPT

1. Go to ChatGPT Settings → Connectors → Create
2. Add your ngrok URL:
   ```
   https://abc123.ngrok-free.app/mcp
   ```
3. Test with prompts:
   - "List all my Draftworx clients"
   - "Create a new client called 'Test Co' for 2025"

## Advanced Features

### Custom Subdomain (Requires Account)

```bash
ngrok http --subdomain=draftworx 3001
# URL: https://draftworx.ngrok-free.app
```

### Inspect Traffic

ngrok provides a web interface at http://127.0.0.1:4040

Features:
- View all HTTP requests/responses
- Replay requests
- Debug headers and payloads

### Configuration File

Create `~/.ngrok2/ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  draftworx:
    addr: 3001
    proto: http
    hostname: draftworx.ngrok-free.app  # Paid feature
    inspect: true
```

Start with:
```bash
ngrok start draftworx
```

### Edge Labels (Cloud Edge)

For more advanced routing:

```bash
ngrok http 3001 \
  --url=https://draftworx.ngrok-free.app \
  --request-header-add "X-Custom-Header: value"
```

## Limitations

### Free Plan:
- **Random URLs** - New URL each time you restart ngrok
- **Session timeout** - Tunnels expire after ~2 hours of inactivity
- **Rate limits** - 40 connections/minute
- **No custom domains** - Can't use your own domain

### All Plans:
- **Must keep running** - If you close ngrok or your computer sleeps, the tunnel dies
- **Local dependency** - Your dev server must stay running
- **Not for production** - Use Vercel for permanent deployments

## Troubleshooting

### "Failed to start tunnel"

**Issue:** Port 3001 already in use

**Solution:**
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or use different port
npm run dev -- -p 3002
ngrok http 3002
```

### "Tunnel not found"

**Issue:** ngrok session expired

**Solution:** Just restart ngrok - you'll get a new URL

### "403 Forbidden" or "ngrok-free.app Warning"

**Issue:** Free tier shows warning page first

**Solution:**
- Click "Visit Site" on warning page
- Or upgrade to paid plan ($8/month) for no warnings
- Or use Vercel instead

### ChatGPT can't connect

**Symptoms:** Connection timeout or refused

**Checklist:**
1. Is `npm run dev` running?
2. Is ngrok running?
3. Did you use the HTTPS URL (not HTTP)?
4. Does `curl https://YOUR_NGROK_URL.ngrok-free.app/mcp` work?
5. Check ngrok web interface (http://127.0.0.1:4040) for error details

## ngrok vs Vercel

| Feature | ngrok (Free) | Vercel (Free) |
|---------|-------------|---------------|
| **URL Persistence** | ❌ Changes each restart | ✅ Permanent |
| **Uptime** | ❌ Only when your computer is on | ✅ 24/7 |
| **Speed** | 🔶 Depends on your connection | ✅ Global CDN |
| **Setup Time** | ✅ 2 minutes | 🔶 5-10 minutes |
| **Cost** | ✅ Free (with limits) | ✅ Free (generous limits) |
| **Best For** | Testing, demos | Production, permanent deploys |

## Recommendation

**Use ngrok for:**
- Quick testing (< 1 hour)
- Debugging locally
- Demos where you control the environment

**Use Vercel for:**
- Permanent deployments
- Production use
- Sharing with others long-term

## Quick Commands Reference

```bash
# Start tunnel
ngrok http 3001

# With custom subdomain (requires account)
ngrok http --subdomain=draftworx 3001

# With authentication
ngrok http 3001 --basic-auth="user:password"

# View all tunnels
ngrok tunnel list

# Kill tunnel
Ctrl+C in ngrok terminal

# View web interface
open http://127.0.0.1:4040
```

## Next Steps

Once you're happy with ngrok testing:
1. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup
2. Set up environment variables in Vercel
3. Push to GitHub and deploy
4. Use permanent Vercel URL in ChatGPT

## Resources

- ngrok docs: https://ngrok.com/docs
- ngrok dashboard: https://dashboard.ngrok.com
- Pricing: https://ngrok.com/pricing
- Status: https://status.ngrok.com
