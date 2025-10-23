'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error during auth callback:', error)
        toast({
          title: "Authentication Failed",
          description: error.message || "An error occurred during authentication. Please try again.",
          variant: "destructive",
        })
        router.push('/auth/login')
        return
      }

      if (data.session) {
        toast({
          title: "Authentication Successful",
          description: "You have been successfully authenticated.",
        })
        router.push('/')
      } else {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue.",
          variant: "default",
        })
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}