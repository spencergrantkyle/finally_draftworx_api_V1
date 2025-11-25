/**
 * Draftworx API Client for ChatGPT App
 * 
 * Connects to: https://api.development.cloud.draftworx.com
 */

// ============================================
// Configuration
// ============================================

const API_CONFIG = {
  host: process.env.DRAFTWORX_API_HOST || 'api.development.cloud.draftworx.com',
  bearerToken: process.env.DRAFTWORX_BEARER_TOKEN || '',
  practiceId: process.env.DRAFTWORX_PRACTICE_ID || '',
};

// ============================================
// Types
// ============================================

export interface Country {
  id: string;
  code: string;
  name: string;
  defaultFinancialYearStartingMonth: number;
  defaultTaxRate: number;
  hasTemplates: boolean;
  enableXbrl: boolean;
  currencyCode: string;
  currencySymbol: string;
}

export interface Framework {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  active: boolean;
  countryId: string;
}

export interface FinancialYear {
  id: string;
  clientId: string;
  start: string;
  end: string;
  current: boolean;
  taxRate: number;
}

export interface Client {
  id: string;
  name: string;
  engagementName: string;
  taxYear: number;
  entityType: number;
  entityDescription: string;
  currencySymbol: string;
  taxRate: number;
  practiceId: string;
  frameworkId: string;
  countryId: string;
  countryOfIncorporation?: string;
  inBalance: boolean;
  deleted: boolean;
  archived: boolean;
  locked: boolean;
  financialYears?: FinancialYear[];
  created: string;
  modified: string;
}

export interface Practice {
  id: string;
  name: string;
  email?: string;
  telephone?: string;
  practiceType: string;
}

export interface TrialBalanceEntry {
  id: string;
  account: string;
  name: string;
  link: string;
  linkDescription: string;
  type: string;
  openingBalance: number;
  adjustments: number;
  final: number;
}

// ============================================
// Known Countries
// ============================================

export const COUNTRIES: Record<string, Country> = {
  ZA: {
    id: '7f52f114-44c3-436e-859a-3988177713cc',
    code: 'ZA',
    name: 'South Africa',
    defaultFinancialYearStartingMonth: 3,
    defaultTaxRate: 27,
    hasTemplates: true,
    enableXbrl: true,
    currencyCode: 'ZAR',
    currencySymbol: 'R',
  },
  UK: {
    id: '094a2c25-5829-4dbd-9bfb-9086f6f9afb1',
    code: 'GB',
    name: 'United Kingdom',
    defaultFinancialYearStartingMonth: 4,
    defaultTaxRate: 25,
    hasTemplates: true,
    enableXbrl: true,
    currencyCode: 'GBP',
    currencySymbol: '£',
  },
};

