import { formatDistanceToNow } from 'date-fns';
import { Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Database } from '@/types/supabase';

type Alert = Database['public']['Tables']['alerts']['Row'];

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
}

export function AlertCard({ alert, onClick }: AlertCardProps) {
  const isCritical = alert.severity === 'critical';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md border-l-4',
        isCritical ? 'border-l-red-500' : 'border-l-blue-500',
        onClick && 'hover:border-primary/50',
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={isCritical ? 'destructive' : 'secondary'}
            className={cn(
              'uppercase font-bold tracking-wider relative',
              isCritical && 'animate-pulse shadow-red-500/20 shadow-lg',
            )}
          >
            {isCritical && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            {alert.severity}
          </Badge>
          <span className="font-semibold text-sm text-muted-foreground">{alert.service}</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold leading-tight mb-2">{alert.message}</div>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{alert.affected_users ?? 0} affected users</span>
        </div>
        <div className="font-mono opacity-50">ID: {alert.alert_id}</div>
      </CardFooter>
    </Card>
  );
}
