import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/shared/Navbar';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
  title: 'CivicSense AI — Community Hero',
  description: 'AI-powered hyperlocal civic issue reporting and resolution platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}