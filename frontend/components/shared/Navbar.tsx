'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Plus, BarChart2, MessageCircle, Trophy, Star, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const links = [
  { href: '/', label: 'Feed', icon: MapPin },
  { href: '/report', label: 'Report', icon: Plus },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/leaderboard', label: 'Heroes', icon: Trophy },
  { href: '/chat', label: 'Ask AI', icon: MessageCircle },
];

export function Navbar() {
  const path = usePathname();
  const { firebaseUser, profile, loading, signIn, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="w-2 h-2 rounded-full bg-civic-teal inline-block" />
          CivicSense AI
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                path === href
                  ? 'bg-civic-teal-light text-civic-teal font-medium'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div className="w-24 h-7" />
        ) : firebaseUser ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name || 'User avatar'}
                  className="w-6 h-6 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-civic-teal-light text-civic-teal text-xs font-medium flex items-center justify-center">
                  {(profile?.name || firebaseUser.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                {profile?.name || firebaseUser.displayName || 'Civic Hero'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
              <Star size={12} fill="currentColor" />
              {profile?.badge || 'Bronze Hero'} · {profile?.points ?? 0} pts
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="flex items-center gap-1.5 text-sm bg-civic-teal text-white px-3 py-1.5 rounded-lg hover:opacity-90"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
