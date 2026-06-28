'use client';
import { useEffect, useState } from 'react';
import { IssueCard } from '@/components/issues/IssueCard';
import { issueApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Filter, Radio } from 'lucide-react';

const CATEGORIES = ['All', 'Pothole', 'Garbage', 'Water leakage', 'Broken streetlight', 'Road damage', 'Sewage'];
const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'open', 'in-progress', 'resolved'];

export default function FeedPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [sev, setSev] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('-createdAt');
  const [liveUpdate, setLiveUpdate] = useState(false);

  const fetchIssues = () => {
    const params: Record<string, string> = { city: 'Jaipur', sort };
    if (cat !== 'All') params.category = cat;
    if (sev !== 'All') params.severity = sev;
    if (status !== 'All') params.status = status;

    setLoading(true);
    return issueApi.list(params)
      .then(({ data }) => setIssues(data.issues))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
  }, [cat, sev, status, sort]);

  // Live updates: the backend broadcasts 'new-issue' / 'issue-updated' over
  // Socket.io to the city room (see backend/src/index.ts +
  // issues.controller.ts) whenever someone reports, votes, or verifies.
  // We surface that as a "new activity" banner rather than silently
  // re-fetching mid-scroll, which would be jarring during a live demo.
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join-city', 'Jaipur');
    const onActivity = () => setLiveUpdate(true);
    socket.on('new-issue', onActivity);
    socket.on('issue-updated', onActivity);
    return () => {
      socket.off('new-issue', onActivity);
      socket.off('issue-updated', onActivity);
    };
  }, []);

  const refreshNow = () => {
    setLiveUpdate(false);
    fetchIssues();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Community Feed</h1>
        <span className="text-sm text-gray-400">{issues.length} issues</span>
      </div>

      {liveUpdate && (
        <button
          onClick={refreshNow}
          className="w-full mb-4 flex items-center justify-center gap-2 text-sm bg-civic-teal-light text-civic-teal border border-civic-teal rounded-lg py-2 hover:opacity-90 transition-opacity"
        >
          <Radio size={13} className="animate-pulse" /> New activity in Jaipur — tap to refresh
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1 text-xs text-gray-400"><Filter size={12} /> Filter:</div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${cat === c ? 'bg-civic-teal-light border-civic-teal text-civic-teal' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="ml-auto text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-500 bg-white">
          <option value="-createdAt">Newest</option>
          <option value="-priorityScore">Priority</option>
          <option value="-voteCount">Most votes</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-36 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-100 rounded mb-1 w-1/2" />
              <div className="h-8 bg-gray-100 rounded mt-3" />
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-1">No issues found</p>
          <p className="text-sm">Try changing the filters or be the first to report!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => <IssueCard key={issue._id} issue={issue} />)}
        </div>
      )}
    </div>
  );
}
