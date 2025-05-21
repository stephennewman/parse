"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus, ListChecks, AlertCircle, LayoutGrid, BarChart2, PieChart, Gauge } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

// File Purpose: This is the main dashboard page, showing key stats, recent activity, and quick actions for users after they log in.
// Last updated: 2025-05-21

// Fake/demo data fallback
const FAKE_LABELS_PER_DAY = [4, 7, 2, 9, 5, 3, 6];
const FAKE_COMPLIANCE = [
  { name: "Compliant", value: 32 },
  { name: "Non-Compliant", value: 4 },
];
const FAKE_RECENT = [
  { labelType: "Prep Label", food: "Scrambled Eggs", compliance: "Compliant", date: "2024-06-01 10:15" },
  { labelType: "Consumer Label", food: "Chicken Salad", compliance: "Missing Allergen", date: "2024-06-01 11:00" },
  { labelType: "Prep Label", food: "Mac & Cheese", compliance: "Compliant", date: "2024-06-01 12:30" },
  { labelType: "Prep Label", food: "Fruit Cup", compliance: "Compliant", date: "2024-06-01 13:00" },
  { labelType: "Consumer Label", food: "Apple Pie", compliance: "Compliant", date: "2024-06-01 14:00" },
];

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalForms, setTotalForms] = useState<number>(0);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Real data hooks (replace with real fetch if available)
  const [labelsPerDay, setLabelsPerDay] = useState<number[]>(FAKE_LABELS_PER_DAY);
  const [compliance, setCompliance] = useState(FAKE_COMPLIANCE);
  const [recent, setRecent] = useState(FAKE_RECENT);
  const totalThisWeek = labelsPerDay.reduce((a, b) => a + b, 0);
  const uniqueFoods = 7; // Fake/demo
  const complianceRate = Math.round((compliance[0].value / (compliance[0].value + compliance[1].value)) * 100);

  // Chart components state
  const [chartComponents, setChartComponents] = useState<any>({});

  // Demo data for new widgets
  const FORMS_OVERVIEW = [
    { name: 'Food Safety Checklist', submissions: 12 },
    { name: 'Prep Label', submissions: 8 },
    { name: 'Consumer Label', submissions: 16 },
  ];
  const ACTIVITY_30D = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: Math.floor(Math.random() * 10) + 1 }));

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
          Pie: recharts.Pie,
          Cell: recharts.Cell,
          PieChartComp: recharts.PieChart,
        });
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
            .select('count', { count: 'exact', head: true })
            // .eq('user_id', userId)
          ,
          supabase
            .from('form_submissions')
            .select('count', { count: 'exact', head: true })
            // .eq('user_id', userId)
          ,
          supabase
            .from('form_submissions')
            .select(`
              id,
              created_at,
              form_templates!inner ( name )
            `)
            // .eq('user_id', userId)
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

  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, Cell, PieChartComp } = chartComponents;

  return (
    <div className="space-y-8">
      {/* Gradient Hero Section */}
      <div className="rounded-xl p-8 mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Welcome to Krezzo</h1>
          <p className="text-lg text-blue-100 font-medium">Your voice-driven workflow partner.</p>
        </div>
      </div>
      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="text-xl font-bold text-gray-900">3</div>
            <div className="text-xs text-gray-500">Active Forms</div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="text-xl font-bold text-gray-900">5</div>
            <div className="text-xs text-gray-500">Submissions Today</div>
          </CardContent>
        </Card>
      </div>
      {/* Charts and tables stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Submission Trends Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Submission Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {BarChart ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={labelsPerDay.map((v, i) => ({ day: ['S','M','T','W','T','F','S'][i], value: v }))}>
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-end gap-2 h-24">
                {labelsPerDay.map((val, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-gradient-to-t from-blue-500 to-purple-500 rounded w-4" style={{ height: `${val * 10}px` }}></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Submission Activity 30D Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Submission Activity (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {BarChart ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ACTIVITY_30D}>
                  <XAxis dataKey="day" hide />
                  <YAxis allowDecimals={false} hide />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#barGradient2)" radius={[2, 2, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a21caf" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-end gap-2 h-24">
                {ACTIVITY_30D.map((val, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-gradient-to-t from-indigo-500 to-purple-500 rounded w-2" style={{ height: `${val.value * 6}px` }}></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Forms Overview and Recent Submissions stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Forms Overview */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-800">Forms Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FORMS_OVERVIEW.map((form, i) => (
                    <TableRow key={form.name}>
                      <TableCell>{form.name}</TableCell>
                      <TableCell>{form.submissions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        {/* Recent Submissions Table */}
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