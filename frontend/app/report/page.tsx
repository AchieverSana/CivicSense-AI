'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Sparkles, CheckCircle, AlertTriangle, LocateFixed } from 'lucide-react';
import { issueApi } from '@/lib/api';

// Jaipur city center — used only if the browser can't provide a real location
// (denied permission, unsupported browser, etc.) AND the address can't be
// geocoded either, so we always have *some* coordinates to submit rather
// than crashing the form.
const FALLBACK_COORDS = { lat: 26.9124, lng: 75.7873 };

// Default placeholder text in the address field — if GPS is unavailable and
// the user never edits this, geocoding it would just resolve to the same
// generic Jaipur-center point for everyone, recreating the original bug.
const PLACEHOLDER_LOCATION = 'Jaipur, Rajasthan';

async function geocodeAddress(address: string) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    // fall through to default
  }
  return FALLBACK_COORDS;
}

type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

interface AIResult {
  _issueId?: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  department: string;
  priorityScore: number;
  estimatedFixDays: number;
  actionRecommendation: string;
}

const SEV_STYLES: Record<Severity, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

export default function ReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState(PLACEHOLDER_LOCATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [duplicate, setDuplicate] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Real device location — replaces the old hardcoded Jaipur-center constant.
  // Without this every single report landed on the exact same point, which
  // silently broke the map, the heatmap, and the 100m duplicate-detection check.
  const [coords, setCoords] = useState(FALLBACK_COORDS);
  const [locStatus, setLocStatus] = useState<'locating' | 'found' | 'denied' | 'unsupported'>('locating');

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocStatus('unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('found');
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // True when GPS isn't available AND the user hasn't given a real address —
  // submitting in this state would silently fall back to the generic
  // Jaipur-center point again, so we block it and ask for a real address.
  const needsRealAddress =
    (locStatus === 'denied' || locStatus === 'unsupported') &&
    location.trim().toLowerCase() === PLACEHOLDER_LOCATION.toLowerCase();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) loadFile(f);
  }, []);

  const loadFile = (f: File) => {
    // 10 MB client-side guard (mirrors multer limit on the backend)
    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
    setResult(null);
  };

  const handleSubmitForAnalysis = async () => {
    if (!file && !desc.trim()) return;

    if (needsRealAddress) {
      setError('We couldn\'t get your exact location. Please type the specific address above before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let finalCoords = coords;
      if (locStatus !== 'found' && location.trim()) {
        finalCoords = await geocodeAddress(location);
      }

      const form = new FormData();
      if (file) form.append('media', file);
      if (desc) form.append('description', desc);
      form.append('city', 'Jaipur');
      form.append('address', location);
      form.append('lat', String(finalCoords.lat));
      form.append('lng', String(finalCoords.lng));

      const { data } = await issueApi.create(form);
      if (data.duplicate) {
        setDuplicate({ id: data.existingIssueId });
      } else {
        // Backend returns { issue, aiAnalysis } — aiAnalysis is nested, not at top level
        setResult({ ...data.aiAnalysis, _issueId: data.issue?._id });
      }
    } catch (err: any) {
      const msg = err.friendlyMessage || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (result?._issueId) {
      router.push(`/issues/${result._issueId}`);
    } else {
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setResult(null);
    setFile(null);
    setPreview(null);
    setDesc('');
    setError(null);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Issue reported! 🎉</h2>
        <p className="text-gray-500 mb-4">
          You earned <span className="font-semibold text-amber-600">+50 Hero points</span>.
          Your complaint is live on the community map.
        </p>
        <button onClick={resetForm} className="btn-primary mx-auto">
          Report another issue
        </button>
      </div>
    );
  }

  if (duplicate) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-amber-600" size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Issue already reported!</h2>
        <p className="text-gray-500 mb-4">
          We found a similar issue nearby. Your upvote has been added to raise its priority.
        </p>
        <div className="flex gap-3 justify-center">
          <a href={`/issues/${duplicate.id}`} className="btn-primary">
            View existing issue
          </a>
          <button onClick={() => setDuplicate(null)} className="btn-secondary">
            Report as new anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">Report an issue</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload a photo and AI will classify, describe, and route it instantly.
      </p>

      <div className="space-y-4">
        {/* Upload zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer overflow-hidden ${
            preview ? 'border-civic-teal' : 'border-gray-200 hover:border-civic-teal-mid'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !preview && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
          />
          {preview ? (
            <div className="relative">
              {/* Use a regular img tag — next/image requires configured domains */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="w-full max-h-64 object-cover" />
              <button
                className="absolute top-3 right-3 bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 shadow border border-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                  setResult(null);
                  setError(null);
                }}
              >
                Change photo
              </button>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Camera className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="text-sm text-gray-500">
                Drop a photo or <span className="text-civic-teal font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Pothole · Garbage · Broken light · Water leak · Max 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <AlertTriangle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Briefly describe the issue…"
            rows={3}
            className="w-full border border-gray-200 rounded-civic px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-civic-teal focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full border rounded-civic pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-civic-teal focus:border-transparent ${
                needsRealAddress ? 'border-amber-300' : 'border-gray-200'
              }`}
            />
          </div>
          <p className="text-xs mt-1.5 flex items-center gap-1">
            {locStatus === 'locating' && (
              <span className="text-gray-400 flex items-center gap-1">
                <LocateFixed size={11} className="animate-pulse" /> Getting your location…
              </span>
            )}
            {locStatus === 'found' && (
              <span className="text-civic-teal flex items-center gap-1">
                <LocateFixed size={11} /> Location captured ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </span>
            )}
            {(locStatus === 'denied' || locStatus === 'unsupported') && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertTriangle size={11} />
                {needsRealAddress
                  ? "Couldn't get your exact location — please type the specific address above."
                  : "Couldn't get your exact location — using the address you typed above."}
              </span>
            )}
          </p>
        </div>

        {/* AI Result */}
        {result && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
              <Sparkles size={14} className="text-civic-teal" />
              <span className="text-sm font-medium">AI Analysis</span>
              <span
                className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${SEV_STYLES[result.severity]}`}
              >
                {result.severity}
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Category</div>
                <div className="font-medium">{result.category}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Department</div>
                <div className="font-medium">{result.department}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Priority score</div>
                <div className="font-medium">{result.priorityScore}/100</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Est. fix time</div>
                <div className="font-medium">{result.estimatedFixDays} days</div>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
                {result.description}
              </div>
              {result.actionRecommendation && (
                <div className="col-span-2 bg-civic-teal-light rounded-lg p-3 text-xs text-civic-teal leading-relaxed">
                  <span className="font-medium">Recommendation: </span>
                  {result.actionRecommendation}
                </div>
              )}
            </div>
            <div className="px-4 pb-4 flex justify-end">
              <button onClick={handleConfirmSubmit} className="btn-primary">
                <CheckCircle size={14} /> Confirm & submit
              </button>
            </div>
          </div>
        )}

        {/* Analyze button */}
        {!result && (
          <button
            onClick={handleSubmitForAnalysis}
            disabled={loading || (!file && !desc.trim()) || needsRealAddress}
            className="btn-primary w-full justify-center py-3"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles size={14} /> Analyze with AI
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
