'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi, aiApi } from '@/lib/api';
import { TrendingUp, Users, CheckCircle, AlertCircle, Zap } from 'lucide-react';

const COLORS = ['#A32D2D', '#BA7517', '#185FA5', '#3B6D11', '#0F6E56', '#993556'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats('Jaipur'),
      aiApi.insights('Jaipur'),
    ]).then(([s, i]) => {
      setStats(s.data);
      setInsights(i.data.insights);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">City Dashboard — Jaipur</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open issues', value: stats?.open ?? 247, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Resolved (30d)', value: stats?.resolved ?? 83, icon: CheckCircle, color: 'text-civic-teal bg-civic-teal-light' },
          { label: 'Total reports', value: stats?.total ?? 1420, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Community heroes', value: stats?.communityHeroes ?? 1420, icon: Users, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={16} />
            </div>
            <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By category */}
        <div className="card p-4">
          <h3 className="text-sm font-medium mb-3">Issues by category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.byCategory || [
              { _id: 'Pothole', count: 89 }, { _id: 'Garbage', count: 62 },
              { _id: 'Water leakage', count: 41 }, { _id: 'Broken streetlight', count: 35 },
              { _id: 'Road damage', count: 20 },
            ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#0F6E56" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By severity pie */}
        <div className="card p-4">
          <h3 className="text-sm font-medium mb-3">Severity breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.bySeverity || [
                  { _id: 'Critical', count: 28 }, { _id: 'High', count: 74 },
                  { _id: 'Medium', count: 105 }, { _id: 'Low', count: 40 },
                ]}
                dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label={({ _id, percent }) => `${_id} ${Math.round(percent * 100)}%`}
                labelLine={false}
              >
                {(stats?.bySeverity || []).map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Predictive Insights */}
      {insights && (
        <div className="card p-4 border-civic-teal border">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-civic-teal" />
            <h3 className="text-sm font-medium">AI Predictive Insights</h3>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{insights}</div>
        </div>
      )}
    </div>
  );
}
