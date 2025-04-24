"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, FilePlus, ListChecks, AlertCircle, LayoutGrid } from 'lucide-react';

// Types (consider moving to a shared file)
interface RecentSubmission {
  id: string;
  created_at: string;
  form_templates: {
    name: string;
  } | null;
}

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalForms, setTotalForms] = useState<number>(0);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

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
            .eq('user_id', userId),
          supabase
            .from('form_submissions')
            .select('count', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('form_submissions')
            .select(`
              id,
              created_at,
              form_templates!inner ( name )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (formsCountRes.error) throw new Error(`Form count error: ${formsCountRes.error.message}`);
        if (submissionsCountRes.error) throw new Error(`Submission count error: ${submissionsCountRes.error.message}`);
        if (recentSubsRes.error) throw new Error(`Recent submissions error: ${recentSubsRes.error.message}`);

        setTotalForms(formsCountRes.count ?? 0);
        setTotalSubmissions(submissionsCountRes.count ?? 0);
        setRecentSubmissions((recentSubsRes.data as unknown as RecentSubmission[]) || []); 

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

  return (
    <div className="space-y-8">
      <h1 className="text-sm font-semibold mb-4">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalForms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSubmissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.form_templates?.name ?? 'Unknown'}</TableCell>
                        <TableCell>{format(new Date(sub.created_at), 'PP p')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/submissions/${sub.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent submissions found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-1">
           <Card>
             <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col space-y-3">
                <Button asChild>
                    <Link href="/forms/new" className="flex items-center justify-center gap-2">
                        <FilePlus className="h-4 w-4" /> Create New Form
                    </Link>
                </Button>
                 <Button variant="outline" asChild>
                    <Link href="/submissions" className="flex items-center justify-center gap-2">
                        <ListChecks className="h-4 w-4" /> View All Submissions
                    </Link>
                </Button>
                 <Button variant="outline" asChild>
                    <Link href="/forms" className="flex items-center justify-center gap-2">
                         <LayoutGrid className="h-4 w-4" /> Manage Forms
                    </Link>
                </Button>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
} 