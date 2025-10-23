'use client'

import { AuthProvider } from '@/hooks/useAuth'

interface AuthProviderWrapperProps {
  children: React.ReactNode
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>
}