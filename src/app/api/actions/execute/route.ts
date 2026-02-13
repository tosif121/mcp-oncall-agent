import { NextRequest, NextResponse } from 'next/server';
import { triggerMcpAction } from '@/lib/mcp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionType, serviceName, alertId } = body;

    if (!actionType || !serviceName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[API] Executing action: ${actionType} for service: ${serviceName}`);

    // Map frontend action types to MCP tool names
    let toolName = '';
    const args: any = { service: serviceName, reason: `Incident Response for ${alertId}` };

    switch (actionType) {
      case 'rollback':
        toolName = 'rollback_deployment';
        args.deploymentId = 'latest'; // In real app, fetch from context
        break;
      case 'scale':
        toolName = 'scale_service';
        args.replicas = 5; // Example scale up
        break;
      case 'page':
        toolName = 'page_oncall'; // PagerDuty
        args.urgency = 'high';
        break;
      case 'logs':
        // Logs are viewed, not "executed", but maybe we want to trigger a snapshot?
        // For now, return success as it's a read-only view action handled by frontend mostly.
        return NextResponse.json({ success: true, message: 'Log view initialized' });
      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    const result = await triggerMcpAction(toolName, args);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Action execution failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
