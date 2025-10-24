import { createContext, useContext, useState, useEffect, type ReactNode, useRef } from 'react';
import api from '../axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authCheckRef = useRef(false); // Use ref to track if auth was checked
  const isCheckingRef = useRef(false); // Track if currently checking

  const checkAuth = async () => {
    // Prevent multiple simultaneous calls
    if (authCheckRef.current || isCheckingRef.current) {
      console.log("Auth already checked or in progress, skipping...");
      return;
    }
    
    isCheckingRef.current = true; // Mark as checking
    
    try {
      console.log("Checking authentication status...");
      const response = await api.get('/users/me');
      console.log("Auth check response:", response.data);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        console.log("User authenticated:", response.data.user);
      } else {
        console.log("No authenticated user found");
        setUser(null);
      }
    } catch (error: any) {
      console.log("Authentication check failed:", error.response?.status, error.message);
      setUser(null);
    } finally {
      setLoading(false);
      authCheckRef.current = true; // Mark as checked
      isCheckingRef.current = false; // Mark as done checking
      console.log("Authentication check completed");
    }
  };

  // Check authentication only once on app start
  useEffect(() => {
    checkAuth();
  }, []); // Empty dependency array - only run once

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const response = await api.post('/users/login', { email, password });
      console.log("Login response:", response.data);
      
      if (response.data.user) {
        setUser(response.data.user);
        console.log("User set in context:", response.data.user);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      console.log("Attempting logout...");
      await api.post('/users/logout');
      setUser(null);
      authCheckRef.current = false; // Reset auth check flag for next login
      console.log("Logout successful");
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      authCheckRef.current = false; // Reset auth check flag
      return { success: true };
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};