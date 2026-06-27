import type { Metadata } from 'next';
import './globals.css';
import { AdminProviders } from './providers';

export const metadata: Metadata = {
  title: 'Powerlytic Admin',
  description: 'Powerlytic Internal Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AdminProviders>{children}</AdminProviders></body>
    </html>
  );
}
