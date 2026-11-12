import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/shared/hooks';

export const metadata: Metadata = {
  title: 'AqarFlow - Real Estate Management Platform',
  description: 'Modular Real Estate Operations & CRM Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-ivory">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
