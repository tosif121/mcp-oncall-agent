import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  service: string;
}

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  status: string;
  assignee: string;
  url: string;
}

export interface SlackMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  channel: string;
}

// Singleton Client Instance
let mcpClient: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;
let availableTools: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
let connectionFailed = false;

export async function getMcpClient() {
  const url = process.env.ARCHESTRA_MCP_URL;
  if (!url) {
    throw new Error('ARCHESTRA_MCP_URL is not set in environment variables.');
  }

  if (connectionFailed) {
    throw new Error('Archestra MCP connection previously failed. Restart server to retry.');
  }

  if (mcpClient) return mcpClient;

  console.log('Connecting to Archestra MCP at', url);

  const apiKey = process.env.ARCHESTRA_API_KEY;

  transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : '',
      },
    },
  } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  mcpClient = new Client({ name: 'mcp-oncall-agent', version: '1.0.0' }, { capabilities: {} });

  try {
    await mcpClient.connect(transport);
    console.log('Connected to Archestra MCP');

    const toolsResult = await mcpClient.listTools();
    availableTools = toolsResult.tools;
    console.log('Available MCP Tools:', availableTools.map((t) => t.name).join(', '));
  } catch (e) {
    console.error('Failed to connect to Archestra MCP:', e);
    connectionFailed = true;
    mcpClient = null;
    throw new Error(`Failed to connect to Archestra MCP: ${e}`);
  }

  return mcpClient;
}

// Helper to find the best matching tool name
function findToolName(keywords: string[]): string | undefined {
  if (!availableTools.length) return undefined;
  return availableTools.find((t) => keywords.some((k) => t.name.includes(k)))?.name;
}

// --- Public API ---

// --- Seed Data Generators (for Demo when Tools are Missing) ---
function getSeedCommits(repo: string): Commit[] {
  return [
    {
      id: 'a1b2c3d',
      message: 'feat: update database schema for user profiles',
      author: 'jdoe',
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      url: `https://github.com/${repo}/commit/a1b2c3d`,
    },
    {
      id: 'e5f6g7h',
      message: 'fix: resolve null pointer in auth service',
      author: 'asmith',
      date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      url: `https://github.com/${repo}/commit/e5f6g7h`,
    },
    {
      id: 'i8j9k0l',
      message: 'chore: bump dependencies',
      author: 'bot',
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      url: `https://github.com/${repo}/commit/i8j9k0l`,
    },
  ];
}

function getSeedLogs(service: string): LogEntry[] {
  return [
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      level: 'ERROR',
      message: 'ConnectionRefused: Unable to connect to database at 10.0.0.5:5432',
      service: service,
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      level: 'ERROR',
      message: 'QueryTimeout: Verify user credentials took 5002ms',
      service: service,
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      level: 'ERROR',
      message: 'ConnectionRefused: Unable to connect to database at 10.0.0.5:5432',
      service: service,
    },
  ];
}

function getSecuritySeedLogs(_service: string): LogEntry[] {
  return [
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      level: 'WARN',
      message: 'IAM Policy Change: AdminAccess granted to user "contractor-dev" by "unknown"',
      service: 'aws-iam',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      level: 'ERROR',
      message: 'S3 Bucket "customer-data-backup" public access block REMOVED',
      service: 'aws-s3',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      level: 'WARN',
      message: 'Unusual login location detected for user "admin" (Source: Pyongyang)',
      service: 'auth-service',
    },
  ];
}

function getFinOpsSeedLogs(_service: string): LogEntry[] {
  return [
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      level: 'WARN',
      message: 'Instance "i-0abcd1234" (p4.xlarge) idle usage < 2% for 48 hours',
      service: 'aws-ec2',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      level: 'WARN',
      message: 'RDS Snapshot storage cost increased by 200% in 24h',
      service: 'aws-rds',
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      level: 'INFO',
      message: 'Spot Instance termination warning: Rebalancing imminent',
      service: 'aws-ec2-spot',
    },
  ];
}

function getSeedTickets(_query: string): JiraTicket[] {
  return [
    {
      id: '1001',
      key: 'OPS-1234',
      summary: 'Database latency spikes during backup',
      status: 'In Progress',
      assignee: 'db_admin',
      url: 'https://jira.example.com/browse/OPS-1234',
    },
    {
      id: '1002',
      key: 'PROD-567',
      summary: 'Investigate frequent timeouts in Auth Service',
      status: 'Open',
      assignee: 'backend_lead',
      url: 'https://jira.example.com/browse/PROD-567',
    },
  ];
}

function getSecuritySeedTickets(_query: string): JiraTicket[] {
  return [
    {
      id: '2001',
      key: 'SEC-999',
      summary: 'CRITICAL: Open S3 Bucket Scanner Alert',
      status: 'To Do',
      assignee: 'sec_ops',
      url: 'https://jira.example.com/browse/SEC-999',
    },
    {
      id: '2002',
      key: 'SEC-1002',
      summary: 'Audit IAM Roles with AdministratorAccess',
      status: 'In Progress',
      assignee: 'ciso_office',
      url: 'https://jira.example.com/browse/SEC-1002',
    },
  ];
}

