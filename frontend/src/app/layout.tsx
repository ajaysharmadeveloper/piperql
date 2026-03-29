import type { Metadata } from 'next';
/* highlight.js theme is defined in globals.css for theme awareness */
import './globals.css';

export const metadata: Metadata = {
  title: 'PiperQL',
  description: 'Chat with your PostgreSQL databases using natural language',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="auto" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">{children}</body>
    </html>
  );
}
