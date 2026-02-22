import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const initializeAuth = async () => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Auth initialization timeout")), 5000)
            );

            try {
                const { data: { session }, error } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]);

                if (error) throw error; // Catch Supabase API errors

                if (session?.user) {
                    // Fetch profile data from Supabase
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) throw profileError;

                    const mergedUser = { ...session.user, ...profile };
                    setUser(mergedUser);
                    setIsAuthenticated(true);
                    // Keep local storage for synchronous access in other parts of the app if needed
                    localStorage.setItem('mera_user', JSON.stringify(mergedUser));
                } else {
                    // Fallback check local storage for existing session
                    const storedUser = localStorage.getItem('mera_user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                        setIsAuthenticated(true);
                    }
                }
            } catch (err) {
                console.error("Auth initialization failed (check Supabase Envs):", err);
                // Fallback check local storage for existing session on network failure
                const storedUser = localStorage.getItem('mera_user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initializeAuth();

        let subscription;
        try {
            const result = supabase.auth.onAuthStateChange(async (event, session) => {
                if (!isMounted) return;
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    const mergedUser = { ...session.user, ...profile };
                    setUser(mergedUser);
                    setIsAuthenticated(true);
                    localStorage.setItem('mera_user', JSON.stringify(mergedUser));
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setIsAuthenticated(false);
                    localStorage.removeItem('mera_user');
                }
            });
            subscription = result.data.subscription;
        } catch (err) {
            console.error("Auth subscription failed:", err);
        }

        return () => {
            isMounted = false;
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        // Fallback for current app design which seems to pass a user object directly
        if (typeof email === 'object') {
            setUser(email);
            setIsAuthenticated(true);
            localStorage.setItem('mera_user', JSON.stringify(email));
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('mera_user');
    };

    const value = {
        user,
        isAuthenticated,
        login,
        logout,
        isLoading
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 font-bold">Initializing Méra OS...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
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
