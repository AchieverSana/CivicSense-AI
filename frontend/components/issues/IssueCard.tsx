'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ShieldCheck, MapPin, Clock, FileText, ImageOff } from 'lucide-react';
import { issueApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

interface IssueCardProps {
  issue: {
    _id: string;
    title: string;
    description: string;
    category: string;
    severity: Severity;
    status: string;
    location: { address: string; city: string };
    votes: string[];
    verifiedBy: string[];
    priorityScore: number;
    createdAt: string;
    reportedBy?: { name: string; badge: string };
    media?: Array<{ url: string }>;
  };
}

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

/** Only treat a URL as displayable if it's a proper http(s) URL (e.g. Cloudinary). */
function isRemoteUrl(url?: string): boolean {
  return !!url && (url.startsWith('https://') || url.startsWith('http://'));
}

export function IssueCard({ issue }: IssueCardProps) {
  const router = useRouter();
  const { firebaseUser, signIn } = useAuth();
  const [votes, setVotes] = useState(issue.votes.length);
  const [verified, setVerified] = useState(issue.verifiedBy.length);
  const [voted, setVoted] = useState(false);
  const [verifiedSelf, setVerifiedSelf] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser) return signIn();
    try {
      const { data } = await issueApi.vote(issue._id);
      setVotes(data.votes);
      setVoted(data.voted);
    } catch {}
  };

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser) return signIn();
    if (verifiedSelf) return;
    try {
      const { data } = await issueApi.verify(issue._id);
      setVerified(data.verifiedBy);
      setVerifiedSelf(true);
    } catch {}
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data } = await issueApi.report(issue._id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url);
    } catch {}
  };

  const priColor =
    issue.priorityScore >= 75 ? 'bg-red-400' : issue.priorityScore >= 45 ? 'bg-amber-400' : 'bg-civic-teal';

  const mediaUrl = issue.media?.[0]?.url;
  const showImage = isRemoteUrl(mediaUrl) && !imgError;

  return (
    <div
      onClick={() => router.push(`/issues/${issue._id}`)}
      className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Image / placeholder */}
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt={issue.title}
          className="w-full h-36 object-cover rounded-lg mb-3"
          onError={() => setImgError(true)}
        />
      ) : mediaUrl && !showImage ? (
        // Had a URL but it was a local path or failed to load
        <div className="w-full h-36 rounded-lg mb-3 bg-gray-100 flex flex-col items-center justify-center gap-1 text-gray-300">
          <ImageOff size={24} />
          <span className="text-xs">Photo not available</span>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold leading-tight flex-1">{issue.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SEV[issue.severity]}`}>
          {issue.severity}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[issue.status] || 'bg-gray-300'}`} />
          {STATUS_LABEL[issue.status] || issue.status}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={10} />
          {issue.location.address}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {new Date(issue.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{issue.description}</p>

      {/* Priority bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${priColor}`} style={{ width: `${issue.priorityScore}%` }} />
        </div>
        <span className="text-xs text-gray-400">P{issue.priorityScore}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleVote}
          title={firebaseUser ? undefined : 'Sign in to vote'}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            voted
              ? 'bg-civic-teal-light border-civic-teal text-civic-teal'
              : 'border-gray-200 text-gray-500 hover:border-civic-teal hover:text-civic-teal'
          }`}
        >
          <ThumbsUp size={11} /> {votes}
        </button>

        <button
          onClick={handleVerify}
          title={firebaseUser ? undefined : 'Sign in to verify'}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            verifiedSelf
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'
          }`}
        >
          <ShieldCheck size={11} /> {verified} verified
        </button>

        <button
          onClick={handleReport}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          title="Download PDF report"
        >
          <FileText size={11} /> Report
        </button>
      </div>
    </div>
  );
}