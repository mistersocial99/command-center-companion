import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

export interface AuthContextType {
  session: Session | null;
  authUser: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  isAdmin: boolean;
  isManager: boolean;
  isMedewerker: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, departments(naam)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Fout bij ophalen profiel:', error);
      return null;
    }
    return data as User;
  }, []);

  useEffect(() => {
    // Initieel: haal bestaande sessie op
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setAuthUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const userProfile = await fetchProfile(currentSession.user.id);
        setProfile(userProfile);
      }

      setLoading(false);
    });

    // Luister naar auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);

      if (newSession?.user) {
        const userProfile = await fetchProfile(newSession.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Ongeldige inloggegevens' };
        }
        if (error.message.includes('rate limit')) {
          return {
            error:
              'Te veel pogingen. Probeer het over 15 minuten opnieuw.',
          };
        }
        return { error: 'Er ging iets mis bij het inloggen.' };
      }

      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        return { error: 'Er ging iets mis. Probeer het opnieuw.' };
      }

      return { error: null };
    },
    []
  );

  const value: AuthContextType = {
    session,
    authUser,
    profile,
    loading,
    signIn,
    signOut,
    resetPassword,
    isAdmin: profile?.rol === 'admin',
    isManager: profile?.rol === 'manager',
    isMedewerker: profile?.rol === 'medewerker',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
