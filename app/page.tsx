"use client";

import { useEffect, useState } from "react";

interface WidgetProps {
  result?: {
    structuredContent?: {
      view?: string;
      summary?: {
        total: number;
        active: number;
        deleted: number;
      };
      recentClients?: Array<{
        id: string;
        name: string;
        taxYear: number;
        modified: string;
      }>;
      client?: {
        id: string;
        name: string;
        taxYear: number;
        created: string;
      };
      success?: boolean;
    };
  };
}

function useWidgetProps<T>(): T | null {
  const [props, setProps] = useState<T | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as { openai?: { widgetProps?: T } }).openai?.widgetProps) {
      setProps((window as { openai: { widgetProps: T } }).openai.widgetProps);
    }
  }, []);

  return props;
}

function useIsChatGptApp(): boolean {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    setIsApp(typeof window !== "undefined" && typeof (window as { openai?: unknown }).openai !== "undefined");
  }, []);

  return isApp;
}

export default function Home() {
  const widgetProps = useWidgetProps<WidgetProps>();
  const isChatGptApp = useIsChatGptApp();

  const summary = widgetProps?.result?.structuredContent?.summary;
  const recentClients = widgetProps?.result?.structuredContent?.recentClients;
  const newClient = widgetProps?.result?.structuredContent?.client;
  const success = widgetProps?.result?.structuredContent?.success;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold">D</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Draftworx MCP
            </h1>
            <p className="text-slate-400 text-sm">Financial Statement Automation</p>
          </div>
        </div>

        {/* Not in ChatGPT notice */}
        {!isChatGptApp && (
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 text-blue-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-medium">Connect via ChatGPT</p>
                <p className="text-blue-300/80 text-sm mt-1">
                  This app works best when connected to ChatGPT. Add the MCP server at{" "}
                  <code className="bg-blue-800/50 px-1.5 py-0.5 rounded text-xs">/mcp</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message for new client */}
        {success && newClient && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-green-100 font-medium">Client Created Successfully!</p>
                <p className="text-green-300/80 text-sm">{newClient.name} - Tax Year {newClient.taxYear}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-400">{summary.total}</div>
              <div className="text-slate-400 text-sm">Total Clients</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-400">{summary.active}</div>
              <div className="text-slate-400 text-sm">Active</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-400">{summary.deleted}</div>
              <div className="text-slate-400 text-sm">Deleted</div>
            </div>
          </div>
        )}

        {/* Recent Clients */}
        {recentClients && recentClients.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h2 className="font-semibold text-slate-200">Recent Clients</h2>
            </div>
            <div className="divide-y divide-slate-700/50">
              {recentClients.map((client) => (
                <div key={client.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <div>
                    <div className="font-medium text-slate-200">{client.name}</div>
                    <div className="text-sm text-slate-400">Tax Year {client.taxYear}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(client.modified).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default content when no data */}
        {!summary && !recentClients && !newClient && (
          <div className="space-y-6">
            {/* Available Tools */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h2 className="font-semibold text-slate-200">Available Tools</h2>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: "list_clients", desc: "View all clients in your practice" },
                  { name: "search_clients", desc: "Find clients by name" },
                  { name: "create_client", desc: "Create a new client" },
                  { name: "get_trial_balance", desc: "Get trial balance for a client" },
                  { name: "get_client_summary", desc: "Overview of all clients" },
                  { name: "list_frameworks", desc: "View available frameworks" },
                  { name: "get_practice_info", desc: "Practice details" },
                ].map((tool) => (
                  <div key={tool.name} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div>
                      <code className="text-blue-400 text-sm font-mono">{tool.name}</code>
                      <p className="text-slate-400 text-sm">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Example prompts */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h2 className="font-semibold text-slate-200">Try Asking</h2>
              </div>
              <div className="p-4 space-y-2">
                {[
                  "List all my Draftworx clients",
                  "Create a new client called 'ABC Holdings' for 2025",
                  "Search for clients named 'Test'",
                  "Show me the trial balance for client X",
                  "What frameworks are available for South Africa?",
                ].map((prompt, i) => (
                  <div key={i} className="text-slate-300 text-sm py-1">
                    → {prompt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Draftworx Cloud Integration • MCP Server at <code className="bg-slate-800 px-1.5 py-0.5 rounded">/mcp</code></p>
        </div>
      </div>
    </div>
  );
}

