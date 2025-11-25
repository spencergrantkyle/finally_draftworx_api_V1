import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  getActiveClients,
  searchClients,
  getClient,
  createClient,
  getTrialBalance,
  getClientSummary,
  getFrameworks,
  getPractices,
  getConfigStatus,
  COUNTRIES,
} from "@/lib/draftworx-api";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");

  // Widget for displaying content
  const contentWidget: ContentWidget = {
    id: "draftworx_dashboard",
    title: "Draftworx Dashboard",
    templateUri: "ui://widget/draftworx-dashboard.html",
    invoking: "Loading Draftworx data...",
    invoked: "Data loaded",
    html: html,
    description: "Displays Draftworx client and financial data",
    widgetDomain: "https://development.cloud.draftworx.com",
  };

  server.registerResource(
    "draftworx-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // ============================================
  // Tool: List Clients
  // ============================================
  server.registerTool(
    "list_clients",
    {
      title: "List Draftworx Clients",
      description: "List all active clients in the Draftworx practice. Returns client names, tax years, and entity types.",
      inputSchema: {
        limit: z.number().optional().describe("Maximum number of clients to return (default: 20)"),
      },
    },
    async ({ limit = 20 }) => {
      try {
        const clients = await getActiveClients();
        const limited = clients.slice(0, limit);
        
        const clientList = limited.map(c => ({
          id: c.id,
          name: c.name,
          taxYear: c.taxYear,
          entityType: c.entityDescription,
          currency: c.currencySymbol,
          inBalance: c.inBalance,
          created: c.created,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total: clients.length,
                showing: limited.length,
                clients: clientList,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Search Clients
  // ============================================
  server.registerTool(
    "search_clients",
    {
      title: "Search Draftworx Clients",
      description: "Search for clients by name in the Draftworx practice.",
      inputSchema: {
        query: z.string().describe("Search query to match against client names"),
      },
    },
    async ({ query }) => {
      try {
        const clients = await searchClients(query);
        
        const clientList = clients.map(c => ({
          id: c.id,
          name: c.name,
          taxYear: c.taxYear,
          entityType: c.entityDescription,
          currency: c.currencySymbol,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query,
                found: clients.length,
                clients: clientList,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Get Client Details
  // ============================================
  server.registerTool(
    "get_client",
    {
      title: "Get Client Details",
      description: "Get detailed information about a specific Draftworx client by ID.",
      inputSchema: {
        clientId: z.string().describe("The UUID of the client"),
      },
    },
    async ({ clientId }) => {
      try {
        const client = await getClient(clientId);
        
        if (!client) {
          return {
            content: [{ type: "text", text: `Client not found: ${clientId}` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                id: client.id,
                name: client.name,
                engagementName: client.engagementName,
                taxYear: client.taxYear,
                entityType: client.entityDescription,
                currency: `${client.currencySymbol}`,
                taxRate: client.taxRate,
                inBalance: client.inBalance,
                status: client.deleted ? 'Deleted' : client.archived ? 'Archived' : client.locked ? 'Locked' : 'Active',
                financialYears: client.financialYears?.map(fy => ({
                  id: fy.id,
                  start: fy.start,
                  end: fy.end,
                  current: fy.current,
                })),
                created: client.created,
                modified: client.modified,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Create Client
  // ============================================
  server.registerTool(
    "create_client",
    {
      title: "Create New Client",
      description: "Create a new client in Draftworx. Defaults to South Africa with IFRS SME framework.",
      inputSchema: {
        name: z.string().describe("The name of the new client/company"),
        taxYear: z.number().optional().describe("The tax year (default: current year)"),
        country: z.enum(["ZA", "UK"]).optional().describe("Country code: ZA (South Africa) or UK (United Kingdom)"),
        framework: z.string().optional().describe("Framework pattern to match (default: 'ifrs sme')"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name, taxYear, country = "ZA", framework = "ifrs sme" }) => {
      try {
        const year = taxYear || new Date().getFullYear();
        const newClient = await createClient(name, year, country, framework);

        return {
          content: [
            {
              type: "text",
              text: `✅ Client "${newClient.name}" created successfully! ID: ${newClient.id}`,
            },
          ],
          structuredContent: {
            success: true,
            client: {
              id: newClient.id,
              name: newClient.name,
              taxYear: newClient.taxYear,
              framework: newClient.frameworkId,
              country: newClient.countryOfIncorporation,
              created: newClient.created,
            },
          },
          _meta: widgetMeta(contentWidget),
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating client: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Get Trial Balance
  // ============================================
  server.registerTool(
    "get_trial_balance",
    {
      title: "Get Trial Balance",
      description: "Get the trial balance for a specific client. Shows account balances, adjustments, and final values.",
      inputSchema: {
        clientId: z.string().describe("The UUID of the client"),
        financialYearId: z.string().optional().describe("Optional: specific financial year ID (defaults to current year)"),
      },
    },
    async ({ clientId, financialYearId }) => {
      try {
        const entries = await getTrialBalance(clientId, financialYearId);
        
        // Calculate totals
        const totals = entries.reduce((acc, e) => ({
          openingBalance: acc.openingBalance + (e.openingBalance || 0),
          adjustments: acc.adjustments + (e.adjustments || 0),
          final: acc.final + (e.final || 0),
        }), { openingBalance: 0, adjustments: 0, final: 0 });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                clientId,
                entriesCount: entries.length,
                totals,
                entries: entries.slice(0, 50).map(e => ({
                  account: e.account,
                  name: e.name,
                  link: e.link,
                  type: e.type,
                  openingBalance: e.openingBalance,
                  adjustments: e.adjustments,
                  final: e.final,
                })),
                note: entries.length > 50 ? `Showing first 50 of ${entries.length} entries` : undefined,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Get Client Summary
  // ============================================
  server.registerTool(
    "get_client_summary",
    {
      title: "Get Client Summary",
      description: "Get a summary of all clients in the practice, including counts by status and tax year.",
      inputSchema: {},
    },
    async () => {
      try {
        const summary = await getClientSummary();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                totalClients: summary.total,
                activeClients: summary.active,
                deletedClients: summary.deleted,
                clientsByTaxYear: summary.byYear,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: List Frameworks
  // ============================================
  server.registerTool(
    "list_frameworks",
    {
      title: "List Frameworks",
      description: "List available accounting frameworks. Optionally filter by country.",
      inputSchema: {
        country: z.enum(["ZA", "UK"]).optional().describe("Filter by country code"),
        limit: z.number().optional().describe("Maximum number to return (default: 20)"),
      },
    },
    async ({ country, limit = 20 }) => {
      try {
        let frameworks = await getFrameworks();
        
        if (country && COUNTRIES[country]) {
          frameworks = frameworks.filter(f => f.countryId === COUNTRIES[country].id);
        }

        const limited = frameworks.slice(0, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total: frameworks.length,
                showing: limited.length,
                country: country || 'all',
                frameworks: limited.map(f => ({
                  id: f.id,
                  name: f.displayName || f.name,
                  description: f.description,
                  active: f.active,
                })),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Get Practice Info
  // ============================================
  server.registerTool(
    "get_practice_info",
    {
      title: "Get Practice Info",
      description: "Get information about the current Draftworx practice.",
      inputSchema: {},
    },
    async () => {
      try {
        const practices = await getPractices();
        const config = getConfigStatus();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                configured: config.configured,
                apiHost: config.host,
                practices: practices.map(p => ({
                  id: p.id,
                  name: p.name,
                  email: p.email,
                  type: p.practiceType,
                })),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  // ============================================
  // Tool: Dashboard Widget
  // ============================================
  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description: "Display the Draftworx dashboard with client overview",
      inputSchema: {
        view: z.enum(["summary", "clients", "recent"]).optional().describe("Dashboard view type"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ view = "summary" }) => {
      try {
        const summary = await getClientSummary();
        const clients = await getActiveClients();
        const recent = clients
          .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
          .slice(0, 5);

        return {
          content: [
            {
              type: "text",
              text: `Draftworx Dashboard - ${view} view`,
            },
          ],
          structuredContent: {
            view,
            summary: {
              total: summary.total,
              active: summary.active,
              deleted: summary.deleted,
            },
            recentClients: recent.map(c => ({
              id: c.id,
              name: c.name,
              taxYear: c.taxYear,
              modified: c.modified,
            })),
            timestamp: new Date().toISOString(),
          },
          _meta: widgetMeta(contentWidget),
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );
});

export const GET = handler;
export const POST = handler;

