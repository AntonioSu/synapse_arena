import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Synapse Arena - AI辩论竞技场',
  description: 'AI-powered debate arena',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  )
}
