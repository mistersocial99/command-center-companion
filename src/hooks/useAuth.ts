import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/providers/AuthProvider';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth moet binnen een AuthProvider gebruikt worden');
  }

  return context;
}
