import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import ClientLayout from '@/components/ClientLayout'
import { AuthProviderWrapper } from '@/components/providers/AuthProviderWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Agent Dashboard',
  description: 'AI Agent Dashboard built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProviderWrapper>
          <ClientLayout>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
            </div>
          </ClientLayout>
          <Toaster />
        </AuthProviderWrapper>
      </body>
    </html>
  )
}