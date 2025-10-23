'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { createClient } from '../lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null, data: unknown }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const setAuthData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    setAuthData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      toast({
        title: "Authentication error",
        description: (error as Error)?.message || "Failed to sign in",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      toast({
        title: "Google authentication error",
        description: (error as Error)?.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  // Update user profile with Google information after successful authentication
  useEffect(() => {
    const updateProfileWithGoogleInfo = async () => {
      if (user && user.app_metadata.provider === 'google' && user.user_metadata.full_name) {
        try {
          // Use upsert to create or update the profile in a single operation
          const { error } = await supabase
            .from('user_profiles')
            .upsert(
              { 
                id: user.id,
                full_name: user.user_metadata.full_name,
                updated_at: new Date().toISOString() 
              },
              { 
                onConflict: 'id',
                ignoreDuplicates: false 
              }
            );

          if (error) {
            console.error('Error updating profile with Google info:', error);
          }
        } catch (error) {
          console.error('Error updating profile with Google info:', error);
        }
      }
    };

    if (user) {
      updateProfileWithGoogleInfo();
    }
  }, [user?.id, user?.app_metadata?.provider]);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({
        title: "Account created",
        description: "Check your email for the confirmation link.",
      });
      return { error: null, data };
    } catch (error) {
      toast({
        title: "Sign up error",
        description: (error as Error)?.message || "Failed to sign up",
        variant: "destructive",
      });
      return { error: error as Error, data: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out.",
    });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });
      return { error: null };
    } catch (error) {
      toast({
        title: "Reset password error",
        description: (error as Error)?.message || "Failed to send reset password email",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};