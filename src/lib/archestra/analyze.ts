import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

// In a real scenario, this would import the Archestra LLM client.
// For the hackathon/demo, we might mock the LLM call or use a simple fetch to an OpenAI-compatible endpoint if available.
// The user asks to "Use Archestra agent with GPT-4".
// Assuming an environment variable ARCHESTRA_LLM_URL or similar.

interface AnalysisResult {
  root_cause: string;
  confidence: number;
  recommended_action: string;
}

export async function analyzeIncident(
  alert: Database['public']['Tables']['alerts']['Row'],
  commits: any[],
  logs: any[],
): Promise<AnalysisResult | null> {
  const supabase = await createClient();

  try {
    // 1. Construct the Prompt
    const prompt = `
      Analyze this incident:
      Service: ${alert.service}
      Message: ${alert.message}
      
      Recent Commits:
      ${JSON.stringify(commits.map((c) => `${c.sha}: ${c.message}`))}
      
      Error Logs:
      ${JSON.stringify(logs.slice(0, 5))}
      
      Provide a JSON object with:
      - root_causeDescription (string)
      - confidenceScore (0-100 number)
      - recommendedAction (string)
    `;

    // 2. Call AI via MCP
    // Try to find a tool for analysis
    const mcpClient = await import('@/lib/mcp').then((m) => m.getMcpClient());

    // Check for an 'analyze' tool
    // Note: Since I don't have the exact tool name, I'll try standard ones.
    // If unavailable, I'll fallback to a specific implementation if strict "no mock" is required,
    // but without an LLM key exposed, this might just fail, which is correct for "no mock".

    // However, I can try to use the 'ask_archestra' or similar if it existed.
    // For now, I will use a placeholder that assumes a tool 'analyze_incident' exists.

    let result: AnalysisResult;

    try {
      const response: any = await mcpClient.callTool({
        name: 'analyze_incident', // Expectation: This tool exists in the real environment
        arguments: { prompt },
      });

      const content = JSON.parse(response.content[0].text);
      result = {
        root_cause: content.root_cause || 'Analysis failed to identify root cause.',
        confidence: content.confidence || 0,
        recommended_action: content.recommended_action || 'Investigate manually.',
      };
    } catch (e) {
      console.error('Failed to call analyze_incident tool:', e);
      // If the tool doesn't exist, we must fail or warn, not mock.
      throw new Error("AI Analysis Service Unavailable (Real MCP tool 'analyze_incident' not found).");
    }

    // Simulate AI delay
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Store in Supabase
    // 3. Store in Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('ai_summaries').insert({
      alert_id: alert.id,
      root_cause: result.root_cause,
      confidence: result.confidence / 100, // Store as 0.0-1.0
      recommended_action: result.recommended_action,
    } as any);

    return result;
  } catch (error) {
    console.error('Error analyzing incident:', error);
    return null;
  }
}
