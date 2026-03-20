import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Synapse Arena - AI辩论竞技场',
  description: 'AI-powered debate arena',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${mono.variable} scroll-smooth`}>
      <body className="bg-black text-white antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
