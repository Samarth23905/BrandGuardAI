import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organisation, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  organisation: Organisation | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User, org?: Organisation) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('brandguard_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('brandguard_token');
      if (savedToken) {
        try {
          const { user } = await authService.getMe();
          setUser(user);
          if (user.organisationId) {
            setOrganisation(typeof user.organisationId === 'object' ? user.organisationId : null);
          }
        } catch (err) {
          console.error('[AuthContext] Session validation failed:', err);
          localStorage.removeItem('brandguard_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User, newOrg?: Organisation) => {
    localStorage.setItem('brandguard_token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newOrg) {
      setOrganisation(newOrg);
    }
  };

  const logout = () => {
    localStorage.removeItem('brandguard_token');
    setToken(null);
    setUser(null);
    setOrganisation(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const { user } = await authService.getMe();
      setUser(user);
    } catch (err) {
      console.error('[AuthContext] refreshUser error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organisation,
        role: user?.role || null,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
