import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fire Chat',
  description: 'Chat with privacy',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
