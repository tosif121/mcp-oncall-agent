import { NextResponse } from 'next/server';
import { triggerMcpAction } from '@/lib/mcp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolName, args } = body;

    const result = await triggerMcpAction(toolName, args);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
