'use client';

import { useState } from 'react';
import { RotateCcw, Scale, PhoneCall, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface ActionButtonsProps {
  alertId: string;
  serviceName: string;
}

export function ActionButtons({ alertId, serviceName }: ActionButtonsProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (actionType: string, actionName: string) => {
    setLoading(actionType);
    const toastId = toast.loading(`Executing ${actionName}...`);

    try {
      // 1. Call Next.js API route to trigger MCP
      const response = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, serviceName, alertId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // 2. Log to Supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('actions_taken').insert({
        alert_id: alertId,
        action_type: actionType,
        status: 'success',
        details: {
          service: serviceName,
          timestamp: new Date().toISOString(),
          api_response: data,
        },
      } as any);

      if (error) throw error;

      toast.success(`${actionName} completed successfully!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(`Failed to execute ${actionName}`, { id: toastId });
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      id: 'rollback',
      label: 'Rollback Deploy',
      icon: RotateCcw,
      color: 'text-orange-500',
      description: `Revert ${serviceName} to the previous stable version. This will restart all pods.`,
      impact: 'High Impact: 2-3 minutes downtime possible during restart.',
    },
    {
      id: 'scale',
      label: 'Scale Service',
      icon: Scale,
      color: 'text-blue-500',
      description: `Increase replica count for ${serviceName} by 50% to handle load.`,
      impact: 'Medium Impact: Cost will increase. No downtime.',
    },
    {
      id: 'page',
      label: 'Page Team',
      icon: PhoneCall,
      color: 'text-red-500',
      description: 'Escalate this incident to the on-call SRE team via PagerDuty.',
      impact: 'Low Impact: Notification only.',
    },
    {
      id: 'logs',
      label: 'View Logs',
      icon: FileText,
      color: 'text-gray-500',
      description: 'Fetch and display raw error logs from Datadog for the last hour.',
      impact: 'No Impact: Read-only operation.',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Dialog key={action.id}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2 hover:bg-muted/50 border-2 border-transparent hover:border-primary/10"
            >
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <span className="font-semibold">{action.label}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <action.icon className={`w-5 h-5 ${action.color}`} />
                Confirm {action.label}
              </DialogTitle>
              <DialogDescription>Are you sure you want to proceed with this action?</DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="bg-muted p-4 rounded-lg text-sm">
                <span className="font-semibold text-foreground">Action: </span>
                {action.description}
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-200 dark:border-amber-800/30">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{action.impact}</span>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={() => handleAction(action.id, action.label)} disabled={loading === action.id}>
                {loading === action.id ? 'Executing...' : 'Approve & Execute'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