// ============================================
// API Request Helper
// ============================================

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `https://${API_CONFIG.host}${path}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${API_CONFIG.bearerToken}`,
    'PracticeId': API_CONFIG.practiceId,
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json, text/plain, */*',
  };

  if (method === 'POST') {
    headers['autosave'] = 'false';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

// ============================================
// API Functions
// ============================================

export async function getPractices(): Promise<Practice[]> {
  return apiRequest<Practice[]>('GET', '/Practices');
}

export async function getClients(): Promise<Client[]> {
  return apiRequest<Client[]>('GET', '/Clients');
}

export async function getActiveClients(): Promise<Client[]> {
  const clients = await getClients();
  return clients.filter(c => !c.deleted && !c.archived);
}

export async function searchClients(query: string): Promise<Client[]> {
  const clients = await getActiveClients();
  const lowerQuery = query.toLowerCase();
  return clients.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.engagementName.toLowerCase().includes(lowerQuery)
  );
}

export async function getClient(clientId: string): Promise<Client | undefined> {
  const clients = await getClients();
  return clients.find(c => c.id === clientId);
}

export async function getFrameworks(activeOnly = true): Promise<Framework[]> {
  const filter = activeOnly ? '?$filter=active%20eq%20true' : '';
  return apiRequest<Framework[]>('GET', `/frameworks${filter}`);
}

export async function getFrameworksForCountry(countryId: string): Promise<Framework[]> {
  const frameworks = await getFrameworks();
  return frameworks.filter(f => f.countryId === countryId);
}

export async function getTrialBalance(
  clientId: string,
  financialYearId?: string
): Promise<TrialBalanceEntry[]> {
  // First get the client to find financial years
  const client = await getClient(clientId);
  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  // Get financial year ID
  let fyId = financialYearId;
  if (!fyId && client.financialYears) {
    const currentFy = client.financialYears.find(fy => fy.current);
    fyId = currentFy?.id || client.financialYears[0]?.id;
  }

  if (!fyId) {
    throw new Error('No financial year found for client');
  }

  return apiRequest<TrialBalanceEntry[]>('GET', `/TrialBalances/${fyId}`);
}

function buildFinancialYear(taxYear: number, country: Country) {
  const startMonth = country.defaultFinancialYearStartingMonth || 3;
  const startYear = taxYear - 1;
  const endYear = taxYear;
  const endMonth = startMonth - 1 || 12;
  
  let endDay = 28;
  if (endMonth !== 2) {
    endDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][endMonth - 1];
  } else if ((endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0) {
    endDay = 29;
  }

  const start = `${startYear}-${String(startMonth).padStart(2, '0')}-01T00:00:00.00`;
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}T00:00:00.00`;
  const displayEnd = `${String(endDay).padStart(2, '0')}/${String(endMonth).padStart(2, '0')}/${endYear}`;

  return {
    start,
    end,
    $end: displayEnd,
    current: true,
    taxRate: country.defaultTaxRate,
    periodType: 12,
    showOnRibbon: true,
    foreignCurrencyAverageRate: 1,
    foreignCurrencySpotRate: 1,
  };
}

export async function createClient(
  name: string,
  taxYear: number,
  countryCode: string = 'ZA',
  frameworkPattern: string = 'ifrs sme'
): Promise<Client> {
  const country = COUNTRIES[countryCode] || COUNTRIES.ZA;
  
  // Find framework
  const frameworks = await getFrameworksForCountry(country.id);
  const framework = frameworks.find(f => 
    f.displayName?.toLowerCase().includes(frameworkPattern.toLowerCase()) ||
    f.name.toLowerCase().includes(frameworkPattern.toLowerCase())
  ) || frameworks[0];

  if (!framework) {
    throw new Error(`No framework found for country ${countryCode}`);
  }

  // Build payload (MUST be an array!)
  const payload = [{
    name,
    engagementName: name,
    taxYear,
    countryId: country.id,
    frameworkId: framework.id,
    country,
    financialYears: [buildFinancialYear(taxYear, country)],
  }];

  const result = await apiRequest<Client[]>('POST', '/Clients', payload);
  return result[0];
}

// ============================================
// Summary Functions
// ============================================

export async function getClientSummary(): Promise<{
  total: number;
  active: number;
  deleted: number;
  byYear: Record<number, number>;
}> {
  const clients = await getClients();
  const active = clients.filter(c => !c.deleted);
  const deleted = clients.filter(c => c.deleted);
  
  const byYear: Record<number, number> = {};
  active.forEach(c => {
    byYear[c.taxYear] = (byYear[c.taxYear] || 0) + 1;
  });

  return {
    total: clients.length,
    active: active.length,
    deleted: deleted.length,
    byYear,
  };
}

export function isConfigured(): boolean {
  return !!(API_CONFIG.bearerToken && API_CONFIG.practiceId);
}

export function getConfigStatus(): { 
  configured: boolean; 
  host: string;
  hasBearerToken: boolean;
  hasPracticeId: boolean;
} {
  return {
    configured: isConfigured(),
    host: API_CONFIG.host,
    hasBearerToken: !!API_CONFIG.bearerToken,
    hasPracticeId: !!API_CONFIG.practiceId,
  };
}