function getFinOpsSeedTickets(_query: string): JiraTicket[] {
  return [
    {
      id: '3001',
      key: 'FIN-404',
      summary: 'Reduce Monthly Cloud Spend by 15%',
      status: 'In Progress',
      assignee: 'finops_lead',
      url: 'https://jira.example.com/browse/FIN-404',
    },
    {
      id: '3002',
      key: 'FIN-420',
      summary: 'Review Unattached EBS Volumes',
      status: 'Open',
      assignee: 'cloud_architect',
      url: 'https://jira.example.com/browse/FIN-420',
    },
  ];
}

// --- Public API ---

export async function fetchRecentCommits(repo: string): Promise<Commit[]> {
  try {
    const client = await getMcpClient();
    const toolName = findToolName(['list_commits', 'get_commits', 'recent_commits']);

    if (toolName) {
      console.log(`Calling MCP tool: ${toolName}`);
      const result: any = await client.callTool({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        name: toolName,
        arguments: { repo, limit: 5, owner: 'archestra-ai' },
      });

      const content = JSON.parse(result.content[0].text);
      if (Array.isArray(content)) {
        return content.map((c: any) => ({
          // eslint-disable-line @typescript-eslint/no-explicit-any
          id: c.sha || c.id || 'unknown',
          message: c.commit?.message || c.message || 'No message',
          author: c.commit?.author?.name || c.author || 'Unknown',
          date: c.commit?.author?.date || c.date || new Date().toISOString(),
          url: c.html_url || c.url || '#',
        }));
      }
    }
    // Fallback if no tool matches
    console.warn('No GitHub tool found. Real data required.');
    return [];
  } catch (e) {
    console.error('Error fetching commits via MCP:', e);
    throw e;
  }
}

export async function fetchErrorLogs(service: string, timeWindowMinutes: number): Promise<LogEntry[]> {
  try {
    const client = await getMcpClient();
    const toolName = findToolName(['fetch_logs', 'get_logs', 'search_logs', 'query_logs']);

    if (toolName) {
      console.log(`Calling MCP tool: ${toolName}`);
      const result: any = await client.callTool({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        name: toolName,
        arguments: { service, minutes: timeWindowMinutes, query: service },
      });

      const content = JSON.parse(result.content[0].text);
      if (Array.isArray(content)) {
        return content as LogEntry[];
      }
    }
    console.warn('No Logging tool found via MCP.');
    return [];
  } catch (e) {
    console.error('Error fetching logs via MCP:', e);
    throw e;
  }
}

export async function searchJiraTickets(query: string): Promise<JiraTicket[]> {
  try {
    const client = await getMcpClient();
    const toolName = findToolName(['search_issues', 'find_issues', 'jira_search']);

    if (toolName) {
      console.log(`Calling MCP tool: ${toolName}`);
      const result: any = await client.callTool({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        name: toolName,
        arguments: { jql: `text ~ "${query}"`, query },
      });

      const content = JSON.parse(result.content[0].text);
      const issues = content.issues || content;

      if (Array.isArray(issues)) {
        return issues.map((i: any) => ({
          // eslint-disable-line @typescript-eslint/no-explicit-any
          id: i.id,
          key: i.key,
          summary: i.fields?.summary || i.summary || 'No summary',
          status: i.fields?.status?.name || i.status || 'Unknown',
          assignee: i.fields?.assignee?.displayName || i.assignee || 'Unassigned',
          url: `https://jira.example.com/browse/${i.key}`,
        }));
      }
    }
    console.warn('No Jira tool found via MCP.');
    return [];
  } catch (e) {
    console.error('Error fetching tickets via MCP:', e);
    throw e;
  }
}

export async function fetchSlackMessages(query: string): Promise<SlackMessage[]> {
  // Logic to call MCP tool would go here (e.g., search_messages)
  return [];
}

export async function sendSlackNotification(message: string): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not set. Skipping notification.');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    return response.ok;
  } catch (e) {
    console.error('Error sending Slack notification:', e);
    return false;
  }
}

export async function triggerMcpAction(toolName: string, args: any): Promise<{ success: boolean; message: string }> {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const client = await getMcpClient();
    let actualToolName = toolName;

    if (toolName === 'rollback_deployment') {
      const match = findToolName(['rollback', 'revert_deployment']);
      if (match) actualToolName = match;
    } else if (toolName === 'scale_service') {
      const match = findToolName(['scale', 'resize_deployment']);
      if (match) actualToolName = match;
    }

    if (actualToolName && actualToolName !== toolName) {
      console.log(`Executing Action via MCP: ${actualToolName}`);
      const result: any = await client.callTool({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        name: actualToolName,
        arguments: args,
      });
      return { success: true, message: result.content?.[0]?.text || 'Action executed successfully via MCP' };
    }

    // Fallback: Try to call the toolName directly if no alias match
    console.log(`Executing Action via MCP (Direct): ${toolName}`);
    const result: any = await client.callTool({
      // eslint-disable-line @typescript-eslint/no-explicit-any
      name: toolName,
      arguments: args,
    });
    return { success: true, message: result.content?.[0]?.text || 'Action executed successfully via MCP' };
  } catch (e: any) {
    console.error('Error triggering action via MCP:', e);
    return { success: false, message: e.message || 'MCP Action Failed' };
  }
}
