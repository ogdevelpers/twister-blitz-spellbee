import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Twister Blitz',
  description: 'A fun tongue twister game powered by Gemini AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

