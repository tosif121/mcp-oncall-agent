import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { buildIncidentContext } from '@/lib/agent';
import { generateIncidentReport } from '@/lib/ai';
import { sendSlackNotification } from '@/lib/mcp'; // Added

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, service, errorKeyword } = body;

    // 1. Create Incident Record
    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({ title, description: `Alert from ${service}: ${errorKeyword}`, status: 'open' })
      .select()
      .single();

    if (error) throw error;

    // 2. Trigger Agent Workflow (in background, but awaiting for demo simplicity)
    const context = await buildIncidentContext(incident.id, service, errorKeyword);
    const report = await generateIncidentReport(context);

    // 3. Store Report
    await supabase.from('incident_reports').insert({
      incident_id: incident.id,
      summary: report.summary,
      suggested_actions: JSON.stringify(report.suggestedActions), // snake_case for DB
    });

    // 4. Send Slack Notification
    const slackMessage = `🚨 *New Incident Detected*\n*Title:* ${title}\n*Service:* ${service}\n\n<http://localhost:3001/incident/${incident.id}|View Incident Details>`;
    await sendSlackNotification(slackMessage);

    return NextResponse.json({ success: true, incidentId: incident.id, report });
  } catch (error) {
    console.error('Error in incident webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
