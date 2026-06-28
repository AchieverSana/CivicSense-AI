'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ThumbsUp, ShieldCheck, MapPin, Clock, FileText, Sparkles, ImageOff } from 'lucide-react';
import { issueApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

const SEV: Record<Severity, string> = {
  Critical: 'severity-critical',
  High: 'severity-high',
  Medium: 'severity-medium',
  Low: 'severity-low',
};

const STATUS_DOT: Record<string, string> = {
  open: 'bg-amber-400',
  'in-progress': 'bg-blue-400',
  resolved: 'bg-civic-teal',
  rejected: 'bg-gray-300',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

function isRemoteUrl(url?: string): boolean {
  return !!url && (url.startsWith('https://') || url.startsWith('http://'));
}

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { firebaseUser, signIn } = useAuth();

  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [votes, setVotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [verified, setVerified] = useState(0);
  const [verifiedSelf, setVerifiedSelf] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    issueApi
      .get(id)
      .then(({ data }) => {
        setIssue(data);
        setVotes(data.votes?.length || 0);
        setVerified(data.verifiedBy?.length || 0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async () => {
    if (!firebaseUser) return signIn();
    try {
      const { data } = await issueApi.vote(id);
      setVotes(data.votes);
      setVoted(data.voted);
    } catch {}
  };

  const handleVerify = async () => {
    if (!firebaseUser) return signIn();
    if (verifiedSelf) return;
    try {
      const { data } = await issueApi.verify(id);
      setVerified(data.verifiedBy);
      setVerifiedSelf(true);
    } catch {}
  };

  const handleReport = async () => {
    try {
      const { data } = await issueApi.report(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url);
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
        <div className="card p-5">
          <div className="h-56 bg-gray-100 rounded-lg mb-4" />
          <div className="h-5 bg-gray-100 rounded mb-2 w-2/3" />
          <div className="h-4 bg-gray-100 rounded mb-1 w-1/2" />
          <div className="h-20 bg-gray-100 rounded mt-3" />
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-gray-400">
        <p className="text-lg mb-1">Issue not found</p>
        <p className="text-sm mb-4">It may have been removed, or the link is incorrect.</p>
        <button onClick={() => router.push('/')} className="text-sm text-civic-teal hover:underline">
          Back to Community Feed
        </button>
      </div>
    );
  }

  const priColor =
    issue.priorityScore >= 75 ? 'bg-red-400' : issue.priorityScore >= 45 ? 'bg-amber-400' : 'bg-civic-teal';

  const mediaUrl = issue.media?.[0]?.url;
  const showImage = isRemoteUrl(mediaUrl) && !imgError;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="card p-5">
        {/* Image */}
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={issue.title}
            className="w-full h-56 object-cover rounded-lg mb-4"
            onError={() => setImgError(true)}
          />
        ) : mediaUrl && !showImage ? (
          <div className="w-full h-56 rounded-lg mb-4 bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff size={32} />
            <span className="text-sm">Photo not available</span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="text-lg font-semibold leading-tight flex-1">{issue.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SEV[issue.severity as Severity]}`}>
            {issue.severity}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[issue.status] || 'bg-gray-300'}`} />
            {STATUS_LABEL[issue.status] || issue.status}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {issue.location?.address}, {issue.location?.city}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} /> {new Date(issue.createdAt).toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{issue.category}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">{issue.description}</p>

        {/* Priority bar */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400">Priority</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${priColor}`} style={{ width: `${issue.priorityScore}%` }} />
          </div>
          <span className="text-xs text-gray-400">P{issue.priorityScore}</span>
        </div>

        {/* AI analysis */}
        {issue.aiAnalysis && (
          <div className="bg-civic-teal-light border border-civic-teal-light rounded-lg p-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-civic-teal mb-1.5">
              <Sparkles size={12} /> AI Assessment
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>Department: <span className="text-gray-700">{issue.aiAnalysis.suggestedDepartment}</span></div>
              <div>Confidence: <span className="text-gray-700">{Math.round((issue.aiAnalysis.confidence || 0) * 100)}%</span></div>
              <div>Est. fix time: <span className="text-gray-700">{issue.aiAnalysis.estimatedFixDays} days</span></div>
              <div>Reported by: <span className="text-gray-700">{issue.reportedBy?.name || 'Civic Hero'}</span></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleVote}
            title={firebaseUser ? undefined : 'Sign in to vote'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              voted
                ? 'bg-civic-teal-light border-civic-teal text-civic-teal'
                : 'border-gray-200 text-gray-500 hover:border-civic-teal hover:text-civic-teal'
            }`}
          >
            <ThumbsUp size={12} /> {votes} votes
          </button>

          <button
            onClick={handleVerify}
            title={firebaseUser ? undefined : 'Sign in to verify'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              verifiedSelf
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'
            }`}
          >
            <ShieldCheck size={12} /> {verified} verified
          </button>

          <button
            onClick={handleReport}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            title="Download PDF report"
          >
            <FileText size={12} /> Download report
          </button>
        </div>
      </div>
    </div>
  );
}