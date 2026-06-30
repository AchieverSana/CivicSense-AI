'use client';
import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api';
import { Trophy, Star, Shield, Award } from 'lucide-react';

const BADGE_STYLES: Record<string, string> = {
  'Bronze Hero': 'bg-orange-100 text-orange-700',
  'Silver Hero': 'bg-gray-100 text-gray-600',
  'Gold Hero': 'bg-yellow-100 text-yellow-700',
  'Platinum Hero': 'bg-purple-100 text-purple-700',
};

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.leaderboard('Jaipur').then(({ data }) => setLeaders(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Sort everyone by points (highest first). Only real users from the API —
  // no demo/placeholder entries, so this always matches what's shown elsewhere.
  const data = [...leaders].sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Trophy size={18} className="text-yellow-500" />
        <h1 className="text-lg font-semibold">Community Heroes — Jaipur</h1>
      </div>

      {/* Point guide */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { action: 'Report issue', pts: '+50', icon: Star },
          { action: 'Verify issue', pts: '+15', icon: Shield },
          { action: 'Issue resolved', pts: '+100', icon: Award },
        ].map(({ action, pts, icon: Icon }) => (
          <div key={action} className="card p-3 text-center">
            <Icon size={16} className="mx-auto mb-1 text-civic-teal" />
            <div className="text-sm font-semibold text-civic-teal">{pts}</div>
            <div className="text-xs text-gray-400">{action}</div>
          </div>
        ))}
      </div>

      {/* Badge tiers */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { tier: 'Bronze Hero', range: '0–499 pts', color: 'bg-orange-100 text-orange-700 border-orange-200' },
          { tier: 'Silver Hero', range: '500–1499 pts', color: 'bg-gray-100 text-gray-600 border-gray-200' },
          { tier: 'Gold Hero', range: '1500–4999 pts', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          { tier: 'Platinum Hero', range: '5000+ pts', color: 'bg-purple-100 text-purple-700 border-purple-200' },
        ].map((b) => (
          <div key={b.tier} className={`text-xs px-3 py-1.5 rounded-full border ${b.color}`}>
            {b.tier} · {b.range}
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="card p-6 space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">No heroes yet</p>
          <p className="text-sm">Report or verify an issue to be the first on the board!</p>
        </div>
      ) : (
      <div className="card overflow-hidden">
        {data.map((user, i) => {
          const initials = user.name.split(' ').map((n: string) => n[0]).join('');
          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < data.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className={`text-sm font-semibold w-6 text-center ${RANK_COLORS[i] || 'text-gray-400'}`}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
              </span>
              <div className="w-9 h-9 rounded-full bg-civic-teal-light text-civic-teal flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-gray-400">{user.issuesReported} reported · {user.issuesVerified} verified</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_STYLES[user.badge] || 'bg-gray-100 text-gray-500'}`}>
                {user.badge}
              </span>
              <div className="text-sm font-semibold text-right min-w-16">{user.points.toLocaleString()} <span className="text-xs text-gray-400">pts</span></div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}