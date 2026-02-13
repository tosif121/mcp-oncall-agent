'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle,
  GitCommit,
  FileText,
  Activity,
  CheckCircle,
  Terminal,
  Cpu,
  Shield,
  Wallet,
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  MessageSquare, // Added
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function IncidentDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [incident, setIncident] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [context, setContext] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const getIncidentType = (title: string, description: string) => {
    const text = (title + description).toLowerCase();
    if (text.includes('security') || text.includes('compliance') || text.includes('s3') || text.includes('iam')) {
      return { type: 'SECURITY', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    }
    if (text.includes('cost') || text.includes('budget') || text.includes('spend') || text.includes('finops')) {
      return { type: 'FINOPS', icon: Wallet, color: 'text-green-500', bg: 'bg-green-500/10' };
    }
    return { type: 'SRE', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Fetch incident
      const { data: incidentData } = await supabase.from('incidents').select('*').eq('id', id).single();
      setIncident(incidentData);

      // Fetch report
      const { data: reportData } = await supabase.from('incident_reports').select('*').eq('incident_id', id).single();
      if (reportData) {
        // Parse suggested actions if stored as JSON string
        if (typeof reportData.suggested_actions === 'string') {
          reportData.suggested_actions = JSON.parse(reportData.suggested_actions);
        }
        setReport(reportData);
      }

      // Fetch context
      const { data: contextData } = await supabase
        .from('incident_context')
        .select('*')
        .eq('incident_id', id)
        .order('created_at', { ascending: true });

      // Parse context content
      const parsedContext =
        contextData?.map((item) => ({
          ...item,
          content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content,
        })) || [];

      setContext(parsedContext);
    } catch (error) {
      console.error('Error fetching incident data', error);
      toast.error('Failed to load incident data');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: string) => {
    const loadingToast = toast.loading(`Executing: ${action}...`);
    setActionStatus(`Executing: ${action}...`);

    // Determine tool and args based on the action string (mock logic)
    let toolName = 'unknown';
    let args = {};

    if (action.toLowerCase().includes('rollback')) {
      toolName = 'rollback_deployment';
      args = { deploymentId: 'recent' };
    } else if (action.toLowerCase().includes('scale')) {
      toolName = 'scale_service';
      args = { service: 'user-db', replicas: 3 };
    } else if (action.toLowerCase().includes('restart')) {
      toolName = 'restart_service';
      args = { service: 'auth-service' };
    }

    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        body: JSON.stringify({ toolName, args }),
      });
      const result = await res.json();

      if (result.success) {
        setActionStatus(`Success: ${result.message}`);
        // Optionally update incident status
        await supabase.from('incidents').update({ status: 'resolved' }).eq('id', id);
        toast.success(`Action executed successfully!`, { id: loadingToast });
        fetchData(); // Refresh to show resolved status
      } else {
        setActionStatus(`Failed: ${result.message}`);
        toast.error(`Action failed: ${result.message}`, { id: loadingToast });
      }
    } catch (e) {
      setActionStatus('Error executing action');
      toast.error('Error executing action', { id: loadingToast });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-8 w-8 animate-pulse text-primary" />
          <span>Loading details...</span>
        </div>
      </div>
    );
  if (!incident)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Incident not found
      </div>
    );

  const incidentMeta = getIncidentType(incident.title, incident.description);
  const TypeIcon = incidentMeta.icon;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto p-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <header className="flex justify-between items-start mb-8 bg-card p-8 rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${incidentMeta.bg}`}>
                <TypeIcon className={`w-6 h-6 ${incidentMeta.color}`} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{incident.title}</h1>
              <Badge variant={incident.status === 'open' ? 'destructive' : 'default'} className="uppercase">
                {incident.status}
              </Badge>
              <Badge variant="outline" className={`${incidentMeta.color} border-current`}>
                {incidentMeta.type}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg ml-11">{incident.description}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-1">
            <p className="font-mono bg-muted px-2 py-0.5 rounded inline-block">ID: {incident.id}</p>
            <div className="flex items-center justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(incident.created_at).toLocaleString()}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Analysis & Context */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Analysis Card */}
            {report && (
              <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Cpu className="w-32 h-32 text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Activity className="w-5 h-5" /> AI Analysis & Context Correlation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
                    {report.summary}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Context Evidence Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <Terminal className="w-4 h-4" /> Investigated Evidence
              </h3>

              {context.map((ctx) => (
                <Card key={ctx.id} className="bg-card/50">
                  <CardHeader className="py-3 px-5 border-b bg-muted/30">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {ctx.source_type === 'github' && <GitCommit className="w-4 h-4 text-purple-500" />}
                      {ctx.source_type === 'logs' && <Terminal className="w-4 h-4 text-orange-500" />}
                      {ctx.source_type === 'jira' && <FileText className="w-4 h-4 text-blue-500" />}
                      {ctx.source_type === 'slack' && <MessageSquare className="w-4 h-4 text-emerald-500" />}
                      {ctx.source_type} Data
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-4 font-mono text-xs overflow-x-auto max-h-[300px]">
                      {/* Custom rendering based on type */}
                      {ctx.source_type === 'github' &&
                        Array.isArray(ctx.content) &&
                        ctx.content.map((c: any) => (
                          <div
                            key={c.id}
                            className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-purple-500 font-bold">{c.id.substring(0, 7)}</span>
                              <span className="text-muted-foreground">({new Date(c.date).toLocaleTimeString()})</span>
                            </div>
                            <div className="text-foreground/90">
                              {c.message} <span className="opacity-50 mx-1">—</span>{' '}
                              <span className="text-muted-foreground">{c.author}</span>
                            </div>
                          </div>
                        ))}

                      {ctx.source_type === 'logs' &&
                        Array.isArray(ctx.content) &&
                        ctx.content.map((l: any, i: number) => (
                          <div key={i} className="mb-1.5 text-red-500/90 border-l-2 border-red-500/20 pl-2">
                            <span className="opacity-50 text-xs mr-2">
                              {new Date(l.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="font-bold text-[10px] uppercase bg-red-100 dark:bg-red-900/30 px-1 rounded mr-2">
                              {l.level}
                            </span>
                            {l.message}
                          </div>
                        ))}

                      {ctx.source_type === 'jira' &&
                        Array.isArray(ctx.content) &&
                        ctx.content.map((t: any) => (
                          <div
                            key={t.id}
                            className="flex justify-between items-center p-2 bg-muted/30 rounded mb-2 last:mb-0"
                          >
                            <a
                              href={t.url}
                              target="_blank"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {t.key} <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="truncate mx-2 flex-1 font-medium">{t.summary}</span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {t.status}
                            </Badge>
                          </div>
                        ))}

                      {ctx.source_type === 'slack' &&
                        Array.isArray(ctx.content) &&
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ctx.content.map((m: any) => (
                          <div
                            key={m.id}
                            className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider"
                              >
                                {m.channel}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-foreground/90 text-sm pl-0.5">
                              <span className="font-semibold text-primary/80">{m.user}:</span> {m.text}
                            </div>
                          </div>
                        ))}

                      {!['github', 'logs', 'jira'].includes(ctx.source_type) && (
                        <pre>{JSON.stringify(ctx.content, null, 2)}</pre>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar: Actions */}
          <div className="space-y-6">
            <Card className="sticky top-6 border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>Automated remediation via Archestra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report?.suggested_actions && report.suggested_actions.length > 0 ? (
                  report.suggested_actions.map((action: string, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      onClick={() => executeAction(action)}
                      className="w-full justify-start h-auto py-3 px-4 whitespace-normal text-left hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all group"
                    >
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {action}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-normal">One-click execution</div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="text-muted-foreground italic text-sm text-center py-4">
                    No automated actions available.
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-4 border-t pt-4 bg-muted/20">
                {actionStatus && (
                  <div
                    className={`p-3 rounded-md text-sm font-medium flex items-center gap-2 ${actionStatus.includes('Success') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}
                  >
                    {actionStatus.includes('Success') ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4 animate-spin" />
                    )}
                    {actionStatus}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">On-Call Engineer</div>
                    <div className="text-muted-foreground text-xs">Primary (PagerDuty)</div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
