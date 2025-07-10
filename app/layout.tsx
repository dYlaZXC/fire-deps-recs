import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fire Infrastructure Dashboard',
  description: 'Strategic analysis and optimization of fire safety infrastructure',
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
