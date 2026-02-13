import { supabase } from './supabase';
import {
  fetchRecentCommits,
  fetchErrorLogs,
  searchJiraTickets,
  fetchSlackMessages, // Added
  type Commit,
  type LogEntry,
  type JiraTicket,
  type SlackMessage, // Added
} from './mcp';

export interface IncidentContextData {
  commits: Commit[];
  logs: LogEntry[];
  tickets: JiraTicket[];
  messages: SlackMessage[]; // Added
}

export async function buildIncidentContext(
  incidentId: string,
  serviceName: string,
  errorKeyword: string,
  githubRepo?: string,
) {
  console.log(`Building context for incident ${incidentId}...`);

  // 1. Fetch Data in Parallel
  const [commits, logs, tickets, messages] = await Promise.all([
    fetchRecentCommits(githubRepo || process.env.GITHUB_REPO || 'archestra-ai/archestra'),
    fetchErrorLogs(serviceName, 60),
    searchJiraTickets(errorKeyword),
    fetchSlackMessages(errorKeyword), // Added
  ]);

  // 2. Store Context in Supabase
  const contextEntries = [
    { incident_id: incidentId, source_type: 'github', content: JSON.stringify(commits) },
    { incident_id: incidentId, source_type: 'logs', content: JSON.stringify(logs) },
    { incident_id: incidentId, source_type: 'jira', content: JSON.stringify(tickets) },
    { incident_id: incidentId, source_type: 'slack', content: JSON.stringify(messages) }, // Added
  ];

  const { error } = await supabase.from('incident_context').insert(contextEntries);

  if (error) {
    console.error('Error storing context:', error);
    throw error;
  }

  console.log('Context built and stored successfully.');

  return { commits, logs, tickets, messages };
}
