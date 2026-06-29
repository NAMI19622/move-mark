import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '../lib/store';

export const metadata: Metadata = {
  title: 'MoveMark | Condition verification for shared spaces',
  description:
    'A semantic condition-verification protocol on GenLayer. Two parties record entry and exit condition snapshots, file a claim, and a GenLayer gate adjudicates whether the claim is supported by the evidence.',
};

export const viewport: Viewport = {
  themeColor: '#14110d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
