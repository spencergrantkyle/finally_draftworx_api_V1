# Draftworx ChatGPT App

A Next.js application that exposes Draftworx Cloud functionality via the ChatGPT Apps SDK using the Model Context Protocol (MCP).

## Features

- **List Clients**: View all active clients in your practice
- **Search Clients**: Find clients by name
- **Create Client**: Create new clients with proper framework and financial year setup
- **Get Trial Balance**: Retrieve trial balance data for any client
- **Get Client Summary**: Overview of all clients by status and tax year
- **List Frameworks**: View available accounting frameworks by country
- **Get Practice Info**: View practice details

## Quick Start

### 1. Install Dependencies

```bash
cd draftworx-chatgpt-app
npm install
# or
pnpm install
```

### 2. Configure Environment

Edit `.env.local` with your Draftworx credentials:

```env
DRAFTWORX_API_HOST=api.development.cloud.draftworx.com
DRAFTWORX_BEARER_TOKEN=your_bearer_token_here
DRAFTWORX_PRACTICE_ID=your_practice_id_here
```

**To find your credentials:**
1. Open https://development.cloud.draftworx.com
2. Open DevTools (F12) → Network tab
3. Make any request and check the Headers:
   - `Authorization: Bearer YOUR_TOKEN`
   - `PracticeId: YOUR_PRACTICE_ID`

### 3. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

The app runs on http://localhost:3001

### 4. Connect to ChatGPT

1. Go to ChatGPT Settings → Connectors → Create
2. Add your MCP server URL: `http://localhost:3001/mcp`
3. For production, deploy to Vercel and use that URL

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_clients` | List all active clients (with optional limit) |
| `search_clients` | Search clients by name |
| `get_client` | Get detailed info for a specific client |
| `create_client` | Create a new client |
| `get_trial_balance` | Get trial balance for a client |
| `get_client_summary` | Get overview statistics |
| `list_frameworks` | List available frameworks |
| `get_practice_info` | Get practice details |
| `draftworx_dashboard` | Display visual dashboard widget |

## Example Prompts

Try these in ChatGPT after connecting:

- "List all my Draftworx clients"
- "Create a new client called 'ABC Holdings' for 2025"
- "Search for clients named 'Test'"
- "Show me the trial balance for client [ID]"
- "What frameworks are available for South Africa?"
- "Get a summary of all clients"

## Project Structure

```
draftworx-chatgpt-app/
├── app/
│   ├── mcp/
│   │   └── route.ts      # MCP server with all tools
│   ├── layout.tsx        # Root layout with SDK bootstrap
│   ├── page.tsx          # Dashboard UI
│   └── globals.css       # Styles
├── lib/
│   └── draftworx-api.ts  # Draftworx API client
├── .env.local            # Configuration (don't commit!)
├── baseUrl.ts            # Base URL config
├── middleware.ts         # CORS handling
└── next.config.ts        # Next.js config
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The `baseUrl.ts` automatically handles Vercel URLs.

### Other Platforms

Ensure you set:
- `DRAFTWORX_API_HOST`
- `DRAFTWORX_BEARER_TOKEN`
- `DRAFTWORX_PRACTICE_ID`

## Security Notes

⚠️ **Never commit your `.env.local` file!**

The bearer token provides full access to your Draftworx practice. Keep it secure:
- Use environment variables in production
- Rotate tokens periodically
- Consider implementing OAuth for production use

## Learn More

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Draftworx Cloud](https://cloud.draftworx.com)

