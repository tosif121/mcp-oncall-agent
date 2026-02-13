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

export async function fetchRecentCommits(repo: string): Promise<Commit[]> {
  try {
    const client = await getMcpClient();
    const toolName = findToolName(['list_commits', 'get_commits', 'recent_commits']);

    if (toolName) {
      console.log(`Calling MCP tool: ${toolName} for ${repo}`);

      // Parse owner/repo from the string "owner/repo"
      const [owner, repoName] = repo.includes('/') ? repo.split('/') : ['archestra-ai', repo];

      const result: any = await client.callTool({
        // eslint-disable-line @typescript-eslint/no-explicit-any
        name: toolName,
        arguments: { owner, repo: repoName, limit: 10 },
      });

      console.log(`[MCP] Tool result for ${owner}/${repoName}:`, JSON.stringify(result).substring(0, 200)); // Log first 200 chars

      if (!result || !result.content || result.isError) {
        console.error(`[MCP] Tool Execution Failed:`, result);
        return [];
      }

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
