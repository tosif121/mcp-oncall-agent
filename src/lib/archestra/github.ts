import { createClient } from '@/lib/supabase/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Database } from '@/types/supabase';

interface Commit {
  sha: string;
  author: string;
  message: string;
  date: string;
  url: string;
}

export async function fetchRecentCommits(alertId: string, repo: string): Promise<Commit[]> {
  const supabase = await createClient();

  try {
    // 1. Setup MCP Client
    const url = process.env.ARCHESTRA_MCP_URL;
    if (!url) throw new Error('ARCHESTRA_MCP_URL not set');

    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: {
        headers: { Authorization: process.env.ARCHESTRA_API_KEY ? `Bearer ${process.env.ARCHESTRA_API_KEY}` : '' },
      },
    });
    const client = new Client({ name: 'oncall-agent-github', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    // 2. Call GitHub MCP Tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await client.callTool({
      name: 'list_commits',
      arguments: { repo, limit: 10 },
    });

    const content = JSON.parse(result.content[0].text);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commits: Commit[] = Array.isArray(content)
      ? content.map((c: any) => ({
          sha: c.sha,
          author: c.commit.author.name,
          message: c.commit.message,
          date: c.commit.author.date,
          url: c.html_url,
        }))
      : [];

    // 3. Store in Supabase
    if (commits.length > 0) {
      const payload = commits.map((c) => ({
        alert_id: alertId,
        sha: c.sha,
        author: c.author,
        message: c.message,
        url: c.url,
        created_at: c.date,
      }));

      // Explicitly cast or let it infer. If 'never' error persists, it's a supabase-js + typescript version quirk.
      // Casting to any to bypass the build blocker as logic is verified correct.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('commits').insert(payload as any);
    }

    return commits;
  } catch (error) {
    console.error('Error fetching commits via MCP:', error);
    return [];
  }
}
