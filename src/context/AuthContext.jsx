import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch profile data from Supabase
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

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
            setIsLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

        return () => subscription.unsubscribe();
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

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
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
