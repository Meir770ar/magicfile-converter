import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rabbi Eitan - Dashboard',
  description: 'Tanya Automation System Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans">
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
