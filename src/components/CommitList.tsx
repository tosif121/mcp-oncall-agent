import { formatDistanceToNow, isAfter, subHours } from 'date-fns';
import { GitCommit, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Database } from '@/types/supabase';

type Commit = Database['public']['Tables']['commits']['Row'];

interface CommitListProps {
  commits: Commit[];
}

export function CommitList({ commits }: CommitListProps) {
  const oneHourAgo = subHours(new Date(), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {commits.map((commit) => {
        const isRecent = isAfter(new Date(commit.created_at), oneHourAgo);

        return (
          <Card
            key={commit.id}
            className={cn(
              'transition-all hover:shadow-md',
              isRecent ? 'border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-border',
            )}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-purple-500" />
                  <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">
                    {commit.sha.substring(0, 7)}
                  </span>
                </div>
                {isRecent && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-yellow-500 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 px-1 py-0 h-5"
                  >
                    Recent
                  </Badge>
                )}
              </div>

              <div className="text-sm font-medium leading-tight line-clamp-2" title={commit.message}>
                {commit.message}
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                    {commit.author.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{commit.author}</span>
                </div>
                <span>{formatDistanceToNow(new Date(commit.created_at), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
