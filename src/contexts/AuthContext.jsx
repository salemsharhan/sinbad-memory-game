import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser, getTeacherProfile } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    let timeoutId = null;

    // Safety timeout to ensure loading always resolves
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!mounted) return;
        
        setUser(currentUser);
        
        if (currentUser) {
          console.log('[AuthContext] Current user found, fetching teacher profile...');
          try {
            const teacherProfile = await getTeacherProfile(currentUser.id);
            console.log('[AuthContext] Teacher profile result:', teacherProfile);
            if (mounted) {
              setTeacher(teacherProfile);
            }
          } catch (profileError) {
            console.error('[AuthContext] Error getting teacher profile:', profileError);
            console.error('[AuthContext] Error stack:', profileError.stack);
            // Don't block loading if teacher profile fails
            if (mounted) {
              setTeacher(null);
            }
          }
        } else {
          console.log('[AuthContext] No current user found');
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          if (session?.user) {
            setUser(session.user);
            try {
              const teacherProfile = await getTeacherProfile(session.user.id);
              if (mounted) {
                setTeacher(teacherProfile);
              }
            } catch (profileError) {
              console.error('Error getting teacher profile on auth change:', profileError);
              if (mounted) {
                setTeacher(null);
              }
            }
          } else {
            setUser(null);
            setTeacher(null);
          }
          if (mounted) {
            setLoading(false);
          }
        }
      );
      subscription = data.subscription;
    } catch (err) {
      console.error('Error setting up auth listener:', err);
      setLoading(false);
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setTeacher(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    teacher,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
