"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rss, Thermometer, BatteryFull, BatteryLow, BatteryMedium, BatteryWarning, Clock, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Area } from 'recharts';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';

// Mock sensor data
const mockSensors = [
  {
    id: 1,
    name: 'Walk-in Freezer',
    location: 'Boston Site A - Kitchen',
    status: 'Alert',
    temperature: -15.8,
    unit: '°C',
    updated: '6 minutes ago',
    battery: 85,
    type: 'Freezer',
    online: true,
    alert: true,
    minF: -10, maxF: 10,
  },
  {
    id: 2,
    name: 'Produce Fridge 1',
    location: 'Boston Site A - Prep Area',
    status: 'Normal',
    temperature: 2.5,
    unit: '°C',
    updated: '8 minutes ago',
    battery: 92,
    type: 'Fridge',
    online: true,
    alert: false,
    minF: 34, maxF: 40,
  },
  {
    id: 3,
    name: 'Ambient Back Room',
    location: 'Toronto Clinic - Storage',
    status: 'Normal',
    temperature: 23.3,
    unit: '°C',
    updated: 'just now',
    battery: 90,
    type: 'Room',
    online: true,
    alert: false,
  },
  {
    id: 4,
    name: 'Vaccine Fridge',
    location: 'Toronto Clinic - Lab',
    status: 'Normal',
    temperature: 4.1,
    unit: '°C',
    updated: '2 minutes ago',
    battery: 78,
    type: 'Fridge',
    online: true,
    alert: false,
  },
  {
    id: 5,
    name: 'Meat Freezer',
    location: 'Miami Warehouse - Section C',
    status: 'Offline',
    temperature: null,
    unit: '',
    updated: '1 hour ago',
    battery: 10,
    type: 'Freezer',
    online: false,
    alert: true,
  },
  {
    id: 6,
    name: 'Dairy Fridge',
    location: 'London Hub - Cafe',
    status: 'Alert',
    temperature: 8.9,
    unit: '°C',
    updated: '15 minutes ago',
    battery: 65,
    type: 'Fridge',
    online: true,
    alert: true,
  },
  {
    id: 7,
    name: 'Temperature Probe 1',
    location: 'Boston Site A - Loading Dock',
    status: 'Normal',
    temperature: 20.6,
    unit: '°C',
    updated: '10 minutes ago',
    battery: 80,
    type: 'Probe',
    online: true,
    alert: false,
  },
  {
    id: 8,
    name: 'Ambient Temperature Room',
    location: 'Miami Warehouse - Office',
    status: 'Alert',
    temperature: 28.1,
    unit: '°C',
    updated: '5 minutes ago',
    battery: 60,
    type: 'Room',
    online: true,
    alert: true,
  },
  {
    id: 9,
    name: 'Freezer Sensor B',
    location: 'Tokyo Center - Storage 2',
    status: 'Normal',
    temperature: -22.5,
    unit: '°C',
    updated: '12 minutes ago',
    battery: 95,
    type: 'Freezer',
    online: true,
    alert: false,
  },
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Freezer', label: 'Freezer' },
  { value: 'Fridge', label: 'Fridge' },
  { value: 'Room', label: 'Room' },
  { value: 'Probe', label: 'Probe' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Alert', label: 'Alert' },
  { value: 'Offline', label: 'Offline' },
];

// Helper: Celsius to Fahrenheit
function cToF(c: number) {
  return Math.round((c * 9) / 5 + 32);
}

// Generate mock trend data for each sensor (in F for trends view)
function generateTrendData(sensor: typeof mockSensors[number]) {
  let base = sensor.temperature ?? 0;
  const arr = [];
  for (let i = 0; i < 12; i++) {
    base += (Math.random() - 0.5) * 1.5;
    arr.push({ t: i, v: cToF(base) });
  }
  return arr;
}

// Helper: get trend line color based on setpoints
function getTrendColor(trend: { v: number }[], min: number, max: number) {
  let out = false, borderline = false;
  const margin = (max - min) * 0.1;
  for (const pt of trend) {
    if (pt.v < min || pt.v > max) out = true;
    else if (pt.v < min + margin || pt.v > max - margin) borderline = true;
  }
  if (out) return '#ef4444'; // red
  if (borderline) return '#eab308'; // yellow
  return '#22c55e'; // green
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Normal': return 'bg-green-100 text-green-800';
    case 'Alert': return 'bg-red-100 text-red-800';
    case 'Offline': return 'bg-gray-200 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getBatteryIcon(battery: number | null | undefined) {
  if (battery == null) return <BatteryWarning className="text-gray-400" />;
  if (battery > 80) return <BatteryFull className="text-green-600" />;
  if (battery > 40) return <BatteryMedium className="text-yellow-500" />;
  if (battery > 15) return <BatteryLow className="text-orange-500" />;
  return <BatteryLow className="text-red-600" />;
}

function getTempColor(sensor: typeof mockSensors[number]) {
  if (sensor.status === 'Offline') return 'text-gray-400';
  if (sensor.status === 'Alert') return 'text-red-600 font-bold';
  if (sensor.temperature != null && sensor.temperature < 0) return 'text-blue-600';
  return 'text-green-700';
}

// Mock log data for detailed view
function generateLogs(sensor: typeof mockSensors[number]) {
  const logs = [];
  let base = sensor.temperature ?? 0;
  for (let i = 0; i < 24; i++) {
    base += (Math.random() - 0.5) * 1.5;
    logs.push({
      time: `${24 - i} min ago`,
      value: cToF(base),
      status: base < (sensor.minF ?? 34) || base > (sensor.maxF ?? 40) ? 'Alert' : 'Normal',
    });
  }
  return logs;
}

// Helper to extract temperature value from event_value
function extractTemperature(ev: any): number | null {
  try {
    const tempObj = typeof ev.event_value?.temperature === 'string'
      ? JSON.parse(ev.event_value.temperature)
      : ev.event_value?.temperature;
    return typeof tempObj?.value === 'number' ? tempObj.value : null;
  } catch {
    return null;
  }
}

export default function SensorsPage() {
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState<'table' | 'trends'>('table');
  const [chartComponents, setChartComponents] = useState<any>({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dtSensor, setDtSensor] = useState<any>(null);
  const [dtLoading, setDtLoading] = useState(true);
  const [dtTrend, setDtTrend] = useState<any[]>([]);

  useEffect(() => {
    if (view === 'trends' || true) { // Always load for DT card
      (async () => {
        const recharts = await import('recharts');
        setChartComponents({
          LineChart: recharts.LineChart,
          Line: recharts.Line,
          XAxis: recharts.XAxis,
          YAxis: recharts.YAxis,
          Tooltip: recharts.Tooltip,
          ResponsiveContainer: recharts.ResponsiveContainer,
        });
      })();
    }
  }, [view]);

  useEffect(() => {
    const supabase = createClientComponentClient();
    async function fetchLatestDT() {
      setDtLoading(true);
      // Fetch latest event for summary
      const { data: latest, error: err1 } = await supabase
        .from('sensor_events')
        .select('*')
        .order('event_timestamp', { ascending: false })
        .limit(1);
      if (!err1 && latest && latest.length > 0) {
        setDtSensor(latest[0]);
      } else {
        setDtSensor(null);
      }
      // Fetch last 24 events for trend
      const { data: trend, error: err2 } = await supabase
        .from('sensor_events')
        .select('*')
        .order('event_timestamp', { ascending: false })
        .limit(24);
      if (!err2 && trend && trend.length > 0) {
        // Reverse for chronological order
        setDtTrend(trend.reverse());
      } else {
        setDtTrend([]);
      }
      setDtLoading(false);
    }
    fetchLatestDT();
  }, []);

  // Filtering
  let filtered = mockSensors.filter(sensor => {
    const typeMatch = type === 'all' || sensor.type === type;
    const statusMatch = status === 'all' || sensor.status === status;
    const searchMatch =
      sensor.name.toLowerCase().includes(search.toLowerCase()) ||
      sensor.location.toLowerCase().includes(search.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  // Sorting
  filtered = filtered.sort((a, b) => {
    let valA: any = a[sortBy as keyof typeof a];
    let valB: any = b[sortBy as keyof typeof b];
    // Special handling for temperature, battery, updated
    if (sortBy === 'temperature') {
      valA = a.temperature ?? -Infinity;
      valB = b.temperature ?? -Infinity;
    }
    if (sortBy === 'battery') {
      valA = a.battery ?? -1;
      valB = b.battery ?? -1;
    }
    if (sortBy === 'updated') {
      // Not a real date, but try to sort by recency (minutes/hours ago, just now)
      const parseTime = (str: string) => {
        if (str.includes('just now')) return 0;
        if (str.includes('minute')) return parseInt(str) * 60;
        if (str.includes('hour')) return parseInt(str) * 3600;
        return 999999;
      };
      valA = parseTime(a.updated);
      valB = parseTime(b.updated);
    }
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex">
          <li><Link href="/" className="hover:underline">Home</Link></li>
          <li><span className="mx-2">/</span></li>
          <li className="text-gray-700">Sensors</li>
        </ol>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><Rss className="text-blue-600" size={28} /> Sensors</h1>
        <div className="flex gap-2 items-center">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 text-muted-foreground" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sensors..."
              className="pl-8 pr-2 py-1 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ minWidth: 180 }}
            />
          </div>
          <Button variant="outline">More Filters</Button>
          <div className="ml-4 flex gap-1 bg-muted rounded p-1">
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
            >
              Table View
            </Button>
            <Button
              variant={view === 'trends' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('trends')}
            >
              Trends View
            </Button>
          </div>
        </div>
      </div>
      {/* DT Sensor Card */}
      <Card className="border-blue-500 border-2 mb-4">
        <div className="flex items-center gap-4 p-4">
          <Rss className="text-blue-600" size={32} />
          <div className="flex-1">
            <div className="font-bold text-lg">DT Sensor</div>
            {dtLoading ? (
              <div className="text-gray-500 text-sm">Loading latest event...</div>
            ) : dtSensor ? (
              <div>
                <div className="text-md font-semibold">{dtSensor.event_value.sensor_name || dtSensor.sensor_id}</div>
                <div className="text-sm text-gray-700">
                  {dtSensor.event_type}: {extractTemperature(dtSensor) !== null ? `${cToF(extractTemperature(dtSensor))}°F` : '—'}
                </div>
                <div className="text-xs text-gray-500 mb-2">{new Date(dtSensor.event_timestamp).toLocaleString()}</div>
                {/* Trend Chart */}
                {chartComponents.LineChart && dtTrend.length > 1 && dtTrend.some(e => extractTemperature(e) !== null) ? (
                  <div className="h-32">
                    <chartComponents.ResponsiveContainer width="100%" height="100%">
                      <chartComponents.LineChart data={dtTrend} margin={{ left: 0, right: 0, top: 8, bottom: 8 }}>
                        <chartComponents.XAxis dataKey="event_timestamp" tickFormatter={(t: string) => new Date(t).toLocaleTimeString()} hide={false} fontSize={10} />
                        <chartComponents.YAxis domain={['auto', 'auto']} fontSize={10} />
                        <chartComponents.Tooltip
                          formatter={(v: number | null | undefined) => (v !== null && v !== undefined ? `${v}°F` : '—')}
                          labelFormatter={(l: string) => new Date(l).toLocaleString()}
                        />
                        <chartComponents.Line
                          type="monotone"
                          dataKey={(e: any) => {
                            const temp = extractTemperature(e);
                            return temp !== null ? cToF(temp) : null;
                          }}
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </chartComponents.LineChart>
                    </chartComponents.ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 mt-2">No trend data available.</div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No DT sensor events found.</div>
            )}
          </div>
        </div>
      </Card>
      {view === 'table' ? (
        <Card>
          <Table>
            <thead>
              <tr>
                <th className="text-center"></th>
                <th className="text-left cursor-pointer select-none" onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && (sortDirection === 'asc' ? <ArrowUp className="inline ml-1" size={14} /> : <ArrowDown className="inline ml-1" size={14} />)}
                </th>
                <th className="text-left cursor-pointer select-none" onClick={() => handleSort('location')}>
                  Location {sortBy === 'location' && (sortDirection === 'asc' ? <ArrowUp className="inline ml-1" size={14} /> : <ArrowDown className="inline ml-1" size={14} />)}
                </th>
                <th className="text-left cursor-pointer select-none" onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && (sortDirection === 'asc' ? <ArrowUp className="inline ml-1" size={14} /> : <ArrowDown className="inline ml-1" size={14} />)}
                </th>
                <th className="text-center cursor-pointer select-none" onClick={() => handleSort('temperature')}>
                  Temperature {sortBy === 'temperature' && (sortDirection === 'asc' ? <ArrowUp className="inline ml-1" size={14} /> : <ArrowDown className="inline ml-1" size={14} />)}
                </th>
                <th className="text-left cursor-pointer select-none" onClick={() => handleSort('updated')}>
                  Last Update {sortBy === 'updated' && (sortDirection === 'asc' ? <ArrowUp className="inline ml-1" size={14} /> : <ArrowDown className="inline ml-1" size={14} />)}
                </th>
                <th className="text-center cursor-pointer select-none" onClick={() => handleSort('battery')}>
                  Battery {sortBy === 'battery' && (sortDirection === 'asc' ? <ArrowUp className="inline ml-1" size={14} /> : <ArrowDown className="inline ml-1" size={14} />)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sensor => (
                <tr
                  key={sensor.id}
                  className={
                    'transition-colors hover:bg-muted/50 ' +
                    (sensor.status === 'Alert' || sensor.status === 'Offline'
                      ? 'bg-red-50 dark:bg-red-900/40'
                      : 'bg-green-50 dark:bg-green-900/40')
                  }
                >
                  <td className="pl-2 pr-0 text-center"><Rss className="text-blue-500" /></td>
                  <td className="font-semibold text-left">{sensor.name}</td>
                  <td className="text-left">{sensor.location}</td>
                  <td className="text-left">
                    <Badge className={getStatusColor(sensor.status)}>{sensor.status}</Badge>
                  </td>
                  <td className={getTempColor(sensor) + ' text-center'}>
                    <Thermometer className="inline-block mr-1 align-text-bottom" size={18} />
                    {sensor.temperature !== null ? `${cToF(sensor.temperature)}°F` : '—'}
                  </td>
                  <td className="text-left">
                    <Clock className="inline-block mr-1 align-text-bottom text-muted-foreground" size={16} />
                    <span>{sensor.updated}</span>
                  </td>
                  <td className="flex items-center gap-1 justify-center">
                    {getBatteryIcon(sensor.battery)}
                    <span className="text-xs text-muted-foreground">{sensor.battery != null ? `${sensor.battery}%` : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sensor => {
            const trend = generateTrendData(sensor);
            const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } = chartComponents;
            const minF = sensor.minF ?? 34;
            const maxF = sensor.maxF ?? 40;
            const trendColor = getTrendColor(trend, minF, maxF);
            return (
              <Card key={sensor.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{sensor.name}</div>
                    <div className="text-sm text-muted-foreground">{sensor.location}</div>
                  </div>
                  <div className={sensor.status === 'Alert' || sensor.status === 'Offline' ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                    {sensor.status}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    {sensor.temperature !== null ? `${cToF(sensor.temperature)}°F` : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">Batt: {sensor.battery != null ? `${sensor.battery}%` : '—'}</div>
                </div>
                <div className="h-24">
                  {LineChart ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend} margin={{ left: 0, right: 0, top: 8, bottom: 8 }}>
                        <XAxis dataKey="t" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        {/* Setpoint band */}
                        <Area
                          type="monotone"
                          dataKey={() => maxF}
                          stroke={undefined}
                          fill="#a3e63533"
                          isAnimationActive={false}
                          dot={false}
                          activeDot={false}
                        />
                        <Area
                          type="monotone"
                          dataKey={() => minF}
                          stroke={undefined}
                          fill="#a3e63533"
                          isAnimationActive={false}
                          dot={false}
                          activeDot={false}
                        />
                        <Tooltip
                          formatter={(v: number | null | undefined) => (v !== null && v !== undefined ? `${v}°F` : '—')}
                          labelFormatter={(l: string) => new Date(l).toLocaleString()}
                        />
                        <Line type="monotone" dataKey="v" stroke={trendColor} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-end gap-1 h-full">
                      {trend.map((pt, i) => (
                        <div key={i} className={
                          pt.v < minF || pt.v > maxF
                            ? 'bg-red-400'
                            : (pt.v < minF + (maxF - minF) * 0.1 || pt.v > maxF - (maxF - minF) * 0.1)
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                        } style={{ height: `${Math.max(8, Math.abs(pt.v) * 2)}px`, width: '8px', borderRadius: '2px' }}></div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Setpoint: {minF}–{maxF}°F</div>
                <div className="text-xs text-muted-foreground">Last update: {sensor.updated}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 