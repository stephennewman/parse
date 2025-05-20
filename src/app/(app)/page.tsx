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
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home' }]} />
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Gauge className="text-blue-600" size={28} /> Home</h1>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <BarChart2 className="text-blue-600 mb-2" size={32} />
            <div className="text-3xl font-bold text-blue-700">{totalThisWeek}</div>
            <div className="text-sm text-blue-800">Labels Printed This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <ListChecks className="text-green-600 mb-2" size={32} />
            <div className="text-3xl font-bold text-green-700">{uniqueFoods}</div>
            <div className="text-sm text-green-800">Unique Food Items Labeled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <PieChart className="text-purple-600 mb-2" size={32} />
            <div className="text-3xl font-bold text-purple-700">{complianceRate}%</div>
            <div className="text-sm text-purple-800">Compliance Rate</div>
          </CardContent>
        </Card>
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Labels Printed (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {BarChart ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={labelsPerDay.map((v, i) => ({ day: ['S','M','T','W','T','F','S'][i], value: v }))}>
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {labelsPerDay.map((val, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-blue-500 rounded w-6" style={{ height: `${val * 12}px` }}></div>
                    <div className="text-xs mt-1">{['S','M','T','W','T','F','S'][i]}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {PieChartComp ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChartComp>
                  <Pie data={compliance} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    {compliance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#22c55e" : "#f43f5e"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChartComp>
              </ResponsiveContainer>
            ) : (
              <div className="flex gap-4 items-center justify-center h-32">
                <div className="w-20 h-20 rounded-full border-8 border-green-400 border-r-red-400 flex items-center justify-center text-lg font-bold text-green-700">
                  {complianceRate}%
                </div>
                <div>
                  <div className="text-green-600 font-semibold">Compliant</div>
                  <div className="text-red-600 font-semibold">Non-Compliant</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Recent activity table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Label Prints</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label Type</TableHead>
                <TableHead>Food Item</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.labelType}</TableCell>
                  <TableCell>{row.food}</TableCell>
                  <TableCell>
                    <span className={
                      row.compliance === "Compliant"
                        ? "inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs"
                        : "inline-block px-2 py-1 rounded bg-red-100 text-red-700 text-xs"
                    }>
                      {row.compliance}
                    </span>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 