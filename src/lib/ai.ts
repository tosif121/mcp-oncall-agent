import { type IncidentContextData } from './agent';

export interface IncidentReport {
  summary: string;
  suggestedActions: string[];
}

export async function generateIncidentReport(context: IncidentContextData): Promise<IncidentReport> {
  const commitCount = context.commits.length;
  const errorCount = context.logs.length;
  const ticketCount = context.tickets.length;

  // Build dynamic summary from real context data
  const commitSummary =
    context.commits.length > 0
      ? context.commits.map((c) => `- \`${c.id.substring(0, 7)}\` ${c.message} (by ${c.author})`).join('\n')
      : 'No recent commits found.';

  const logSummary =
    context.logs.length > 0
      ? context.logs.map((l) => `- [${l.level}] ${l.message}`).join('\n')
      : 'No error logs found.';

  const ticketSummary =
    context.tickets.length > 0
      ? context.tickets.map((t) => `- ${t.key}: ${t.summary} (${t.status})`).join('\n')
      : 'No related Jira tickets found.';

  const slackSummary =
    context.messages && context.messages.length > 0
      ? context.messages.map((m) => `- [${m.channel}] **${m.user}**: ${m.text}`).join('\n')
      : 'No relevant Slack discussions found.';

  // Determine probable root cause from real data
  let rootCause = 'Unable to determine root cause — no correlated data available.';
  if (context.commits.length > 0 && context.logs.length > 0) {
    rootCause = `Recent commit '${context.commits[0].message}' by ${context.commits[0].author} correlates with the start of error spikes.`;
  }

  // Generate dynamic suggested actions based on real context
  const suggestedActions: string[] = [];

  if (context.commits.length > 0) {
    suggestedActions.push(`Rollback recent deployment (commit ${context.commits[0].id.substring(0, 7)})`);
  }

  if (
    context.logs.some(
      (l) => l.message.toLowerCase().includes('database') || l.message.toLowerCase().includes('connection'),
    )
  ) {
    suggestedActions.push('Scale read-replicas for database service');
  }

  if (
    context.logs.some((l) => l.message.toLowerCase().includes('timeout') || l.message.toLowerCase().includes('refused'))
  ) {
    const service = context.logs[0]?.service || 'affected-service';
    suggestedActions.push(`Restart "${service}" pods`);
  }

  if (context.tickets.length > 0) {
    suggestedActions.push(`Review related ticket: ${context.tickets[0].key}`);
  }

  if (suggestedActions.length === 0) {
    suggestedActions.push('Investigate further — insufficient data for automated remediation');
  }

  const summary = `**Incident Analysis Report**

**Errors Detected:** ${errorCount} critical errors found
**Recent Deployments:** ${commitCount} commits correlated
**Related Tickets:** ${ticketCount} Jira issues found
**Chat Context:** ${context.messages?.length || 0} messages found

---

**Error Logs:**
${logSummary}

**Recent Commits:**
${commitSummary}

**Related Jira Tickets:**
${ticketSummary}

**Recent Chat Discussions:**
${slackSummary}

---

**Probable Root Cause:** ${rootCause}`;

  return { summary, suggestedActions };
}
