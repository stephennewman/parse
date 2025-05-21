"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { format, addDays, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus, ListChecks, AlertCircle, LayoutGrid, BarChart2, PieChart, Gauge } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

// File Purpose: This is the main dashboard page, showing key stats, recent activity, and quick actions for users after they log in.
// Last updated: 2025-05-21

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalForms, setTotalForms] = useState<number>(0);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionsPerDay, setSubmissionsPerDay] = useState<{ date: string, count: number }[]>([]);
  const [chartReady, setChartReady] = useState(false);
  const [chartComponents, setChartComponents] = useState<any>({});
  const [pieData, setPieData] = useState<{ name: string, value: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const recharts = await import('recharts');
        setChartComponents({
          BarChart: recharts.BarChart,
          Bar: recharts.Bar,
          XAxis: recharts.XAxis,
          YAxis: recharts.YAxis,
          Tooltip: recharts.Tooltip,
          ResponsiveContainer: recharts.ResponsiveContainer,
          PieChart: recharts.PieChart,
          Pie: recharts.Pie,
          Cell: recharts.Cell,
        });
        setChartReady(true);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
         setError("User not authenticated.");
         setLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [formsCountRes, submissionsCountRes, recentSubsRes] = await Promise.all([
          supabase
            .from('form_templates')
            .select('count', { count: 'exact', head: true }),
          supabase
            .from('form_submissions')
            .select('count', { count: 'exact', head: true }),
          supabase
            .from('form_submissions')
            .select(`
              id,
              created_at,
              form_templates!inner ( name )
            `)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);
        if (formsCountRes.error) throw new Error(`Form count error: ${formsCountRes.error.message}`);
        if (submissionsCountRes.error) throw new Error(`Submission count error: ${submissionsCountRes.error.message}`);
        if (recentSubsRes.error) throw new Error(`Recent submissions error: ${recentSubsRes.error.message}`);
        setTotalForms(formsCountRes.count ?? 0);
        setTotalSubmissions(submissionsCountRes.count ?? 0);
        setRecentSubmissions((recentSubsRes.data as unknown as any[]) || []); 
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId) return;
    const fetchSubmissionsPerDay = async () => {
      // Get the date 30 days ago
      const fromDate = subDays(new Date(), 29);
      const toDate = new Date();
      // Fetch all submissions in the last 30 days
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, created_at')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      if (error) {
        setSubmissionsPerDay([]);
        return;
      }
      // Group by date (YYYY-MM-DD)
      const counts: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = format(addDays(fromDate, i), 'yyyy-MM-dd');
        counts[d] = 0;
      }
      (data || []).forEach((row: any) => {
        const d = format(new Date(row.created_at), 'yyyy-MM-dd');
        if (counts[d] !== undefined) counts[d]++;
      });
      setSubmissionsPerDay(Object.entries(counts).map(([date, count]) => ({ date, count })));
    };
    fetchSubmissionsPerDay();
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId) return;
    const fetchPieData = async () => {
      const fromDate = subDays(new Date(), 29);
      const toDate = new Date();
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, form_templates!inner(name), created_at')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());
      if (error) {
        setPieData([]);
        return;
      }
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const name = row.form_templates?.name || 'Unknown';
        counts[name] = (counts[name] || 0) + 1;
      });
      setPieData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    };
    fetchPieData();
  }, [userId, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10 flex items-center justify-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>Error: {error}</p>
      </div>
    );
  }

  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart: PieChartComp, Pie, Cell } = chartComponents;
  const pieColors = ["#6366f1", "#8b5cf6", "#f59e42", "#10b981", "#f43f5e", "#fbbf24", "#3b82f6", "#a21caf", "#14b8a6", "#eab308"];

  return (
    <div className="space-y-8">
      {/* Gradient Hero Section */}
      <div className="rounded-xl p-8 mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Welcome to Krezzo</h1>
          <p className="text-lg text-blue-100 font-medium">Your voice-driven workflow partner.</p>
        </div>
      </div>
      {/* Charts row (visuals above the fold) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Submissions Per Day Chart (real data) */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Submissions Per Day (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartReady && BarChart ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={submissionsPerDay} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} fontSize={10} angle={-45} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} fontSize={12} width={30} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400">Loading chart...</div>
            )}
          </CardContent>
        </Card>
        {/* Submissions By Form Type Pie Chart (real data) */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Submissions by Form Type (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartReady && PieChartComp && Pie ? (
              pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChartComp>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChartComp>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400">No submissions in the last 30 days.</div>
              )
            ) : (
              <div className="text-center text-gray-400">Loading chart...</div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Stat cards row (only real data) */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="text-xl font-bold text-gray-900">{totalForms}</div>
            <div className="text-xs text-gray-500">Total Forms</div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="text-xl font-bold text-gray-900">{totalSubmissions}</div>
            <div className="text-xs text-gray-500">Total Submissions</div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Submissions Table (real data) */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.length > 0 ? recentSubmissions.map((sub, i) => (
                    <TableRow key={sub.id || i}>
                      <TableCell>{sub.form_templates?.name || 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(sub.created_at), 'PPPpp')}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Submitted</span></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-400">No recent submissions.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 