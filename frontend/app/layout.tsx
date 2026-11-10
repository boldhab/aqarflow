import './globals.css';
import type { Metadata } from 'next';

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
      <body className="antialiased min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
