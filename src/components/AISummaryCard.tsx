import { Brain, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from '@/types/supabase';

type AISummary = Database['public']['Tables']['ai_summaries']['Row'];

interface AISummaryCardProps {
  summary: AISummary | null;
  loading?: boolean;
}

export function AISummaryCard({ summary, loading }: AISummaryCardProps) {
  if (loading) {
    return (
      <Card className="border-primary/20 bg-muted/10">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const confidencePercent = Math.round(summary.confidence * 100);

  return (
    <Card className="relative overflow-hidden border-2 border-transparent bg-background shadow-lg group">
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 rounded-lg p-[2px] bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 -z-10" />
      <div className="absolute inset-[2px] rounded-[6px] bg-background -z-10" />

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          Archestra AI Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Root Cause</h4>
          <p className="text-foreground font-medium leading-relaxed">{summary.root_cause}</p>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span>Confidence Score</span>
            <span className={confidencePercent > 80 ? 'text-green-600' : 'text-yellow-600'}>{confidencePercent}%</span>
          </div>
          <Progress value={confidencePercent} className="h-2" />
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
          <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Recommended Action
          </h4>
          <p className="text-sm text-indigo-900 dark:text-indigo-200">{summary.recommended_action}</p>
        </div>
      </CardContent>
    </Card>
  );
}
