'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModeToggle } from '@/components/mode-toggle';
import toast from 'react-hot-toast';

export default function Dashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState('archestra-ai/archestra'); // Default

  const fetchIncidents = async () => {
    setLoading(true);
    const { data } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simulateIncident = async (scenario: any) => {
    setLoading(true);
    const loadingToast = toast.loading('Simulation started...');
    try {
      await fetch('/api/incident', {
        method: 'POST',
        body: JSON.stringify({ ...scenario, githubRepo: repo }),
      });
      await fetchIncidents();
      toast.success('Incident simulated successfully!', { id: loadingToast });
    } catch (e) {
      console.error(e);
      toast.error('Failed to simulate incident', { id: loadingToast });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto p-8 max-w-5xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 pb-6 border-b gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">System Status: Operational</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Git Repo:</span>
                <input 
                  type="text" 
                  value={repo} 
                  onChange={(e) => setRepo(e.target.value)}
                  className="px-3 py-1.5 rounded border bg-background text-sm w-64 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="owner/repo"
                />
            </div>
            
            <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                onClick={() => document.getElementById('simulation-menu')?.classList.toggle('hidden')}
                disabled={loading}
                className="font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Simulate Incident
              </Button>
              <div
                id="simulation-menu"
                className="hidden absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg border border-border z-50"
              >
                <div className="py-1">
                    <button
                    onClick={() => {
                      const scenarios = [
                        {
                          title: 'High Latency in Auth Service',
                          service: 'auth-service',
                          errorKeyword: 'ConnectionRefused',
                        },
                        {
                          title: 'Payment API 500 Errors',
                          service: 'payment-service',
                          errorKeyword: 'PaymentGatewayError',
                        },
                        { title: 'Database CPU Spike > 90%', service: 'user-db', errorKeyword: 'QueryTimeout' },
                      ];
                      simulateIncident(scenarios[Math.floor(Math.random() * scenarios.length)]);
                      document.getElementById('simulation-menu')?.classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-red-500 font-medium"
                  >
                    Simulate SRE Incident
                  </button>
                  <button
                    onClick={() => {
                      simulateIncident({
                        title: 'Critical: S3 Public Access Detection',
                        service: 'aws-s3-security',
                        errorKeyword: 'ComplianceViolation',
                      });
                      document.getElementById('simulation-menu')?.classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-blue-500 font-medium"
                  >
                    Simulate Security Alert
                  </button>
                  <button
                    onClick={() => {
                      simulateIncident({
                        title: 'Cost Alert: Monthly Budget Exceeded',
                        service: 'aws-cost-explorer',
                        errorKeyword: 'BudgetThresholdBreached',
                      });
                      document.getElementById('simulation-menu')?.classList.add('hidden');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-green-500 font-medium"
                  >
                    Simulate FinOps Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Active Incidents</h2>
            <Button variant="ghost" size="icon" onClick={fetchIncidents}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid gap-6">
            {incidents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShieldCheck className="h-16 w-16 mb-4 text-primary/20" />
                  <p className="text-lg font-medium">No active incidents</p>
                  <p className="text-sm">System is healthy and operational.</p>
                </CardContent>
              </Card>
            ) : (
              incidents.map((incident) => (
                <Link key={incident.id} href={`/incident/${incident.id}`} className="block group">
                  <Card className="hover:border-primary/50 hover:shadow-md transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 p-2 rounded-full ${incident.status === 'open' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'}`}
                          >
                            {incident.status === 'open' ? (
                              <AlertCircle className="w-5 h-5" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="group-hover:text-primary transition-colors text-xl">
                              {incident.title}
                            </CardTitle>
                            <CardDescription className="mt-1 text-base">{incident.description}</CardDescription>
                            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(incident.created_at).toLocaleString()}
                              </span>
                              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                                ID: {incident.id.substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={incident.status === 'open' ? 'destructive' : 'secondary'} className="uppercase">
                          {incident.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
